// Organization chart zoom, fit and center (ADR-0056): CSS `zoom` on the root, inside the composed
// Scrollbar. The owner keeps the level; this module reports intent and keeps the view steady.

/** `zoomIn()` / `zoomOut()` multiply or divide the level by this. */
export const ORGANIZATION_CHART_ZOOM_STEP = 1.25;

/** Default limits of the zoom level (`minZoom`, `maxZoom`). */
export const ORGANIZATION_CHART_ZOOM_LIMITS = { min: 0.25, max: 2 } as const;

const ROOT = "[data-ok-organization-chart]";
const LABEL = "[data-ok-organization-chart-label]";
const TOOLBAR = "data-ok-organization-chart-toolbar";
const ACTIONS = {
  "data-ok-organization-chart-zoom-in": "in",
  "data-ok-organization-chart-zoom-out": "out",
  "data-ok-organization-chart-fit": "fit",
  "data-ok-organization-chart-reset": "reset",
} as const;
type Action = (typeof ACTIONS)[keyof typeof ACTIONS];
/** Content that keeps its own presses (no drag to pan starts on it). */
const INTERACTIVE =
  "a[href], button, input, select, textarea, label, summary, [contenteditable], [tabindex]:not([data-ok-scrollbar]), [role=button], [role=link], [role=menuitem], [popover]";
/** Widgets whose keys belong to them (the zoom keys don't apply inside). */
const OWN_KEYS =
  "input, select, textarea, [contenteditable], [role=menu], [role=listbox], [role=grid], [role=tree], [role=combobox], [role=slider], [role=spinbutton]";

/** A level clamped to the limits; invalid levels give 1 (clamped). */
export function clampOrganizationChartZoom(
  level: number,
  min: number = ORGANIZATION_CHART_ZOOM_LIMITS.min,
  max: number = ORGANIZATION_CHART_ZOOM_LIMITS.max,
): number {
  const low = Number.isFinite(min) && min > 0 ? min : ORGANIZATION_CHART_ZOOM_LIMITS.min;
  const high = Number.isFinite(max) && max >= low ? max : Math.max(low, 2);
  const value = Number.isFinite(level) && level > 0 ? level : 1;
  return Math.round(Math.min(high, Math.max(low, value)) * 10000) / 10000;
}

/**
 * The chart's viewport: its nearest ancestor that scrolls (`overflow` auto or scroll), such as
 * the composed Scrollbar; `null` when only the page scrolls.
 */
export function organizationChartViewport(root: Element): HTMLElement | null {
  for (let parent = root.parentElement; parent; parent = parent.parentElement) {
    if (parent === document.body || parent === document.documentElement) return null;
    const style = getComputedStyle(parent);
    if (/(auto|scroll)/.test(`${style.overflowX} ${style.overflowY}`)) return parent;
  }
  return null;
}

/** The chart's current level, from its computed `zoom` (1 without one). */
function currentZoom(root: Element): number {
  const value = Number.parseFloat(getComputedStyle(root).getPropertyValue("zoom"));
  return Number.isFinite(value) && value > 0 ? value : 1;
}

/** The content box of the viewport (or of the chart's container when the page scrolls). */
function available(root: HTMLElement, viewport: HTMLElement | null) {
  const box = viewport ?? (root.parentElement as HTMLElement);
  const style = getComputedStyle(box);
  const pad = (a: string, b: string) => Number.parseFloat(a) + Number.parseFloat(b);
  return {
    width: box.clientWidth - pad(style.paddingLeft, style.paddingRight),
    height: viewport ? box.clientHeight - pad(style.paddingTop, style.paddingBottom) : Infinity,
  };
}

/**
 * The level at which the whole chart fits its viewport (ApexTree `fitScreen`): its width always,
 * its height when the viewport doesn't grow with its content. Never above 1 (fit doesn't enlarge a
 * small chart) or outside the limits.
 */
