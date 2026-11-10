import type { ChartFormat } from "./chart-format.js";
import {
  type ChartDirection,
  type ChartEdgeStyle,
  type ChartHierarchy,
  type ChartLayoutType,
  type ChartTreeAxis,
  type ChartTreeMark,
  chartHierarchyRows,
  chartHierarchyTitle,
} from "./chart-hierarchy.js";
import {
  type ChartLayout,
  type ChartMark,
  type ChartNode,
  chartTextWidth,
  FONT,
  fmt,
  node,
  r2,
} from "./chart-layout.js";
import { polarPoint } from "./chart-polar.js";
import { fitChartText } from "./chart-sankey.js";

/*
 * Tree charts (ADR-0058, ApexTree `layoutType`): a tidy tree (Reingold–Tilford in Buchheim,
 * Jünger and Leipert's linear time) or a dendrogram (`cluster`: leaves on one level), drawn from
 * the top, bottom, left or right, or around a center (`radial`: breadth becomes the angle, depth
 * the radius). Positions are computed, never measured, so server, React and HTML agree.
 */

export interface ChartTreeOptions {
  readonly width: number;
  readonly height: number;
  readonly direction?: ChartDirection | undefined;
  readonly layoutType?: ChartLayoutType | undefined;
  readonly edgeStyle?: ChartEdgeStyle | undefined;
  /** Node radius in px. Default 5. */
  readonly markerSize?: number | undefined;
  /** Ids of the nodes whose children are hidden. */
  readonly collapsed?: readonly string[] | undefined;
  /** Enter and clicks expand and collapse nodes. */
  readonly expandCollapse?: boolean | undefined;
  /** Prints each node's value after its name. */
  readonly dataLabels?: boolean | undefined;
  /** Radial trees: where the breadth starts and ends, in degrees clockwise from 12 o'clock. */
  readonly startAngle?: number | undefined;
  readonly endAngle?: number | undefined;
}

/** A node of the Buchheim walk (`z` prelim, `m` mod, `c` change, `s` shift, `t` thread). */
interface Walk {
  readonly item: number;
  readonly parent: Walk | null;
  readonly children: Walk[];
  readonly index: number;
  readonly depth: number;
  a: Walk;
  A: Walk | null;
  z: number;
  m: number;
  c: number;
  s: number;
  t: Walk | null;
  x: number;
}

const walkOf = (item: number, parent: Walk | null, index: number, depth: number): Walk => {
  const walk = {
    item,
    parent,
    children: [],
    index,
    depth,
    A: null,
    z: 0,
    m: 0,
    c: 0,
    s: 0,
    t: null,
    x: 0,
  } as unknown as Walk;
  walk.a = walk;
  return walk;
};

const nextLeft = (v: Walk) => (v.children.length ? (v.children[0] as Walk) : v.t);
const nextRight = (v: Walk) => (v.children.length ? (v.children.at(-1) as Walk) : v.t);
function moveSubtree(wm: Walk, wp: Walk, shift: number) {
  const change = shift / (wp.index - wm.index);
  wp.c -= change;
  wp.s += shift;
  wm.c += change;
  wp.z += shift;
  wp.m += shift;
}
function executeShifts(v: Walk) {
  let shift = 0;
  let change = 0;
  for (let i = v.children.length - 1; i >= 0; i--) {
    const w = v.children[i] as Walk;
    w.z += shift;
    w.m += shift;
    change += w.c;
    shift += w.s + change;
  }
}
const nextAncestor = (vim: Walk, v: Walk, ancestor: Walk) =>
  vim.a.parent === v.parent ? vim.a : ancestor;

/**
 * Tidy tree x positions (Buchheim, Jünger and Leipert, "Improving Walker's algorithm to run in
 * linear time"): subtrees as close as `separation` allows, parents centered over their children.
 */
