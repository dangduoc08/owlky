/**
 * Gantt export (ADR-0048 phase 3): an SVG file of the whole chart (every row, the task list and
 * the timeline, colors read from the page), a PNG of it, or the data table as CSV. Built with DOM
 * methods from the rendered markup's positions (the `--_ok-gantt-*` properties), never measured
 * on screen, so a scrolled or virtualized Gantt exports the same file. Downloads need a user
 * gesture, like the Chart's.
 */
import { chartCsv, chartFileName, gesture, pngOf, save } from "../chart/chart-export.js";
import type { GanttLayout, GanttNode } from "./gantt-render.js";

export type GanttExportFormat = "svg" | "png" | "csv";
export const ganttExportFormats: readonly GanttExportFormat[] = ["svg", "png", "csv"];

const NS = "http://www.w3.org/2000/svg";
const PAD = 8;

const px = (value: string | undefined) => Number.parseFloat(value ?? "") || 0;

/** Every node of a tree, depth first. */
const all = (nodes: readonly GanttNode[]): GanttNode[] =>
  nodes.flatMap((node) => [node, ...all(node.children ?? [])]);

function svgEl(tag: string, attrs: Record<string, string | number>, text?: string): SVGElement {
  const element = document.createElementNS(NS, tag);
  for (const [name, value] of Object.entries(attrs)) element.setAttribute(name, String(value));
  if (text !== undefined) element.textContent = text;
  return element;
}

export interface GanttExportColors {
  readonly paper: string;
  readonly text: string;
  readonly secondary: string;
  readonly divider: string;
  readonly head: string;
  /** Bar colors by task id: fill and soft fill. */
  readonly bars: ReadonlyMap<string, readonly [main: string, soft: string]>;
  /** Paints of the background SVG's parts, by part attribute. */
  readonly parts: ReadonlyMap<string, { fill: string; stroke: string; dash: string }>;
}

/** The colors of a drawn Gantt, read from its computed styles. */
export function ganttExportColors(root: HTMLElement): GanttExportColors {
  const style = getComputedStyle(root);
  const read = (name: string) => style.getPropertyValue(name).trim();
  const bars = new Map<string, readonly [string, string]>();
  for (const bar of root.querySelectorAll<HTMLElement>("[data-ok-gantt-row] [data-ok-gantt-bar]")) {
    const own = getComputedStyle(bar);
    const id = bar.closest("[data-ok-gantt-row]")?.getAttribute("data-ok-task-id") as string;
    bars.set(id, [
      own.getPropertyValue("--_ok-gantt-c").trim(),
      own.getPropertyValue("--_ok-gantt-c-soft").trim(),
    ]);
  }
  const parts = new Map<string, { fill: string; stroke: string; dash: string }>();
  for (const part of root.querySelectorAll("[data-ok-gantt-canvas] path")) {
    const own = getComputedStyle(part);
    const key = [...part.attributes].find((a) => a.name.startsWith("data-ok-gantt-"))
      ?.name as string;
    const link = part.closest("[data-ok-gantt-link]");
    const name = link?.hasAttribute("data-ok-critical") ? `${key}-critical` : key;
    if (!parts.has(name))
      parts.set(name, {
        fill: own.getPropertyValue("fill"),
        stroke: own.getPropertyValue("stroke"),
        dash: own.getPropertyValue("stroke-dasharray"),
      });
  }
  return {
    paper: read("--ok-bg-paper"),
    text: read("--ok-text-primary"),
    secondary: read("--ok-text-secondary"),
    divider: read("--ok-divider"),
    head: read("--ok-bg-neutral"),
    bars,
    parts,
  };
}

/**
 * The whole Gantt as a standalone SVG document: the task list and the timeline of every visible
 * row (the layout must be rendered without a row window), in the page's colors.
 */
