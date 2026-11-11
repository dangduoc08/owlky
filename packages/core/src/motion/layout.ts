/*
 * Layout animations (FLIP) — spec: specs/components/motion.md (Layout), ADR-0062 (5.4).
 * Framer Motion's `layout`, `layoutId` and `LayoutGroup` on the 5.1 engine: a node takes its box
 * before a change (`snapshot`), a flush measures it after and plays the inverse `transform` back
 * to none with `animate()` (never committed). Boxes are layout boxes on the page, without
 * transforms (an element with a transform on it or an ancestor is measured from its offsets), so
 * entrance animations, drags and running layout animations never count as layout. While a
 * layout animation plays, the element's box is computed from its path, which is where an
 * interrupted animation starts from.
 *
 * Size correction (where Framer does it): a node inside a node that animates is measured
 * relative to it and counter-transformed (its own path in the parent's frame, sampled into
 * keyframes), and `border-radius` in px is corrected against the scale. Plain children (text)
 * are scaled with their box, as in Framer: use `layout="position"` for them.
 *
 * Owners: React snapshots in `getSnapshotBeforeUpdate`, the HTML runtime from the last known box
 * after a mutation. Elements are never moved or re-inserted here; a focused element that the
 * owner's update blurred gets the focus back. Module-scoped state only (ADR-0007).
 */
import {
  type AnimateOptions,
  type AnimationControls,
  animate,
  resolveEasing,
  springCurve,
  springEasing,
  standardDuration,
} from "./animate.js";
import { prefersReducedMotion } from "./count-up.js";
import { type EasingFunction, easingFunction } from "./easing.js";
import { parseMotionTransition } from "./keyframes.js";

/** `true` (position and size), `"position"` (the size jumps) or `"size"` (the position jumps). */
export type LayoutMode = boolean | "position" | "size";

/** A box on the page, in px (layout, without transforms). */
export interface LayoutBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Nodes that animate together: any member's snapshot takes the others' (`LayoutGroup`). */
export interface LayoutGroup {
  /** Namespaces `layoutId`s: two groups may use the same id for different elements. */
  readonly id: string | undefined;
  /** The registered nodes of the group. */
  readonly members: Set<LayoutNode>;
}

/** A group; `share` reuses another group's members (nested groups that animate together). */
export function createLayoutGroup(id?: string, share?: LayoutGroup): LayoutGroup {
  return { id: id || undefined, members: share?.members ?? new Set() };
}

/** A transition with Framer's `layout` key (it wins for layout animations). */
export type LayoutTransition = AnimateOptions & { layout?: AnimateOptions | undefined };

export interface LayoutNodeOptions {
  /** Animates layout changes: `true`, `"position"` or `"size"`. Default: on with `layoutId`. */
  layout?: LayoutMode | undefined;
  /** Shared element: a new node with the id of one that just left animates from its box. */
  layoutId?: string | undefined;
  /** The group whose members snapshot together. */
  group?: LayoutGroup | undefined;
  /** The owner decides when it snapshots (React `layoutDependency`): group snapshots skip it. */
  dependent?: boolean | undefined;
  /** Its `layout` key, or the transition itself (`duration`, `ease`, springs). */
  transition?: LayoutTransition | undefined;
  /** A layout animation of its own box started. */
  onLayoutAnimationStart?: (() => void) | undefined;
  /** That animation ended (not when another one interrupted it). */
  onLayoutAnimationComplete?: (() => void) | undefined;
}

export interface LayoutNode {
  readonly element: HTMLElement;
  /** While a layout animation (or a correction for an animating parent) plays. */
  readonly animating: boolean;
  /** The last box measured (or the box the running animation ends at). */
  readonly box: LayoutBox | undefined;
  setOptions(options: LayoutNodeOptions): void;
  /**
   * The box before a change: `live` measures it now (default), `last` takes the last known one
   * (the owner keeps it fresh with `measure()`). While animating: where the animation shows it. The next
   * flush (a microtask later, or `flushLayout()`) animates to where it is then.
   */
  snapshot(source?: "live" | "last"): void;
  /** Measures the box at the next flush, without animating (the observer saw nothing move). */
  measure(): void;
  /** Stops animating and unregisters; a `layoutId` leaves its box for the node that follows. */
  destroy(): void;
}

