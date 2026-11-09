/*
 * Chart export (ADR-0031, phase 4): the drawn SVG (paints inlined from the computed styles, so the
 * file looks like the page), a PNG of it, or the data table as CSV. Shared by React and the HTML
 * runtime: both pass the chart's `figure`. Downloads start only during a user gesture.
 */

export type ChartExportFormat = "svg" | "png" | "csv";
export const chartExportFormats: readonly ChartExportFormat[] = ["svg", "png", "csv"];

/** Presentation properties copied onto the exported SVG (they come from the stylesheet). */
const PAINT = [
  "fill",
  "fill-opacity",
  "stroke",
  "stroke-width",
  "stroke-dasharray",
  "stroke-opacity",
  "stroke-linecap",
  "stroke-linejoin",
  "stop-color",
  "stop-opacity",
  "opacity",
  "font-family",
  "font-size",
  "font-weight",
] as const;

const SVG_NS = "http://www.w3.org/2000/svg";

/** A file name from the chart's name: "Monthly sales" → "monthly-sales". */
export function chartFileName(name: string): string {
  const slug = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return slug || "chart";
}

/** A CSV field: quoted when needed; text that a spreadsheet would run as a formula is escaped. */
const field = (text: string) => {
  const numeric = /^[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?$/i.test(text);
  const safe = !numeric && /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

/**
 * The data table as CSV: one header line (a value's column is "Series (Part)"), then one line per
 * row. Cells give their raw value (`data-ok-value`) when they have one.
 */
export function chartCsv(table: HTMLTableElement): string {
  const grid: string[][] = [];
  const rows = [...table.rows];
  rows.forEach((row, r) => {
    grid[r] ??= [];
    let column = 0;
    for (const cell of row.cells) {
      while (grid[r]?.[column] !== undefined) column++;
      const text = cell.getAttribute("data-ok-value") ?? cell.textContent?.trim() ?? "";
      for (let dr = 0; dr < Math.max(1, cell.rowSpan); dr++)
        for (let dc = 0; dc < Math.max(1, cell.colSpan); dc++) {
          grid[r + dr] ??= [];
          (grid[r + dr] as string[])[column + dc] = text;
        }
      column += Math.max(1, cell.colSpan);
    }
  });
  const heads = table.tHead ? table.tHead.rows.length : 1;
  const head = grid.slice(0, heads);
  const width = Math.max(0, ...grid.map((line) => line.length));
  const header = Array.from({ length: width }, (_, c) => {
    const names = [...new Set(head.map((line) => line[c] ?? "").filter(Boolean))];
    return names.length > 1 ? `${names[0]} (${names.slice(1).join(", ")})` : (names[0] ?? "");
  });
  const body = grid
    .slice(heads)
    .map((line) => Array.from({ length: width }, (_, c) => line[c] ?? ""));
  return [header, ...body].map((line) => line.map(field).join(",")).join("\r\n");
}

/** The chart's SVG as a standalone file: computed paints inlined, the paper as background. */
export function chartSvgText(figure: HTMLElement): string {
  const svg = figure.querySelector<SVGSVGElement>("[data-ok-chart-svg]");
  if (!svg) throw new Error("The chart is not drawn.");
  const clone = svg.cloneNode(true) as SVGSVGElement;
  const live = [svg, ...svg.querySelectorAll("*")];
  const copies = [clone, ...clone.querySelectorAll("*")];
  live.forEach((element, i) => {
    const copy = copies[i] as Element;
    const style = getComputedStyle(element);
    for (const name of PAINT) {
      const value = style.getPropertyValue(name);
      if (value) copy.setAttribute(name, value);
    }
  });
  const [, , width = "640", height = "320"] = (svg.getAttribute("viewBox") ?? "").split(" ");
  clone.setAttribute("xmlns", SVG_NS);
  clone.setAttribute("width", width);
  clone.setAttribute("height", height);
  clone.removeAttribute("aria-hidden");
  const paper = getComputedStyle(figure).getPropertyValue("--ok-bg-paper").trim();
  const background = document.createElementNS(SVG_NS, "rect");
  background.setAttribute("width", "100%");
  background.setAttribute("height", "100%");
  background.setAttribute("fill", paper || "#ffffff");
  clone.prepend(background);
  return new XMLSerializer().serializeToString(clone);
}

/** Draws an SVG file on a canvas (at twice its size, for sharp screens) and returns a PNG. */
export async function pngOf(svgText: string): Promise<Blob> {
  const url = URL.createObjectURL(new Blob([svgText], { type: "image/svg+xml" }));
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth * 2;
    canvas.height = image.naturalHeight * 2;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("No canvas.");
    context.scale(2, 2);
    context.drawImage(image, 0, 0);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("No PNG."))), "image/png"),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Saves a file through a temporary download link (a URL we made, never one from input). */
export function save(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.hidden = true;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Whether the page is handling a user gesture (no gesture API: assumed, as before it existed). */
export const gesture = () => {
  const activation = (navigator as { userActivation?: { isActive: boolean } }).userActivation;
  return activation ? activation.isActive : true;
};

/**
 * Downloads the chart as SVG, PNG or CSV. Rejects (and downloads nothing) outside a user gesture
 * (a click or a key press), when the chart isn't drawn, or when the browser can't make the file.
 */
export async function exportChart(figure: HTMLElement, format: ChartExportFormat): Promise<void> {
  if (!gesture()) throw new DOMException("Downloads need a user gesture.", "NotAllowedError");
  if (!chartExportFormats.includes(format)) throw new TypeError(`Unknown format: ${format}`);
  const table = figure.querySelector<HTMLTableElement>(":scope > [data-ok-chart-data]");
  const name = chartFileName(table?.caption?.textContent?.trim() ?? "");
  if (format === "csv") {
    if (!table) throw new Error("The chart has no data table.");
    save(new Blob([`﻿${chartCsv(table)}`], { type: "text/csv" }), `${name}.csv`);
    return;
  }
  const text = chartSvgText(figure);
  if (format === "svg") save(new Blob([text], { type: "image/svg+xml" }), `${name}.svg`);
  else save(await pngOf(text), `${name}.png`);
}
