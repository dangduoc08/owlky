import {
  createLayoutGroup,
  createLayoutNode,
  flushLayout,
  hasMotionLayout,
  LAYOUT_ATTRS,
  type LayoutGroup,
  type LayoutNode,
  readMotionLayout,
} from "@owlky/core";

/** What the motion runtime emits for layout animations (`ok:motion:<name>`). */
export type LayoutEmitter = (
  type: "layoutanimationstart" | "layoutanimationcomplete",
  detail: undefined,
) => void;

export interface LayoutDriver {
  /** Takes the box now: the next change animates from it. */
  measure(): void;
  /** Animates from the box `measure()` took (or the last one known) to where it is now. */
  animateLayout(): void;
  destroy(): void;
}

/*
 * One watcher for every layout Motion of the page (module-scoped, ADR-0007): a MutationObserver
 * on the document. The DOM has already changed when it reports, so a node animates from its last
 * known box (kept by core). Nodes whose parent element (or
 * `[data-ok-layout-group]`) holds a change animate; the others only refresh their box, as they do
 * after a resize or a scroll. A focused element the change moved gets the focus back.
 */
const watched = new Map<HTMLElement, LayoutNode>();
const groups = new WeakMap<Element, LayoutGroup>();
let observer: MutationObserver | undefined;
let resize: ResizeObserver | undefined;
let lastFocus: Element | null = null;

const onFocus = (event: FocusEvent) => {
  lastFocus = event.target as Element;
};

/** Boxes that moved without a mutation (scroll, resize) are measured again (one batch). */
const refresh = () => {
  for (const node of watched.values()) if (!node.animating) node.measure();
};

const scope = (element: HTMLElement) =>
  element.closest(`[${LAYOUT_ATTRS.group}]`) ?? element.parentElement;

function onMutations(records: MutationRecord[]) {
  const targets = records.map((record) => record.target);
  // The focused element (or its ancestor) was taken out and put back: give it the focus again.
  const moved = (node: Node) =>
    lastFocus !== null && (node === lastFocus || node.contains(lastFocus));
  const focus = records.some((record) => [...record.removedNodes].some(moved)) ? lastFocus : null;
  for (const [element, node] of watched) {
    if (!element.isConnected) continue;
    const area = scope(element);
    if (area && targets.some((target) => area.contains(target))) node.snapshot("last");
    else if (!node.animating) node.measure();
  }
  flushLayout({ focus });
}

function watch(element: HTMLElement, node: LayoutNode) {
  watched.set(element, node);
  if (!observer) {
    observer = new MutationObserver(onMutations);
    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      characterData: true,
    });
    resize = new ResizeObserver(refresh);
    document.addEventListener("focusin", onFocus, true);
    document.addEventListener("scroll", refresh, { capture: true, passive: true });
  }
  const sizes = resize as ResizeObserver;
  sizes.observe(element);
  // A Motion is set up while it is on the page, so it has a parent.
  sizes.observe(element.parentElement as HTMLElement);
}

function unwatch(element: HTMLElement) {
  watched.delete(element);
  resize?.unobserve(element);
  if (watched.size > 0) return;
  observer?.disconnect();
  resize?.disconnect();
  observer = undefined;
  resize = undefined;
  document.removeEventListener("focusin", onFocus, true);
  document.removeEventListener("scroll", refresh, true);
  lastFocus = null;
}

/** The group of `element`'s closest `[data-ok-layout-group]` (one per container). */
function groupOf(element: HTMLElement): LayoutGroup | undefined {
  const root = element.closest(`[${LAYOUT_ATTRS.group}]`);
  if (!root) return undefined;
  let group = groups.get(root);
  if (!group) {
    group = createLayoutGroup(root.getAttribute(LAYOUT_ATTRS.group) || undefined);
    groups.set(root, group);
  }
  return group;
}

/**
 * Layout animations of a Motion (ADR-0062, 5.4): reads `data-ok-layout`, `data-ok-layout-id`
 * and `data-ok-transition`, runs core `createLayoutNode` while either layout attribute is present
 * and follows their changes.
 */
export function driveLayout(element: HTMLElement, emit: LayoutEmitter): LayoutDriver {
  let node: LayoutNode | undefined;
  const options = () => ({
    ...readMotionLayout(element),
    group: groupOf(element),
    onLayoutAnimationStart: () => emit("layoutanimationstart", undefined),
    onLayoutAnimationComplete: () => emit("layoutanimationcomplete", undefined),
  });
  const sync = () => {
    const on = hasMotionLayout(element);
    if (on && node) node.setOptions(options());
    else if (on) {
      node = createLayoutNode(element, options());
      watch(element, node);
    } else if (node) {
      node.destroy();
      unwatch(element);
      node = undefined;
    }
  };
  sync();
  const own = new MutationObserver(sync);
  own.observe(element, {
    attributes: true,
    attributeFilter: [LAYOUT_ATTRS.layout, LAYOUT_ATTRS.layoutId, "data-ok-transition"],
  });
  return {
    measure() {
      node?.snapshot("live");
    },
    animateLayout() {
      if (!node) return;
      node.snapshot("last");
      flushLayout();
    },
    destroy() {
      own.disconnect();
      if (!node) return;
      node.destroy();
      unwatch(element);
      node = undefined;
    },
  };
}