interface Timing {
  delay: number;
  duration: number;
  ease: EasingFunction;
  /** The CSS easing of the same curve (two-keyframe animations). */
  css: string;
}

interface Path {
  /** The visible box at the start (mode applied). */
  from: LayoutBox;
  /** The layout box it ends at. */
  to: LayoutBox;
  /** `performance.now()` at the start. */
  start: number;
  timing: Timing;
  /** Its own box changed (events); `false` for a correction under an animating parent. */
  own: boolean;
}

interface Last {
  box: LayoutBox;
}

interface NodeState extends LayoutNode {
  options: LayoutNodeOptions;
  path: Path | undefined;
  controls: AnimationControls | undefined;
  last: Last | undefined;
  alive: boolean;
}

const nodes = new Set<NodeState>();
const byElement = new WeakMap<Element, NodeState>();
/** Snapshots since the last flush (`undefined` before: derived from the parent). */
const pending = new Map<NodeState, LayoutBox>();
const toMeasure = new Set<NodeState>();
/** Boxes left by `layoutId` nodes that went away, until the next frame. */
const handoffs = new Map<string, LayoutBox>();
let scheduled = false;
let clearing = 0;
let focusCandidate: Element | null = null;

const now = () => performance.now();
const enabled = (node: NodeState) =>
  node.alive && (Boolean(node.options.layout) || Boolean(node.options.layoutId));
const modeOf = (node: NodeState): LayoutMode =>
  node.options.layout === "position" || node.options.layout === "size" ? node.options.layout : true;
const scopeOf = (node: NodeState) =>
  `${node.options.group?.id ?? ""}\u0000${node.options.layoutId}`;