export function ganttSvgText(layout: GanttLayout, colors: GanttExportColors): string {
  const nodes = all(layout.nodes);
  const grid = nodes.find((node) => node.attrs["role"] === "treegrid") as GanttNode;
  const style = grid.style as Readonly<Record<string, string>>;
  const row = px(style["--_ok-gantt-row"]);
  const margin = px(style["--_ok-gantt-bar-margin"]);
  const list = px(style["--_ok-gantt-list"]);
  const timeline = px(style["--_ok-gantt-timeline"]);
  const head = 56;
  const rows = nodes.filter((node) => node.attrs["data-ok-gantt-row"] !== undefined);
  const width = list + timeline;
  const height = head + rows.length * row;
  const svg = svgEl("svg", {
    xmlns: NS,
    width,
    height,
    viewBox: `0 0 ${width} ${height}`,
    "font-family": "system-ui, sans-serif",
    "font-size": 13,
  });
  svg.append(svgEl("rect", { width: "100%", height: "100%", fill: colors.paper }));
  svg.append(svgEl("rect", { width, height: head, fill: colors.head }));
  // Header: column titles, then the two tiers of ticks.
  const columns = nodes.filter(
    (node) =>
      node.attrs["role"] === "columnheader" && node.attrs["data-ok-gantt-column"] !== "timeline",
  );
  for (const column of columns)
    svg.append(
      svgEl(
        "text",
        {
          x: px(column.style?.["--_ok-gantt-left"]) + PAD,
          y: head / 2 + 4,
          fill: colors.secondary,
          "font-weight": 600,
        },
        column.text,
      ),
    );
  for (const [index, tier] of ["top", "bottom"].entries()) {
    const ticks = (nodes.find((node) => node.attrs["data-ok-gantt-tier"] === tier) as GanttNode)
      .children as readonly GanttNode[];
    for (const tick of ticks) {
      const x = list + px(tick.style?.["--_ok-gantt-x"]);
      svg.append(
        svgEl(
          "text",
          { x: x + 6, y: index * 28 + 18, fill: colors.secondary, "font-size": 12 },
          tick.text,
        ),
      );
      svg.append(
        svgEl("path", { d: `M${x} ${index * 28}V${index * 28 + 28}`, stroke: colors.divider }),
      );
    }
  }
  svg.append(svgEl("path", { d: `M0 ${head - 0.5}H${width}M0 28.5H0`, stroke: colors.divider }));
  // The background drawing (grid, weekends, today, links), moved under the header.
  const canvas = nodes.find(
    (node) => node.attrs["data-ok-gantt-canvas"] !== undefined,
  ) as GanttNode;
  const group = svgEl("g", { transform: `translate(${list} ${head})` });
  const draw = (node: GanttNode, parent: Element, critical: boolean) => {
    if (node.tag === "g") {
      const g = svgEl("g", {});
      parent.append(g);
      for (const child of node.children as readonly GanttNode[])
        draw(child, g, critical || node.attrs["data-ok-critical"] !== undefined);
      return;
    }
    const key = Object.keys(node.attrs).find((name) => name.startsWith("data-ok-gantt-")) as string;
    const paint = colors.parts.get(critical ? `${key}-critical` : key) ?? colors.parts.get(key);
    parent.append(
      svgEl("path", {
        d: node.attrs["d"] as string,
        fill: paint?.fill ?? "none",
        stroke: paint?.stroke ?? "none",
        ...(paint?.dash && paint.dash !== "none" ? { "stroke-dasharray": paint.dash } : {}),
      }),
    );
  };
  for (const child of canvas.children as readonly GanttNode[]) draw(child, group, false);
  svg.append(group);
  // Rows: task-list texts and bars.
  rows.forEach((rowNode, i) => {
    const top = head + i * row;
    const id = rowNode.key as string;
    for (const cell of rowNode.children as readonly GanttNode[]) {
      const key = cell.attrs["data-ok-gantt-cell"];
      const left = px(cell.style?.["--_ok-gantt-left"]);
      if (key === "timeline") {
        for (const part of cell.children as readonly GanttNode[])
          drawBar(svg, part, id, list, top, row, margin, colors);
        continue;
      }
      const text =
        key === "name"
          ? (
              (cell.children as readonly GanttNode[]).find(
                (child) => child.attrs["data-ok-gantt-name"] !== undefined,
              ) as GanttNode
            ).text
          : (cell.text as string);
      const indent = key === "name" ? px(cell.style?.["--_ok-gantt-indent"]) + 24 : 0;
      svg.append(
        svgEl(
          "text",
          {
            x: left + PAD + indent,
            y: top + row / 2 + 4,
            fill: colors.text,
            ...(rowNode.attrs["data-ok-type"] === "summary" ? { "font-weight": 600 } : {}),
          },
          text,
        ),
      );
    }
    svg.append(svgEl("path", { d: `M0 ${top + row - 0.5}H${list}`, stroke: colors.divider }));
  });
  svg.append(svgEl("path", { d: `M${list - 0.5} 0V${height}`, stroke: colors.divider }));
  return new XMLSerializer().serializeToString(svg);
}