export function organizationChartFitZoom(
  root: HTMLElement,
  min: number = ORGANIZATION_CHART_ZOOM_LIMITS.min,
  max: number = ORGANIZATION_CHART_ZOOM_LIMITS.max,
): number {
  const node = root.firstElementChild as HTMLElement | null;
  if (!node) return clampOrganizationChartZoom(1, min, max);
  const zoom = currentZoom(root);
  const box = node.getBoundingClientRect();
  const width = box.width / zoom;
  const height = box.height / zoom;
  const viewport = organizationChartViewport(root);
  const space = available(root, viewport);
  // A viewport that keeps its height at the smallest level is bounded: the height counts too.
  let bounded = false;
  if (viewport) {
    const before = viewport.clientHeight;
    const inline = root.style.getPropertyValue("zoom");
    const priority = root.style.getPropertyPriority("zoom");
    root.style.setProperty("zoom", String(clampOrganizationChartZoom(min, min, max)), "important");
    bounded = viewport.clientHeight === before;
    if (inline) root.style.setProperty("zoom", inline, priority);
    else root.style.removeProperty("zoom");
  }
  if (width <= 0 || height <= 0) return clampOrganizationChartZoom(1, min, max);
  const fit = Math.min(1, space.width / width, bounded ? space.height / height : 1);
  return clampOrganizationChartZoom(Math.floor(fit * 1000) / 1000, min, max);
}

const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** The center of a viewport's content box (or of the window), in client px. */
function middle(viewport: HTMLElement | null) {
  if (!viewport) return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const box = viewport.getBoundingClientRect();
  return {
    x: box.left + viewport.clientLeft + viewport.clientWidth / 2,
    y: box.top + viewport.clientTop + viewport.clientHeight / 2,
  };
}

/**
 * Centers a node's label in the chart's viewport (only the viewport scrolls, not the page) once
 * its ancestors finished expanding (owners expand them first). Smooth unless reduced motion.
 */
export async function centerOrganizationChartNode(node: HTMLElement): Promise<void> {
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  const root = node.closest(ROOT);
  if (!root) return;
  // The children lists between the node and the root (each node's parent is a list).
  const animations: Animation[] = [];
  for (let item: Element = node; item.parentElement !== root; ) {
    const list = item.parentElement as HTMLElement;
    animations.push(...list.getAnimations());
    item = list.parentElement as Element;
  }
  await Promise.all(animations.map((animation) => animation.finished.catch(() => undefined)));
  const label = node.isConnected ? node.querySelector(`:scope > ${LABEL}`) : null;
  if (!label) return;
  const viewport = organizationChartViewport(root);
  const target = label.getBoundingClientRect();
  const frame = middle(viewport);
  (viewport ?? window).scrollBy({
    left: target.left + target.width / 2 - frame.x,
    top: target.top + target.height / 2 - frame.y,
    behavior: reduced() ? "auto" : "smooth",
  });
}

export interface OrganizationChartZoomOptions {
  /** `enableZoomPan`: wheel and pinch with a modifier, keys, drag to pan and the toolbar. */
  enabled?: boolean | undefined;
  /** The level the owner shows now. Default 1. */
  zoom?: number | undefined;
  /** Default 0.25. */
  min?: number | undefined;
  /** Default 2. */
  max?: number | undefined;
  /** The user asked for another level (already clamped). The owner decides and writes it. */
  onZoom?: ((level: number) => void) | undefined;
}

export interface OrganizationChartZoomController {
  /**
   * Replaces the options. When `zoom` changed, scrolls the viewport so the planned anchor (or the
   * viewport's center) stays where it was, and rewrites the toolbars.
   */
  update(options: OrganizationChartZoomOptions): void;
  /**
   * Prepares a change to `level` (clamped and returned): the content point at `anchor` (client
   * coordinates; default the viewport's center) stays in place, or with `start` the viewport
   * scrolls to its start. When the level is already shown, that scroll happens now.
   */
  plan(level: number, how?: { anchor?: { x: number; y: number }; start?: boolean }): number;
  /** The level that fits the viewport (`fitScreen`). */
  fit(): number;
  /** Rewrites the toolbars' value and limits (they also follow every update). */
  sync(): void;
  destroy(): void;
}

interface Pending {
  level: number;
  start: boolean;
  /** The anchor in client px and the content point under it, in unzoomed px of the root node. */
  client: { x: number; y: number };
  content: { x: number; y: number };
}

/**
 * Zoom and pan (ADR-0056): reports Ctrl / ⌘ + wheel, pinches, + / − / 0 and the toolbar as
 * `onZoom(level)`, pans the viewport on a mouse drag, and after each change keeps the content
 * under the pointer (or the viewport's center) in place. It owns no state: the owner writes the
 * level (`data-ok-zoom`, `--_ok-org-zoom`) and calls `update({ zoom })`.
 */
