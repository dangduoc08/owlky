/*
 * Swipeable drawer — spec: specs/components/drawer.md (Swipeable), roadmap 4.18.46, ADR-0062
 * (5.3). MUI's `SwipeableDrawer` on the shared swipe helper (`createSwipe`): a touch or pen
 * swipe on an open temporary drawer towards its edge closes it; one from the edge strip
 * (`[data-ok-drawer-swipe-area]`, the dialog's next sibling) opens it. The panel follows the
 * finger (`--_ok-drawer-swipe-x|y` through CSSOM, `data-ok-swiping`) and the backdrop fades with it
 * (`--_ok-drawer-swipe-progress`, drawn by the dialog's `::before`); on release it settles
 * (`data-ok-swipe-settling`, the CSS transitions). Owners keep the state: they hear `onOpen` /
 * `onClose` and open or close through their modal controller. A swipe to open shows the dialog
 * non-modally while the finger moves (the page keeps the pointer), then opens it modally.
 */
import type { DrawerAnchor } from "../anatomy/anatomy.js";
import type { ModalController } from "../modal/modal-controller.js";
import { type ExitHandle, playExit, waitForAnimations } from "../motion/presence.js";
import { createSwipe, type SwipeDirection, type SwipeHandle } from "../motion/swipe.js";

export interface DrawerSwipeOptions {
  /** The drawer's edge. */
  anchor: DrawerAnchor;
  /** Width of the edge strip that opens the drawer, px. Default 20. */
  swipeAreaWidth?: number | undefined;
  /** Share of the panel's size it must be pulled to change state (0–1). Default 0.52. */
  hysteresis?: number | undefined;
  /** px/s from which a shorter swipe still changes the state. Default 450. */
  minFlingVelocity?: number | undefined;
  disableSwipeToOpen?: boolean | undefined;
  /** Touching the edge strip doesn't slide a sliver of the panel in. */
  disableDiscovery?: boolean | undefined;
  /** The backdrop stays fully shown while the panel is swiped. */
  disableBackdropTransition?: boolean | undefined;
  /** The owner's open state (a swipe to open is refused when it doesn't become `true`). */
  isOpen(): boolean;
  /** A swipe asks to open. The drawer is already open modally: keep it open by updating state. */
  onOpen(): void;
  /** A swipe asks to close: close through the modal controller to accept. */
  onClose(): void;
}

export interface DrawerSwipe {
  setOptions(options: DrawerSwipeOptions): void;
  destroy(): void;
}

export const SWIPING_ATTR = "data-ok-swiping";
export const SWIPE_SETTLING_ATTR = "data-ok-swipe-settling";
const X = "--_ok-drawer-swipe-x";
const Y = "--_ok-drawer-swipe-y";
const PROGRESS = "--_ok-drawer-swipe-progress";
const AREA = "--_ok-drawer-swipe-area";
const POINTERS = ["touch", "pen"] as const;
/** Presses on these don't start a swipe to close (they move their own content). */
const OWN_POINTER =
  'input, textarea, select, [contenteditable="true"], [contenteditable=""], [role="slider"]';
/** Frames an owner may take to act on `onOpen` / `onClose` (React renders a frame later). */
const OWNER_FRAMES = 8;

const CLOSE: Record<DrawerAnchor, SwipeDirection> = {
  left: "left",
  right: "right",
  top: "top",
  bottom: "bottom",
};
const OPEN: Record<DrawerAnchor, SwipeDirection> = {
  left: "right",
  right: "left",
  top: "bottom",
  bottom: "top",
};

/** Calls `yes` once `accepted()` holds (now or within a few frames), `no` otherwise. */
function whenOwner(accepted: () => boolean, yes: () => void, no: () => void): void {
  let frames = 0;
  const check = () => {
    if (accepted()) yes();
    else if (++frames > OWNER_FRAMES) no();
    else requestAnimationFrame(check);
  };
  check();
}

/**
 * Swipes on a temporary drawer (`dialog`, opened and closed by `controller`) and its edge strip
 * (`area`, optional). See the file comment.
 */