function tidy(root: Walk, separation: (a: Walk, b: Walk) => number) {
  const apportion = (v: Walk, w: Walk | null, ancestor: Walk): Walk => {
    if (!w) return ancestor;
    let vip: Walk | null = v;
    let vop: Walk = v;
    let vim: Walk | null = w;
    let vom: Walk = (v.parent as Walk).children[0] as Walk;
    let sip = vip.m;
    let sop = vop.m;
    let sim = vim.m;
    let som = vom.m;
    let next = ancestor;
    for (;;) {
      vim = nextRight(vim);
      vip = nextLeft(vip);
      if (!vim || !vip) break;
      vom = nextLeft(vom) as Walk;
      vop = nextRight(vop) as Walk;
      vop.a = v;
      const shift = vim.z + sim - vip.z - sip + separation(vim, vip);
      if (shift > 0) {
        moveSubtree(nextAncestor(vim, v, next), v, shift);
        sip += shift;
        sop += shift;
      }
      sim += vim.m;
      sip += vip.m;
      som += vom.m;
      sop += vop.m;
    }
    if (vim && !nextRight(vop)) {
      vop.t = vim;
      vop.m += sim - sop;
    }
    if (vip && !nextLeft(vom)) {
      vom.t = vip;
      vom.m += sip - som;
      next = v;
    }
    return next;
  };
  const first = (v: Walk) => {
    for (const child of v.children) first(child);
    const parent = v.parent;
    if (!parent) return;
    const siblings = parent.children;
    const w = v.index ? (siblings[v.index - 1] as Walk) : null;
    if (v.children.length) {
      executeShifts(v);
      const mid = ((v.children[0] as Walk).z + (v.children.at(-1) as Walk).z) / 2;
      if (w) {
        v.z = w.z + separation(v, w);
        v.m = v.z - mid;
      } else v.z = mid;
    } else if (w) v.z = w.z + separation(v, w);
    parent.A = apportion(v, w, parent.A ?? (siblings[0] as Walk));
  };
  const second = (v: Walk, mod: number) => {
    v.x = v.z + mod;
    for (const child of v.children) second(child, mod + v.m);
  };
  // `root` is the only child of a sentinel (its `parent`): the walk centers it too.
  first(root);
  second(root, -root.z);
}

/** Dendrogram x positions: leaves one `separation` apart in order, parents at their children's mean. */
function cluster(root: Walk, separation: (a: Walk, b: Walk) => number) {
  let previous: Walk | null = null;
  let x = 0;
  const visit = (v: Walk) => {
    if (v.children.length) {
      for (const child of v.children) visit(child);
      v.x = v.children.reduce((sum, child) => sum + child.x, 0) / v.children.length;
      return;
    }
    if (previous) x += separation(v, previous);
    v.x = x;
    previous = v;
  };
  visit(root);
}

/** Room between a node and its label in px. */
const GAP = 4;
/** Least room for a label in px (two characters and an ellipsis). */
const MIN_LABEL = 26;
/** Whether a label has room: all of it, or at least two characters and an ellipsis. */
const fits = (room: number, text: string) => room >= Math.min(MIN_LABEL, chartTextWidth(text));