const finite = (value: unknown, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;
const clamp = (value: number) => Math.min(Math.max(value, 0), 1);
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const round = (value: number) => Math.round(value * 10_000) / 10_000;

/** Whether two boxes are the same within half a pixel. */
const close = (a: LayoutBox, b: LayoutBox) =>
  Math.abs(a.x - b.x) < 0.5 &&
  Math.abs(a.y - b.y) < 0.5 &&
  Math.abs(a.width - b.width) < 0.5 &&
  Math.abs(a.height - b.height) < 0.5;

const lerpBox = (a: LayoutBox, b: LayoutBox, t: number): LayoutBox => ({
  x: mix(a.x, b.x, t),
  y: mix(a.y, b.y, t),
  width: mix(a.width, b.width, t),
  height: mix(a.height, b.height, t),
});

/** The transition of layout animations: its `layout` key, or the rest of it. */
export function layoutTransition(transition: LayoutTransition | undefined): AnimateOptions {
  if (!transition) return {};
  if (transition.layout) return transition.layout;
  const {
    layout: _layout,
    repeat: _repeat,
    repeatDelay: _hold,
    times: _times,
    ...rest
  } = transition;
  return rest;
}

/** Duration, delay and easing (a function and its CSS) of a layout transition. */
function timingOf(transition: AnimateOptions): Timing {
  const delay = Math.max(finite(transition.delay, 0), 0);
  if (transition.type === "spring") {
    const curve = springCurve(transition);
    return {
      delay,
      duration: curve.duration,
      ease: curve.at,
      css: springEasing(transition).easing,
    };
  }
  const { ease } = transition;
  const css = resolveEasing(
    Array.isArray(ease) && typeof ease[0] !== "number"
      ? (ease[0] as string)
      : (ease as Parameters<typeof resolveEasing>[0]),
  );
  return {
    delay,
    duration: Math.max(finite(transition.duration, standardDuration()), 0),
    ease: easingFunction(css),
    css,
  };
}

const progressOf = (path: Path, time: number) =>
  clamp((time - path.start - path.timing.delay) / Math.max(path.timing.duration, 1));
const endOf = (path: Path) => path.start + path.timing.delay + path.timing.duration;

/** Where a path shows the box at `time`. */
const boxAt = (path: Path, time: number) =>
  lerpBox(path.from, path.to, path.timing.ease(progressOf(path, time)));

/**
 * The time a node's path has reached: its animation's own clock (exact while paused, or before
 * its first frame), else the time since the path started.
 */
function pathTime(node: NodeState): number {
  const path = node.path as Path;
  const current = node.controls?.animations[0]?.currentTime;
  return path.start + (Number(current) || 0);
}

const reduced = (transition: AnimateOptions) =>
  transition.reducedMotion === "always" ||
  (transition.reducedMotion !== "never" && prefersReducedMotion());

// --- Measuring ---------------------------------------------------------------------------------

type TransformCache = Map<Element, boolean>;

/** Whether `element` or an ancestor has a transform (computed: animations included). */
function transformed(element: Element, cache: TransformCache): boolean {
  for (let node: Element | null = element; node; node = node.parentElement) {
    let value = cache.get(node);
    if (value === undefined) {
      const style = getComputedStyle(node);
      value = [style.transform, style.translate, style.scale, style.rotate].some(
        (item) => item !== undefined && item !== "" && item !== "none",
      );
      cache.set(node, value);
    }
    if (value) return true;
  }
  return false;
}

/** The layout box from offsets (transforms don't count), in page coordinates. */
function offsetBox(element: HTMLElement): LayoutBox {
  const doc = element.ownerDocument;
  let x = 0;
  let y = 0;
  let fixed = false;
  for (let node: HTMLElement | null = element; node && node !== doc.body; ) {
    x += node.offsetLeft;
    y += node.offsetTop;
    const parent = node.offsetParent as HTMLElement | null;
    if (!parent && getComputedStyle(node).position === "fixed") fixed = true;
    if (parent && parent !== doc.body) {
      x += parent.clientLeft;
      y += parent.clientTop;
    }
    node = parent;
  }
  for (let node = element.parentElement; node; node = node.parentElement) {
    if (node === doc.body || node === doc.documentElement) break;
    x -= node.scrollLeft;
    y -= node.scrollTop;
  }
  if (fixed) {
    x += window.scrollX;
    y += window.scrollY;
  }
  return { x, y, width: element.offsetWidth, height: element.offsetHeight };
}

/**
 * The layout box of `element` on the page: its bounding box when nothing transforms it, its
 * offsets otherwise (whole pixels).
 */
export function measureLayoutBox(element: Element, cache: TransformCache = new Map()): LayoutBox {
  if (element instanceof HTMLElement && transformed(element, cache)) return offsetBox(element);
  const rect = element.getBoundingClientRect();
  return {
    x: rect.left + window.scrollX,
    y: rect.top + window.scrollY,
    width: rect.width,
    height: rect.height,
  };
}

interface Measure {
  after: LayoutBox;
  origin: [number, number];
  /** Corner radii `[x, y]` in px, or `undefined` (none, or a percentage). */
  radius: [number, number][] | undefined;
}

const CORNERS = [
  "border-top-left-radius",
  "border-top-right-radius",
  "border-bottom-right-radius",
  "border-bottom-left-radius",
] as const;
const CORNER_PROPERTIES = [
  "borderTopLeftRadius",
  "borderTopRightRadius",
  "borderBottomRightRadius",
  "borderBottomLeftRadius",
] as const;

function readMeasure(node: NodeState, cache: TransformCache): Measure {
  const { element } = node;
  const style = getComputedStyle(element);
  const [ox = 0, oy = 0] = style.transformOrigin
    .split(/\s+/)
    .map((part) => Number.parseFloat(part));
  let radius: [number, number][] | undefined = [];
  for (const corner of CORNERS) {
    const value = style.getPropertyValue(corner).trim();
    if (value.includes("%")) {
      radius = undefined;
      break;
    }
    const [rx = 0, ry = rx] = value.split(/\s+/).map((part) => Number.parseFloat(part) || 0);
    radius.push([rx, ry]);
  }
  if (radius?.every(([rx, ry]) => rx === 0 && ry === 0)) radius = undefined;
  return {
    after: measureLayoutBox(element, cache),
    origin: [ox || 0, oy || 0],
    radius,
  };
}

/**
 * Where `node` shows now: its path while animating; else measured (`live`, while connected) or
 * its last box (`last`: the owner refreshes it whenever something else moved it).
 */
function visibleBox(
  node: NodeState,
  source: "live" | "last",
  cache: TransformCache,
): LayoutBox | undefined {
  if (node.path) return boxAt(node.path, pathTime(node));
  if (node.last && (source === "last" || !node.element.isConnected)) return node.last.box;
  return node.element.isConnected ? measureLayoutBox(node.element, cache) : undefined;
}

// --- Scheduling --------------------------------------------------------------------------------

function schedule() {
  if (scheduled) return;
  scheduled = true;
  queueMicrotask(() => {
    if (scheduled) flushLayout();
  });
}

function take(node: NodeState, box: LayoutBox | undefined) {
  if (!box || pending.has(node)) return;
  pending.set(node, box);
  const active = node.element.ownerDocument.activeElement;
  if (
    !focusCandidate &&
    active &&
    active !== active.ownerDocument.body &&
    node.element.contains(active)
  )
    focusCandidate = active;
}

/** The nearest registered, enabled ancestor node. */
function parentOf(node: NodeState): NodeState | undefined {
  for (let element = node.element.parentElement; element; element = element.parentElement) {
    const found = byElement.get(element);
    if (found && enabled(found)) return found;
  }
  return undefined;
}

// --- Flush -------------------------------------------------------------------------------------

export interface FlushLayoutOptions {
  /**
   * An element that had the focus before the change (HTML: the owner saw it moved): if the
   * change blurred it to the page, it gets the focus back.
   */
  focus?: Element | null | undefined;
}

/** Affine map of a box onto another along one axis: `x → scale × x + shift`. */
const axis = (from: number, fromSize: number, to: number, toSize: number) => {
  const scale = fromSize > 0 && toSize > 0 ? toSize / fromSize : 1;
  return { scale, shift: to - scale * from };
};

/** A CSS transform equal to `x → scale × x + shift` (page px) around an origin in page px. */
const transformText = (
  sx: number,
  tx: number,
  sy: number,
  ty: number,
  originX: number,
  originY: number,
) =>
  `translate(${round(tx - originX * (1 - sx))}px, ${round(ty - originY * (1 - sy))}px) scale(${round(sx)}, ${round(sy)})`;

const identity = (sx: number, tx: number, sy: number, ty: number, ox: number, oy: number) =>
  Math.abs(sx - 1) < 1e-4 &&
  Math.abs(sy - 1) < 1e-4 &&
  Math.abs(tx - ox * (1 - sx)) < 0.01 &&
  Math.abs(ty - oy * (1 - sy)) < 0.01;

/**
 * Starts `path` on `node` at `time` (the time it has reached), corrected for its parent's path,
 * which is at `parentTime` now: each path keeps its own clock.
 */
function play(
  node: NodeState,
  path: Path,
  parent: Path | undefined,
  measure: Measure,
  time: number,
  parentTime: number,
) {
  // The parent's time at a time of this path.
  const offset = parentTime - time;
  const target = path.to;
  const originX = target.x + measure.origin[0];
  const originY = target.y + measure.origin[1];
  const sample =
    parent !== undefined || (measure.radius !== undefined && !sameSize(path.from, target));
  let frames: Keyframe[];
  let options: AnimateOptions;
  if (!sample) {
    const x = axis(target.x, target.width, path.from.x, path.from.width);
    const y = axis(target.y, target.height, path.from.y, path.from.height);
    frames = [
      { transform: transformText(x.scale, x.shift, y.scale, y.shift, originX, originY) },
      { transform: "none" },
    ];
    options = { duration: path.timing.duration, delay: path.timing.delay, ease: path.timing.css };
  } else {
    const end = Math.max(endOf(path), parent ? endOf(parent) - offset : 0);
    const span = Math.max(end - path.start, 1);
    const count = Math.max(2, Math.min(Math.ceil(span / (1000 / 60)), 600));
    frames = [];
    let still = measure.radius === undefined;
    for (let k = 0; k <= count; k++) {
      const t = path.start + (span * k) / count;
      const box = boxAt(path, t);
      const x = axis(target.x, target.width, box.x, box.width);
      const y = axis(target.y, target.height, box.y, box.height);
      let sx = x.scale;
      let tx = x.shift;
      let sy = y.scale;
      let ty = y.shift;
      if (parent) {
        // Undo the parent's own transform: the child's is applied inside it.
        const shown = boxAt(parent, t + offset);
        const px = axis(parent.to.x, parent.to.width, shown.x, shown.width);
        const py = axis(parent.to.y, parent.to.height, shown.y, shown.height);
        sx /= px.scale;
        tx = (tx - px.shift) / px.scale;
        sy /= py.scale;
        ty = (ty - py.shift) / py.scale;
      }
      if (!identity(sx, tx, sy, ty, originX, originY)) still = false;
      const frame: Keyframe = {
        transform: transformText(sx, tx, sy, ty, originX, originY),
        offset: k / count,
      };
      if (measure.radius) {
        // The visible scale of the box distorts its corners: draw them smaller by as much.
        measure.radius.forEach(([rx, ry], index) => {
          frame[CORNER_PROPERTIES[index] as string] =
            `${round(rx / x.scale)}px ${round(ry / y.scale)}px`;
        });
      }
      frames.push(frame);
    }
    if (still) return false;
    options = { duration: span, ease: "linear" };
  }
  const controls = animate(node.element, frames, {
    ...options,
    reducedMotion: "never",
    commit: false,
  });
  const elapsed = time - path.start;
  if (elapsed > 0) for (const animation of controls.animations) animation.currentTime = elapsed;
  node.controls = controls;
  controls.finished.then(() => {
    if (node.controls !== controls) return;
    node.controls = undefined;
    const done = node.path;
    node.path = undefined;
    if (done?.own) node.options.onLayoutAnimationComplete?.();
  });
  return true;
}

const sameSize = (a: LayoutBox, b: LayoutBox) =>
  Math.abs(a.width - b.width) < 0.5 && Math.abs(a.height - b.height) < 0.5;

/** The start box of a change for a mode: `position` keeps the new size, `size` the new position. */
function startBox(before: LayoutBox, after: LayoutBox, mode: LayoutMode): LayoutBox {
  if (mode === "position") return { ...before, width: after.width, height: after.height };
  if (mode === "size") return { ...after, width: before.width, height: before.height };
  return before;
}

function stop(node: NodeState) {
  const controls = node.controls;
  node.controls = undefined;
  node.path = undefined;
  controls?.cancel();
}

/**
 * Measures every node snapshotted since the last flush (and the nodes inside them), then
 * animates each one from its snapshot to its new box. Runs a microtask after a snapshot; call it
 * to flush at once (the HTML runtime does, from its MutationObserver).
 */
export function flushLayout(options: FlushLayoutOptions = {}): void {
  scheduled = false;
  const time = now();
  const cache: TransformCache = new Map();
  const work = new Map<NodeState, LayoutBox | undefined>();
  for (const [node, box] of pending)
    if (enabled(node) && node.element.isConnected) work.set(node, box);
  pending.clear();
  const focus = options.focus ?? focusCandidate;
  focusCandidate = null;
  // Nodes inside a changing node are measured relative to it (corrected while it animates).
  if (work.size > 0) {
    const roots = [...work.keys()];
    for (const node of nodes) {
      if (work.has(node) || !enabled(node) || !node.element.isConnected) continue;
      if (
        roots.some((root) => root.element !== node.element && root.element.contains(node.element))
      )
        work.set(node, node.path ? boxAt(node.path, pathTime(node)) : undefined);
    }
  }
  const measures = new Map<NodeState, Measure>();
  // Reads first (one layout), then the writes.
  for (const node of work.keys()) measures.set(node, readMeasure(node, cache));
  for (const node of toMeasure) {
    if (work.has(node) || !enabled(node) || node.path || !node.element.isConnected) continue;
    const measure = readMeasure(node, cache);
    node.last = last(measure);
  }
  toMeasure.clear();

  const ordered = [...work.keys()].sort((a, b) =>
    a.element.compareDocumentPosition(b.element) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
  );
  const befores = new Map<NodeState, LayoutBox>();
  const restarted = new Set<NodeState>();
  const started: NodeState[] = [];
  const instant: NodeState[] = [];
  for (const node of ordered) {
    const measure = measures.get(node) as Measure;
    const after = measure.after;
    const parent = parentOf(node);
    let before = work.get(node);
    if (!before) {
      // Not snapshotted: it moved with its parent.
      const parentBefore = parent ? befores.get(parent) : undefined;
      const parentAfter = parent ? measures.get(parent)?.after : undefined;
      before =
        parentBefore && parentAfter
          ? {
              ...after,
              x: after.x + parentBefore.x - parentAfter.x,
              y: after.y + parentBefore.y - parentAfter.y,
            }
          : after;
    }
    befores.set(node, before);
    node.last = last(measure);
    const transition = layoutTransition(node.options.transition);
    const from = startBox(before, after, modeOf(node));
    const changed = !close(from, after);
    const previous = node.path;
    if (reduced(transition)) {
      stop(node);
      if (changed) instant.push(node);
      continue;
    }
    const parentPath = parent?.path;
    let path: Path | undefined;
    if (previous && close(previous.to, after)) path = previous;
    else if (changed)
      path = { from, to: after, start: time, timing: timingOf(transition), own: true };
    else if (parentPath)
      path = { from: after, to: after, start: time, timing: parentPath.timing, own: false };
    const restart = path !== previous || (parent !== undefined && restarted.has(parent));
    if (!path) {
      stop(node);
      continue;
    }
    if (!restart) continue;
    // A continued path (its parent's changed) resumes where its animation was.
    const at = path === previous ? pathTime(node) : time;
    stop(node);
    node.path = path;
    const parentTime = parent?.path ? pathTime(parent) : time;
    if (play(node, path, parentPath, measure, at, parentTime)) {
      restarted.add(node);
      if (path !== previous && path.own) started.push(node);
    } else node.path = undefined;
  }
  for (const node of started) node.options.onLayoutAnimationStart?.();
  for (const node of instant) {
    node.options.onLayoutAnimationStart?.();
    node.options.onLayoutAnimationComplete?.();
  }
  if (focus?.isConnected && focus instanceof HTMLElement) {
    const active = focus.ownerDocument.activeElement;
    if (active !== focus && (active === null || active === focus.ownerDocument.body))
      focus.focus({ preventScroll: true });
  }
}

const last = (measure: Measure): Last => ({ box: measure.after });

// --- Nodes -------------------------------------------------------------------------------------

/** Forgets the boxes of departed shared elements on the next frame (only the same update hands off). */
function keepHandoffs() {
  if (clearing || typeof requestAnimationFrame !== "function") return;
  clearing = requestAnimationFrame(() => {
    clearing = 0;
    handoffs.clear();
  });
}

/**
 * Makes `element` animate its layout changes (FLIP). The owner snapshots before a change; see
 * the module comment. With a `layoutId`, a node created right after another one with the same id
 * (in the same group) left, or while it is still there, animates from that node's box.
 */
export function createLayoutNode(
  element: HTMLElement,
  options: LayoutNodeOptions = {},
): LayoutNode {
  const node: NodeState = {
    element,
    options,
    path: undefined,
    controls: undefined,
    last: undefined,
    alive: true,
    get animating() {
      return node.path !== undefined;
    },
    get box() {
      return node.path?.to ?? node.last?.box;
    },
    setOptions(next) {
      if (next.group !== node.options.group) {
        node.options.group?.members.delete(node);
        next.group?.members.add(node);
      }
      node.options = next;
    },
    snapshot(source = "live") {
      if (!enabled(node)) return;
      const cache: TransformCache = new Map();
      take(node, visibleBox(node, source, cache));
      for (const member of node.options.group?.members ?? []) {
        const other = member as NodeState;
        if (other !== node && enabled(other) && !other.options.dependent && !pending.has(other))
          take(other, visibleBox(other, source, cache));
      }
      schedule();
    },
    measure() {
      toMeasure.add(node);
      schedule();
    },
    destroy() {
      if (!node.alive) return;
      if (enabled(node) && node.options.layoutId) {
        // React unmounts while the element is still on the page; HTML after it left (last box).
        const box = pending.get(node) ?? visibleBox(node, "live", new Map());
        if (box) {
          handoffs.set(scopeOf(node), box);
          keepHandoffs();
        }
      }
      node.alive = false;
      stop(node);
      nodes.delete(node);
      if (byElement.get(element) === node) byElement.delete(element);
      node.options.group?.members.delete(node);
      pending.delete(node);
      toMeasure.delete(node);
    },
  };
  nodes.add(node);
  byElement.set(element, node);
  options.group?.members.add(node);
  toMeasure.add(node);
  if (options.layoutId) {
    const scope = scopeOf(node);
    let from = handoffs.get(scope);
    handoffs.delete(scope);
    if (!from) {
      for (const other of nodes) {
        if (
          other !== node &&
          enabled(other) &&
          other.options.layoutId &&
          scopeOf(other) === scope
        ) {
          from = visibleBox(other, "live", new Map());
          break;
        }
      }
    }
    if (from) pending.set(node, from);
  }
  schedule();
  return node;
}

/** The node registered on `element`, if any. */
export const layoutNodeOf = (element: Element): LayoutNode | undefined => byElement.get(element);

// --- Attributes --------------------------------------------------------------------------------

export const LAYOUT_ATTRS = {
  layout: "data-ok-layout",
  layoutId: "data-ok-layout-id",
  group: "data-ok-layout-group",
} as const;

/** The serializable layout props (React writes them as attributes). */
export interface MotionLayoutValues {
  layout?: LayoutMode | undefined;
  layoutId?: string | undefined;
  /** The element's transition: written as `data-ok-transition` along with `layout`. */
  transition?: LayoutTransition | undefined;
}

type LayoutAttribute = typeof LAYOUT_ATTRS.layout | typeof LAYOUT_ATTRS.layoutId;

const stringify = (value: unknown) =>
  JSON.stringify(value, (_key, item) => (item === Infinity ? "Infinity" : item));

/**
 * The attributes of the layout props as the HTML markup writes them: `data-ok-layout` (empty,
 * `position` or `size`), `data-ok-layout-id`, and `data-ok-transition` with either.
 */
export function motionLayoutAttributes(
  values: MotionLayoutValues,
): Partial<Record<LayoutAttribute | "data-ok-transition", string>> {
  const attributes: Partial<Record<LayoutAttribute | "data-ok-transition", string>> = {};
  const { layout } = values;
  if (layout === true) attributes[LAYOUT_ATTRS.layout] = "";
  else if (layout === "position" || layout === "size") attributes[LAYOUT_ATTRS.layout] = layout;
  const id = values.layoutId?.trim();
  if (id) attributes[LAYOUT_ATTRS.layoutId] = id;
  if (values.transition && Object.keys(attributes).length > 0) {
    const transition = parseMotionTransition(values.transition);
    if (Object.keys(transition).length > 0)
      attributes["data-ok-transition"] = stringify(transition);
  }
  return attributes;
}

/** Whether `element` animates its layout (`data-ok-layout` or `data-ok-layout-id`). */
export const hasMotionLayout = (element: Element): boolean =>
  element.hasAttribute(LAYOUT_ATTRS.layout) || element.hasAttribute(LAYOUT_ATTRS.layoutId);

/**
 * The layout options written on `element` (HTML): `data-ok-layout` (`position`, `size`, anything
 * else: both), `data-ok-layout-id`, `data-ok-transition` (its `layout` key wins).
 */
export function readMotionLayout(
  element: Element,
): Pick<LayoutNodeOptions, "layout" | "layoutId" | "transition"> {
  const mode = element.getAttribute(LAYOUT_ATTRS.layout);
  const id = element.getAttribute(LAYOUT_ATTRS.layoutId)?.trim();
  const transition = element.getAttribute("data-ok-transition");
  return {
    layout: mode === null ? undefined : mode === "position" || mode === "size" ? mode : true,
    layoutId: id || undefined,
    transition: transition ? parseMotionTransition(transition) : undefined,
  };
}