export function createDrawerSwipe(
  dialog: HTMLElement,
  controller: ModalController,
  area: HTMLElement | null,
  initial: DrawerSwipeOptions,
): DrawerSwipe {
  let options = initial;
  let size = 0;
  /** Visible part of the panel when the open swipe started (the discovery peek). */
  let start = 0;
  let previewing = false;
  let settle: { cancel(): void } | undefined;
  /** The exit of a dropped peek (the dialog is hidden once it ends). */
  let dropping: ExitHandle | undefined;

  const paper = () => dialog.querySelector<HTMLElement>("[data-ok-drawer-content]") ?? dialog;
  const horizontal = () => options.anchor === "left" || options.anchor === "right";
  const measure = () => {
    const panel = paper();
    size = (horizontal() ? panel.offsetWidth : panel.offsetHeight) || 1;
  };
  const strip = () => Math.max(options.swipeAreaWidth ?? 20, 0);
  const hysteresis = () => Math.min(Math.max(options.hysteresis ?? 0.52, 0), 1);

  /** Draws the panel `hidden` px towards its edge and the backdrop to match. */
  const draw = (hidden: number) => {
    const offset = Math.min(Math.max(hidden, 0), size);
    const sign = options.anchor === "left" || options.anchor === "top" ? -1 : 1;
    const panel = paper();
    panel.style.setProperty(horizontal() ? X : Y, `${sign * offset}px`);
    panel.style.removeProperty(horizontal() ? Y : X);
    dialog.style.setProperty(
      PROGRESS,
      options.disableBackdropTransition
        ? "1"
        : String(Math.round((1 - offset / size) * 1000) / 1000),
    );
  };

  const begin = () => {
    settle?.cancel();
    settle = undefined;
    dialog.removeAttribute(SWIPE_SETTLING_ATTR);
    dialog.setAttribute(SWIPING_ATTR, "");
  };

  /** Lets the CSS take the panel to rest (open, or through the owner's exit) and cleans up. */
  const release = (open: boolean, after?: () => void) => {
    const panel = paper();
    dialog.removeAttribute(SWIPING_ATTR);
    dialog.setAttribute(SWIPE_SETTLING_ATTR, "");
    panel.style.removeProperty(X);
    panel.style.removeProperty(Y);
    dialog.style.setProperty(PROGRESS, open || options.disableBackdropTransition ? "1" : "0");
    const wait = waitForAnimations(dialog);
    settle = wait;
    wait.finished.then((ended) => {
      if (!ended) return;
      settle = undefined;
      dialog.removeAttribute(SWIPE_SETTLING_ATTR);
      dialog.style.removeProperty(PROGRESS);
      after?.();
    });
  };

  /** The open swipe gave up: slide the panel back out and hide the non-modal dialog. */
  const dropPreview = () => {
    previewing = false;
    const exit = playExit(dialog);
    dropping = exit;
    release(false, () => {
      dropping = undefined;
      dialog.removeAttribute("open");
      exit.restore();
    });
  };

  const close = createSwipe(dialog, {
    pointerTypes: POINTERS,
    directions: () =>
      controller.isOpen && !controller.isClosing && !previewing ? [CLOSE[options.anchor]] : [],
    threshold: () => hysteresis() * size,
    velocity: () => options.minFlingVelocity ?? 450,
    // Controls that handle their own pointer moves (a slider, text) don't start a swipe.
    filter: (event) => !event.defaultPrevented && !(event.target as Element).closest(OWN_POINTER),
    onStart: () => {
      measure();
      begin();
    },
    onMove: (info) => draw(info.distance),
    onSwipe: () => {
      // The panel stays where the finger left it until the owner's exit takes it from there.
      options.onClose();
      whenOwner(
        () => controller.isClosing || !controller.isOpen,
        () => release(false),
        () => release(true),
      );
    },
    onCancel: (info) => {
      if (info) release(true);
    },
  });

  let open: SwipeHandle | undefined;
  const preview = (visible: number) => {
    if (!previewing) {
      previewing = true;
      begin();
      // Non-modal while the finger moves: the page (and the strip under it) keeps the pointer.
      dialog.setAttribute("open", "");
      measure();
    }
    draw(size - visible);
  };
  if (area) {
    open = createSwipe(area, {
      pointerTypes: POINTERS,
      directions: () =>
        options.disableSwipeToOpen || controller.isOpen || controller.isClosing
          ? []
          : [OPEN[options.anchor]],
      threshold: () => hysteresis() * size - start,
      velocity: () => options.minFlingVelocity ?? 450,
      onPress: () => {
        start = options.disableDiscovery ? 0 : strip();
        if (start > 0) preview(start);
      },
      onStart: () => preview(start),
      onMove: (info) => preview(start + info.distance),
      onSwipe: () => {
        previewing = false;
        dialog.removeAttribute("open");
        controller.open(null);
        options.onOpen();
        release(true);
        whenOwner(
          () => options.isOpen(),
          () => undefined,
          () => {
            void controller.close();
          },
        );
      },
      onCancel: () => {
        if (previewing) dropPreview();
      },
    });
  }

  const sizeArea = () => {
    if (!area) return;
    const width = strip();
    if (width === 20) area.style.removeProperty(AREA);
    else area.style.setProperty(AREA, `${width}px`);
  };
  sizeArea();

  return {
    setOptions(next) {
      options = next;
      sizeArea();
    },
    destroy() {
      // A peek (shown or being dropped) is hidden at once.
      const peek = previewing;
      previewing = false;
      close.destroy();
      open?.destroy();
      settle?.cancel();
      if (peek || dropping) {
        dropping?.cancel();
        dropping = undefined;
        dialog.removeAttribute("open");
      }
      dialog.removeAttribute(SWIPING_ATTR);
      dialog.removeAttribute(SWIPE_SETTLING_ATTR);
      dialog.style.removeProperty(PROGRESS);
      area?.style.removeProperty(AREA);
      const panel = paper();
      panel.style.removeProperty(X);
      panel.style.removeProperty(Y);
    },
  };
}