/** Lays out a tree chart (same contract as `layoutChart`; tooltips are computed here). */
export function layoutTree(
  hierarchy: ChartHierarchy,
  options: ChartTreeOptions,
  format: ChartFormat,
): ChartLayout {
  const width = Math.max(40, Math.round(options.width));
  const height = Math.max(40, Math.round(options.height));
  const direction = options.direction ?? "top";
  const radial = direction === "radial";
  const r = Math.max(2, Math.min(options.markerSize ?? 5, 20));
  const collapsed = new Set(options.collapsed ?? []);
  const { items } = hierarchy;

  // The visible tree under a virtual root (several roots lay out side by side), itself the only
  // child of the walk's sentinel.
  const top = walkOf(-2, null, 0, -2);
  const sentinel = walkOf(-1, top, 0, -1);
  top.children.push(sentinel);
  const walks: Walk[] = [];
  const build = (item: number, parent: Walk, index: number) => {
    const entry = items[item];
    if (!entry) return;
    const walk = walkOf(item, parent, index, parent.depth + 1);
    parent.children.push(walk);
    walks.push(walk);
    if (collapsed.has(entry.id)) return;
    entry.children.forEach((child, i) => {
      build(child, walk, i);
    });
  };
  hierarchy.roots.forEach((root, i) => {
    build(root, sentinel, i);
  });
  const maxDepth = Math.max(0, ...walks.map((walk) => walk.depth));
  // Siblings one unit apart, cousins two; radial trees divide by depth (more room outside).
  const separation = (a: Walk, b: Walk) =>
    (a.parent === b.parent ? 1 : 2) / (radial ? Math.max(1, a.depth + 1) : 1);
  if (options.layoutType === "cluster") cluster(sentinel, separation);
  else tidy(sentinel, separation);
  const leaves = walks.filter((walk) => walk.children.length === 0);
  const minX = Math.min(0, ...walks.map((walk) => walk.x));
  const maxX = Math.max(0, ...walks.map((walk) => walk.x));
  const span = walks.length ? maxX - minX : 0;
  /** Depth of a walk as drawn: dendrograms put leaves on the last level. */
  const levelOf = (walk: Walk) =>
    options.layoutType === "cluster" && walk.children.length === 0 ? maxDepth : walk.depth;

  const labelText = (item: number) => {
    const entry = items[item] as (typeof items)[number];
    return options.dataLabels && hierarchy.hasValues
      ? `${entry.name} ${format.dataLabel(entry.value, 0, item, format.value(entry.value, 0))}`
      : entry.name;
  };
  const widest = (list: readonly Walk[]) =>
    Math.max(0, ...list.map((walk) => chartTextWidth(labelText(walk.item))));

  // Positions: `b` across the depth (0 to 1), `d` the level.
  const across = (walk: Walk) => (span > 0 ? (walk.x - minX) / span : 0.5);
  const at = new Map<Walk, { x: number; y: number; angle: number; radius: number }>();
  let axis: ChartTreeAxis = "down";
  if (radial) {
    axis = "radial";
    const start = options.startAngle ?? 0;
    const sweep = Math.max(1, Math.min((options.endAngle ?? 360) - start, 360));
    const full = sweep >= 359.99;
    const cx = width / 2;
    const cy = height / 2;
    const half = Math.min(width, height) / 2;
    const leafRoom = Math.min(widest(leaves) + GAP + 2, half * 0.35);
    const outer = Math.max(10, half - leafRoom - r - GAP);
    // A full turn leaves a gap of one leaf spacing between the last and the first leaf.
    const unit = span / Math.max(1, leaves.length - 1) || 1;
    for (const walk of walks) {
      const t = span > 0 ? (full ? (walk.x - minX + unit / 2) / (span + unit) : across(walk)) : 0.5;
      const angle = start + t * sweep;
      const radius = maxDepth > 0 ? (levelOf(walk) / maxDepth) * outer : 0;
      const [x, y] = polarPoint(cx, cy, radius, angle);
      at.set(walk, { x, y, angle, radius });
    }
  } else {
    const vertical = direction === "top" || direction === "bottom";
    axis =
      direction === "top"
        ? "down"
        : direction === "bottom"
          ? "up"
          : direction === "left"
            ? "right"
            : "left";
    if (vertical) {
      const margin = Math.max(r + 2, Math.min(widest(walks) / 2, width * 0.15));
      const near = r + 2;
      const far = r + GAP + FONT + 4;
      for (const walk of walks) {
        const b = margin + across(walk) * (width - margin * 2);
        const level = maxDepth > 0 ? levelOf(walk) / maxDepth : 0.5;
        const d =
          direction === "top"
            ? near + level * (height - near - far)
            : height - near - level * (height - near - far);
        at.set(walk, { x: b, y: d, angle: 0, radius: 0 });
      }
    } else {
      const roots = walks.filter((walk) => walk.depth === 0);
      // Internal labels sit before their node, leaves' after it.
      const inner = r + 2 + Math.min(widest(roots) + GAP + 2, width * 0.2);
      const outer = r + 2 + Math.min(widest(leaves) + GAP + 2, width * 0.3);
      const pad = Math.max(r + 2, FONT / 2 + 2);
      for (const walk of walks) {
        const level = maxDepth > 0 ? levelOf(walk) / maxDepth : 0.5;
        const d = inner + level * (width - inner - outer);
        const b = pad + across(walk) * (height - pad * 2);
        at.set(walk, { x: direction === "left" ? d : width - d, y: b, angle: 0, radius: 0 });
      }
    }
  }

  const pos = (walk: Walk) =>
    at.get(walk) as { x: number; y: number; angle: number; radius: number };
  const pt = (x: number, y: number) => `${fmt(x)},${fmt(y)}`;
  const cx = width / 2;
  const cy = height / 2;
  /** The link from a parent to a child in the edge style. */
  const linkPath = (from: Walk, to: Walk): string => {
    const p = pos(from);
    const c = pos(to);
    const style = options.edgeStyle ?? "orthogonal";
    if (style === "straight") return `M${pt(p.x, p.y)}L${pt(c.x, c.y)}`;
    if (radial) {
      const mid = (p.radius + c.radius) / 2;
      if (style === "curved" || p.radius === 0) {
        // A cubic through the middle radius on both angles (the root fans out from the center).
        const [ax, ay] = polarPoint(cx, cy, mid, p.radius === 0 ? c.angle : p.angle);
        const [bx, by] = polarPoint(cx, cy, mid, c.angle);
        return style === "curved"
          ? `M${pt(p.x, p.y)}C${pt(ax, ay)} ${pt(bx, by)} ${pt(c.x, c.y)}`
          : `M${pt(p.x, p.y)}L${pt(bx, by)}L${pt(c.x, c.y)}`;
      }
      // Out along the parent's angle, around the middle circle, out to the child.
      const [ax, ay] = polarPoint(cx, cy, mid, p.angle);
      const [bx, by] = polarPoint(cx, cy, mid, c.angle);
      const turn = c.angle - p.angle;
      const arc =
        Math.abs(turn) < 0.01
          ? ""
          : `A${fmt(mid)},${fmt(mid)} 0 ${Math.abs(turn) > 180 ? 1 : 0} ${turn > 0 ? 1 : 0} ${pt(bx, by)}`;
      return `M${pt(p.x, p.y)}L${pt(ax, ay)}${arc}L${pt(c.x, c.y)}`;
    }
    const vertical = direction === "top" || direction === "bottom";
    if (vertical) {
      const m = (p.y + c.y) / 2;
      return style === "curved"
        ? `M${pt(p.x, p.y)}C${pt(p.x, m)} ${pt(c.x, m)} ${pt(c.x, c.y)}`
        : `M${pt(p.x, p.y)}V${fmt(m)}H${fmt(c.x)}V${fmt(c.y)}`;
    }
    const m = (p.x + c.x) / 2;
    return style === "curved"
      ? `M${pt(p.x, p.y)}C${pt(m, p.y)} ${pt(m, c.y)} ${pt(c.x, c.y)}`
      : `M${pt(p.x, p.y)}H${fmt(m)}V${fmt(c.y)}H${fmt(c.x)}`;
  };

  // Marks in preorder (Home is the first root, End the last node).
  const markOf = new Map<Walk, number>();
  walks.forEach((walk, i) => {
    markOf.set(walk, i);
  });
  const links: ChartNode[] = [];
  const shapes: ChartNode[] = [];
  const labels: ChartNode[] = [];
  const marks: ChartMark[] = [];
  /** Nearest node of the same level (px across), for label room. */
  const levels = new Map<number, Walk[]>();
  for (const walk of walks) {
    const list = levels.get(levelOf(walk)) ?? [];
    list.push(walk);
    levels.set(levelOf(walk), list);
  }
  const spacing = (walk: Walk) => {
    const p = pos(walk);
    let best = Number.POSITIVE_INFINITY;
    for (const other of levels.get(levelOf(walk)) ?? []) {
      if (other === walk) continue;
      const o = pos(other);
      best = Math.min(best, Math.hypot(o.x - p.x, o.y - p.y));
    }
    return best;
  };
  const step =
    maxDepth > 0
      ? radial
        ? Math.min(width, height) / 2 / (maxDepth + 1)
        : (direction === "top" || direction === "bottom" ? height : width) / (maxDepth + 1)
      : width;

  for (const walk of walks) {
    const entry = items[walk.item] as (typeof items)[number];
    const p = pos(walk);
    const hasChildren = entry.children.length > 0;
    const folded = hasChildren && collapsed.has(entry.id);
    const link = walk.parent && walk.parent !== sentinel ? linkPath(walk.parent, walk) : undefined;
    if (link)
      links.push(
        node("path", { d: link, "data-ok-chart-tree-link": "", "data-ok-color": entry.color }),
      );
    shapes.push(
      node("circle", {
        cx: fmt(p.x),
        cy: fmt(p.y),
        r: fmt(r),
        "data-ok-chart-tree-node": "",
        "data-ok-color": entry.color,
        ...(folded ? { "data-ok-collapsed": "" } : {}),
      }),
    );
    // Labels: below (top trees) or above (bottom trees) the node, after leaves and before
    // parents (left and right trees), outward at leaves and above parents (radial trees).
    const full = labelText(walk.item);
    const leaf = walk.children.length === 0;
    const near = spacing(walk);
    let label: ChartNode | null = null;
    if (radial) {
      if (leaf && p.radius > 0) {
        const half = Math.min(width, height) / 2;
        const room = half - p.radius - r - GAP - 2;
        const arcRoom = near;
        if (fits(room, full) && arcRoom >= FONT - 2) {
          const [lx, ly] = polarPoint(cx, cy, p.radius + r + GAP, p.angle);
          const right = ((p.angle % 360) + 360) % 360 < 180;
          const turn = right ? p.angle - 90 : p.angle + 90;
          label = node(
            "text",
            {
              x: fmt(lx),
              y: fmt(ly),
              dy: "0.35em",
              "text-anchor": right ? "start" : "end",
              transform: `rotate(${fmt(turn)} ${fmt(lx)} ${fmt(ly)})`,
              "data-ok-chart-node-label": "",
            },
            undefined,
            fitChartText(full, room),
          );
        }
      } else {
        const room = Math.min(near, step) - GAP;
        if (fits(room, full))
          label = node(
            "text",
            {
              x: fmt(p.x),
              y: fmt(p.y - r - GAP),
              "text-anchor": "middle",
              "data-ok-chart-node-label": "",
            },
            undefined,
            fitChartText(full, room),
          );
      }
    } else if (direction === "top" || direction === "bottom") {
      const room = Math.min(near - GAP * 2, width - 8);
      if (fits(room, full)) {
        const fitted = fitChartText(full, room);
        const half = chartTextWidth(fitted) / 2;
        const x = Math.max(Math.min(p.x, width - half), Math.min(half, width / 2));
        const below = direction === "top";
        label = node(
          "text",
          {
            x: fmt(x),
            y: fmt(below ? p.y + r + GAP : p.y - r - GAP),
            dy: below ? "0.71em" : "0",
            "text-anchor": "middle",
            "data-ok-chart-node-label": "",
          },
          undefined,
          fitted,
        );
      }
    } else if (near >= FONT) {
      const after = (direction === "left") === leaf;
      const room = leaf
        ? direction === "left"
          ? width - p.x - r - GAP - 2
          : p.x - r - GAP - 2
        : walk.depth === 0
          ? (direction === "left" ? p.x : width - p.x) - r - GAP - 2
          : step - r * 2 - GAP * 2;
      if (fits(room, full))
        label = node(
          "text",
          {
            x: fmt(after ? p.x + r + GAP : p.x - r - GAP),
            y: fmt(p.y),
            dy: "0.35em",
            "text-anchor": after ? "start" : "end",
            "data-ok-chart-node-label": "",
          },
          undefined,
          fitChartText(full, room),
        );
    }
    if (label) labels.push(label);
    const tree: ChartTreeMark = {
      id: entry.id,
      depth: levelOf(walk),
      parent: walk.parent && walk.parent !== sentinel ? (markOf.get(walk.parent) as number) : -1,
      children: walk.children.map((child) => markOf.get(child) as number),
      cross: radial
        ? r2(p.angle)
        : direction === "top" || direction === "bottom"
          ? r2(p.x)
          : r2(p.y),
      axis,
      hit: { kind: "circle", cx: r2(p.x), cy: r2(p.y), r },
      outline: node("circle", {
        cx: fmt(p.x),
        cy: fmt(p.y),
        r: fmt(r + 3),
        "data-ok-chart-active-node": "",
      }),
      ...(link ? { link } : {}),
      ...(options.expandCollapse && hasChildren ? { action: "toggle" as const } : {}),
      ...(folded ? { collapsed: true } : {}),
      title: chartHierarchyTitle(hierarchy, walk.item),
      rows: chartHierarchyRows(hierarchy, walk.item, format, folded),
    };
    marks.push({
      series: 0,
      type: "tree",
      index: walk.item,
      x: walk.item,
      value: entry.value,
      px: r2(p.x),
      py: r2(p.y),
      color: entry.color,
      tree,
    });
  }

  return {
    width,
    height,
    plot: { x: 0, y: 0, width, height },
    mode: "tree",
    horizontal: false,
    banded: false,
    band: 0,
    slots: [],
    marks,
    activeRadius: 0,
    hierarchy: { type: "tree", drill: null, path: [], drillable: false },
    nodes: [
      node("g", { "data-ok-chart-crosshair": "" }, []),
      node("g", { "data-ok-chart-series-group": "" }, [
        node(
          "g",
          {
            "data-ok-chart-series": "",
            "data-ok-type": "tree",
            "data-ok-index": "0",
          },
          [...links, ...shapes],
        ),
      ]),
      node("g", { "data-ok-chart-active": "" }, []),
      node("g", { "data-ok-chart-data-labels": "" }, labels),
    ],
  };
}