function drawBar(
  svg: SVGElement,
  part: GanttNode,
  id: string,
  list: number,
  top: number,
  row: number,
  margin: number,
  colors: GanttExportColors,
) {
  const x = list + px(part.style?.["--_ok-gantt-x"]);
  const [main = colors.secondary, soft = colors.divider] = colors.bars.get(id) ?? [];
  if (part.attrs["data-ok-gantt-label"] !== undefined) {
    const left = part.attrs["data-ok-gantt-label"] === "left";
    svg.append(
      svgEl(
        "text",
        {
          x: left ? x - PAD : x + PAD,
          y: top + row / 2 + 4,
          fill: colors.text,
          "font-size": 12,
          ...(left ? { "text-anchor": "end" } : {}),
        },
        part.text,
      ),
    );
    return;
  }
  const height = row - margin * 2;
  if (part.attrs["data-ok-gantt-baseline"] !== undefined) {
    const w = px(part.style?.["--_ok-gantt-w"]);
    svg.append(
      svgEl("rect", {
        x,
        y: top + row - margin - 4,
        width: w,
        height: 4,
        rx: 2,
        fill: colors.secondary,
      }),
    );
    return;
  }
  const type = part.attrs["data-ok-type"];
  if (type === "milestone") {
    const cy = top + row / 2;
    const r = height / 2;
    svg.append(
      svgEl("path", {
        d: `M${x} ${cy - r}L${x + r} ${cy}L${x} ${cy + r}L${x - r} ${cy}Z`,
        fill: main,
      }),
    );
    return;
  }
  const w = px(part.style?.["--_ok-gantt-w"]);
  const progress = px(part.style?.["--_ok-gantt-progress"]);
  const summary = type === "summary";
  const h = summary ? 12 : height;
  const y = summary ? top + row / 2 - 6 : top + margin;
  svg.append(svgEl("rect", { x, y, width: w, height: h, rx: summary ? 2 : 6, fill: soft }));
  if (progress > 0)
    svg.append(
      svgEl("rect", {
        x,
        y,
        width: (w * progress) / 100,
        height: h,
        rx: summary ? 2 : 6,
        fill: main,
      }),
    );
  const label = part.children?.find((child) => child.attrs["data-ok-gantt-bar-text"] !== undefined);
  if (label)
    svg.append(
      svgEl(
        "text",
        { x: x + PAD, y: top + row / 2 + 4, fill: colors.text, "font-size": 12 },
        label.text,
      ),
    );
}

/**
 * Downloads the Gantt as SVG, PNG or CSV (the data table). `layout` is a render of every visible
 * row (owners pass one without a row window). Rejects outside a user gesture.
 */
export async function exportGantt(
  root: HTMLElement,
  layout: GanttLayout,
  format: GanttExportFormat,
): Promise<void> {
  if (!gesture()) throw new DOMException("Downloads need a user gesture.", "NotAllowedError");
  if (!ganttExportFormats.includes(format)) throw new TypeError(`Unknown format: ${format}`);
  const table = root.querySelector<HTMLTableElement>(":scope > [data-ok-gantt-data]");
  const name = chartFileName(table?.caption?.textContent?.trim() || "gantt");
  if (format === "csv") {
    if (!table) throw new Error("The Gantt has no data table.");
    save(new Blob([`﻿${chartCsv(table)}`], { type: "text/csv" }), `${name}.csv`);
    return;
  }
  const text = ganttSvgText(layout, ganttExportColors(root));
  if (format === "svg") save(new Blob([text], { type: "image/svg+xml" }), `${name}.svg`);
  else save(await pngOf(text), `${name}.png`);
}