export function createOrganizationChartZoom(
  root: HTMLElement,
  initial: OrganizationChartZoomOptions = {},
): OrganizationChartZoomController {
  let options = initial;
  let shown = clampOrganizationChartZoom(initial.zoom ?? 1, initial.min, initial.max);
  let pending: Pending | null = null;
  let listeners: AbortController | null = null;

  const level = () => shown;
  const viewport = () => organizationChartViewport(root);
  /** What scrolls: the viewport, or the page. */
  const scroller = (): HTMLElement | Window => viewport() ?? window;
  const center = () => middle(viewport());
  const origin = () => (root.firstElementChild ?? root).getBoundingClientRect();

  const sync = () => {
    if (!root.id) return;
    const text = `${Math.round(shown * 100)}%`;
    const limits = {
      in: shown >= clampOrganizationChartZoom(1e9, options.min, options.max),
      out: shown <= clampOrganizationChartZoom(0.0001, options.min, options.max),
    };
    for (const toolbar of document.querySelectorAll(`[${TOOLBAR}]`)) {
      if (toolbar.getAttribute(TOOLBAR) !== root.id) continue;
      const value = toolbar.querySelector("[data-ok-organization-chart-zoom-value]");
      if (value && value.textContent !== text) value.textContent = text;
      for (const [name, at] of [
        ["data-ok-organization-chart-zoom-in", limits.in],
        ["data-ok-organization-chart-zoom-out", limits.out],
      ] as const) {
        const button = toolbar.querySelector(`[${name}]`);
        if (!button) continue;
        if (at) button.setAttribute("aria-disabled", "true");
        else button.removeAttribute("aria-disabled");
      }
    }
  };

  const plan: OrganizationChartZoomController["plan"] = (target, how = {}) => {
    const next = clampOrganizationChartZoom(target, options.min, options.max);
    const client = how.anchor ?? center();
    const box = origin();
    pending = {
      level: next,
      start: !!how.start,
      client,
      content: { x: (client.x - box.left) / shown, y: (client.y - box.top) / shown },
    };
    if (next === shown) settle();
    return next;
  };

  /** Applies the pending scroll once its level is shown. */
  const settle = () => {
    const change = pending;
    pending = null;
    if (!change || change.level !== shown) return;
    const target = scroller();
    if (change.start) {
      target.scrollTo({ left: 0, top: 0, behavior: "auto" });
      return;
    }
    const box = origin();
    target.scrollBy({
      left: box.left + change.content.x * shown - change.client.x,
      top: box.top + change.content.y * shown - change.client.y,
      behavior: "auto",
    });
  };

  /** A user request: plan it, then report it unless it changes nothing. */
  const ask = (target: number, how?: { anchor?: { x: number; y: number }; start?: boolean }) => {
    const next = plan(target, how);
    if (next !== shown) options.onZoom?.(next);
  };

  const act = (action: Action) => {
    if (action === "in") ask(level() * ORGANIZATION_CHART_ZOOM_STEP);
    else if (action === "out") ask(level() / ORGANIZATION_CHART_ZOOM_STEP);
    else if (action === "reset") ask(1);
    else ask(organizationChartFitZoom(root, options.min, options.max), { start: true });
  };

  const attach = () => {
    listeners = new AbortController();
    const signal = listeners.signal;
    const area = () => viewport() ?? root;
    const own = (event: Event) => {
      const target = event.target as Node | null;
      const view = viewport();
      return !!target && (root.contains(target) || (!!view && view.contains(target)));
    };

    const host = area();
    host.addEventListener(
      "wheel",
      (event) => {
        if (!(event.ctrlKey || event.metaKey)) return;
        // Always ours: the page must not zoom instead.
        event.preventDefault();
        const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 400 : 1;
        ask(level() * Math.exp(-event.deltaY * unit * 0.002), {
          anchor: { x: event.clientX, y: event.clientY },
        });
      },
      { signal, passive: false },
    );

    // WebKit's trackpad pinch (GestureEvent: `scale` since the gesture started).
    let base = 1;
    type Gesture = Event & { scale?: number; clientX?: number; clientY?: number };
    host.addEventListener(
      "gesturestart",
      (event) => {
        event.preventDefault();
        base = level();
      },
      { signal },
    );
    host.addEventListener(
      "gesturechange",
      (event: Gesture) => {
        event.preventDefault();
        if (typeof event.scale !== "number") return;
        ask(
          base * event.scale,
          typeof event.clientX === "number" && typeof event.clientY === "number"
            ? { anchor: { x: event.clientX, y: event.clientY } }
            : {},
        );
      },
      { signal },
    );

    host.addEventListener(
      "keydown",
      (event) => {
        if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
        if (!own(event) || (event.target as Element).closest?.(OWN_KEYS)) return;
        const action =
          event.key === "+" || event.key === "="
            ? "in"
            : event.key === "-" || event.key === "_"
              ? "out"
              : event.key === "0"
                ? "reset"
                : null;
        if (!action) return;
        event.preventDefault();
        act(action);
      },
      { signal },
    );

    // Drag to pan (mouse only: touch and pens scroll natively).
    let press: { id: number; x: number; y: number; moved: boolean } | null = null;
    host.addEventListener(
      "pointerdown",
      (event) => {
        if (event.pointerType !== "mouse" || event.button !== 0 || !own(event)) return;
        if ((event.target as Element).closest(INTERACTIVE)) return;
        press = { id: event.pointerId, x: event.clientX, y: event.clientY, moved: false };
      },
      { signal },
    );
    host.addEventListener(
      "pointermove",
      (event) => {
        if (!press || event.pointerId !== press.id) return;
        const dx = event.clientX - press.x;
        const dy = event.clientY - press.y;
        if (!press.moved) {
          if (Math.hypot(dx, dy) < 4) return;
          press.moved = true;
          root.setAttribute("data-ok-panning", "");
          window.getSelection()?.removeAllRanges();
          try {
            host.setPointerCapture(event.pointerId);
          } catch {
            // Synthetic pointers can't be captured.
          }
        }
        scroller().scrollBy({ left: -dx, top: -dy, behavior: "auto" });
        press.x = event.clientX;
        press.y = event.clientY;
      },
      { signal },
    );
    const end = (event: PointerEvent) => {
      if (!press || event.pointerId !== press.id) return;
      const moved = press.moved;
      press = null;
      root.removeAttribute("data-ok-panning");
      if (!moved) return;
      // The click that ends a pan isn't a click on a label (expandCollapseOnNodeClick). It comes
      // in the same task as the pointerup; the guard goes after it, clicked or not.
      const guard = new AbortController();
      window.addEventListener("click", (click) => click.preventDefault(), {
        capture: true,
        once: true,
        signal: guard.signal,
      });
      setTimeout(() => guard.abort(), 0);
    };
    host.addEventListener("pointerup", end, { signal });
    host.addEventListener("pointercancel", end, { signal });

    // The toolbars name the chart by id; they may be mounted later, so one document listener.
    document.addEventListener(
      "click",
      (event) => {
        if (!root.id) return;
        const target = event.target as Element | null;
        const toolbar = target?.closest?.(`[${TOOLBAR}]`);
        if (!toolbar || toolbar.getAttribute(TOOLBAR) !== root.id) return;
        for (const [name, action] of Object.entries(ACTIONS)) {
          const button = target?.closest(`[${name}]`);
          if (!button || !toolbar.contains(button)) continue;
          if (button.getAttribute("aria-disabled") === "true") return;
          act(action);
          return;
        }
      },
      { signal },
    );
  };

  const configure = () => {
    if (options.enabled && !listeners) attach();
    else if (!options.enabled && listeners) {
      listeners.abort();
      listeners = null;
      root.removeAttribute("data-ok-panning");
    }
  };
  configure();
  sync();

  return {
    update(next) {
      options = next;
      configure();
      const zoom = clampOrganizationChartZoom(next.zoom ?? 1, next.min, next.max);
      const changed = zoom !== shown;
      shown = zoom;
      if (changed) settle();
      sync();
    },
    plan,
    fit: () => organizationChartFitZoom(root, options.min, options.max),
    sync,
    destroy() {
      listeners?.abort();
      listeners = null;
      pending = null;
      root.removeAttribute("data-ok-panning");
    },
  };
}
