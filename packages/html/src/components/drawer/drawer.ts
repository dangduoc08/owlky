import {
  createDrawerSwipe,
  createModalController,
  type DrawerSwipe,
  type DrawerSwipeOptions,
  drawerOptions,
  drawerStyle,
  readNumber,
  readStyle,
} from "@owlky/core";
import { defineComponent } from "../../runtime/define.js";
import { syncCustomProperties } from "../../runtime/style.js";
import type { ComponentInstance, EventSpec } from "../../runtime/types.js";

export type DrawerCloseReason = "escape" | "backdrop" | "trigger" | "api" | "native" | "swipe";

/** Events of this component (`ok:<name>:<event>` on the root). */
export interface DrawerEvents {
  /**
   * Before the drawer opens. Call `preventDefault()` to keep it closed. A swipe from the edge
   * (`data-ok-swipeable`) fires it with `trigger: null` once the finger lifts.
   */
  beforeopen: EventSpec<{ trigger: HTMLElement | null }, true>;
  /** After the drawer opened. */
  open: EventSpec<{ trigger: HTMLElement | null }>;
  /** Before the drawer closes. Call `preventDefault()` to keep it open. */
  beforeclose: EventSpec<{ reason: DrawerCloseReason }, true>;
  /** After the drawer closed, with what closed it. */
  close: EventSpec<{ reason: DrawerCloseReason }>;
}

export interface DrawerInstance extends ComponentInstance {
  /** Whether the drawer is open. */
  readonly isOpen: boolean;
  /** Opens the drawer. Returns `false` if `ok:drawer:beforeopen` was prevented. */
  open(trigger?: HTMLElement | null): boolean;
  /**
   * Closes the drawer. Returns `false` if `ok:drawer:beforeclose` was prevented or it is
   * permanent. A temporary drawer slides out first: `ok:drawer:close` fires once it is closed.
   */
  close(reason?: DrawerCloseReason): boolean;
  /** Opens the drawer when it is closed, and closes it otherwise. */
  toggle(trigger?: HTMLElement | null): boolean;
}

/** `id` lookup that also works inside shadow roots (delegated targets are always connected). */
const byId = (from: Element, id: string): Element | null =>
  (from.getRootNode() as Document | ShadowRoot).getElementById(id);

const {
  anchor,
  variant,
  disableEscapeKeyDown,
  disableRestoreFocus,
  disableScrollLock,
  swipeable,
  swipeAreaWidth,
  hysteresis,
  minFlingVelocity,
  disableSwipeToOpen,
  disableDiscovery,
  disableBackdropTransition,
} = drawerOptions.options;
const STYLED = ["data-ok-elevation", "data-ok-transition-duration"];
/** Attributes the swipe reads (swipeable drawers, 4.18.46). */
const SWIPE = [
  anchor.attr,
  swipeable.attr,
  swipeAreaWidth.attr,
  hysteresis.attr,
  minFlingVelocity.attr,
  disableSwipeToOpen.attr,
  disableDiscovery.attr,
  disableBackdropTransition.attr,
];

/**
 * Drawer — spec: specs/components/drawer.md
 *
 * Markup:   temporary: <dialog id="x" data-ok-drawer data-ok-anchor="left" aria-label="…">
 *           docked:    <aside id="x" data-ok-drawer data-ok-variant="persistent|permanent" … hidden?>
 *             <div data-ok-drawer-content>…</div>
 * Triggers: [data-ok-drawer-open="x"] (opens; toggles a persistent drawer, kept in aria-expanded),
 *           [data-ok-drawer-close] (inside) or [data-ok-drawer-close="x"]
 * Options:  data-ok-variant (read at mount), data-ok-disable-escape-key-down, data-ok-hide-backdrop
 *           (CSS), data-ok-open (open on load); data-ok-swipeable (+ data-ok-swipe-area-width,
 *           -hysteresis, -min-fling-velocity, -disable-swipe-to-open, -disable-discovery,
 *           -disable-backdrop-transition): touch swipes close it and, from the edge strip
 *           `<div data-ok-drawer-swipe-area>` right after the dialog, open it (core
 *           createDrawerSwipe)
 * Events:   ok:drawer:beforeopen (cancelable), ok:drawer:open,
 *           ok:drawer:beforeclose (cancelable, detail.reason), ok:drawer:close (detail.reason,
 *           after the exit slide)
 */
export const drawer = defineComponent<DrawerInstance, DrawerEvents>({
  name: "drawer",
  selector: "[data-ok-drawer]",

  setup(element, { emit }) {
    const kind = readStyle(element, variant);
    // Options are re-read on every open, so data-ok-* changes made while closed take effect.
    const options = () => ({
      contentSelector: "[data-ok-drawer-content]",
      closeOnEscape: !element.hasAttribute(disableEscapeKeyDown.attr),
      restoreFocus: !element.hasAttribute(disableRestoreFocus.attr),
      lockScroll: !element.hasAttribute(disableScrollLock.attr),
      onDismiss: (reason: DrawerCloseReason) => instance.close(reason),
      onExternalClose: () => emit("close", { reason: "native" }),
    });
    const controller = kind === "temporary" ? createModalController(element, options()) : null;
    // Elevation and slide length through CSSOM (data-ok-elevation, data-ok-transition-duration).
    let written: string[] = [];
    const timing = () => {
      written = syncCustomProperties(
        element,
        drawerStyle({
          elevation: element.getAttribute("data-ok-elevation") ?? undefined,
          transitionDuration: element.getAttribute("data-ok-transition-duration") ?? undefined,
        }),
        written,
      );
    };
    timing();

    // Swipeable: core createDrawerSwipe on the dialog and the edge strip after it.
    let swipe: DrawerSwipe | undefined;
    let swipeRefused = false;
    const swipeOptions = (): DrawerSwipeOptions => ({
      anchor: readStyle(element, anchor),
      swipeAreaWidth: readNumber(element, swipeAreaWidth) as number,
      hysteresis: readNumber(element, hysteresis) as number,
      minFlingVelocity: readNumber(element, minFlingVelocity) as number,
      disableSwipeToOpen: element.hasAttribute(disableSwipeToOpen.attr),
      disableDiscovery: element.hasAttribute(disableDiscovery.attr),
      disableBackdropTransition: element.hasAttribute(disableBackdropTransition.attr),
      // The swipe already opened the dialog: report it like an open (refusable).
      isOpen: () => !swipeRefused,
      onOpen: () => {
        swipeRefused = !emit("beforeopen", { trigger: null }, { cancelable: true });
        if (!swipeRefused) emit("open", { trigger: null });
      },
      onClose: () => instance.close("swipe"),
    });
    const syncSwipe = () => {
      const on = controller !== null && element.hasAttribute(swipeable.attr);
      if (on && !swipe) {
        const next = element.nextElementSibling;
        const area = next?.matches("[data-ok-drawer-swipe-area]") ? (next as HTMLElement) : null;
        swipe = createDrawerSwipe(element, controller, area, swipeOptions());
      } else if (!on && swipe) {
        swipe.destroy();
        swipe = undefined;
      } else swipe?.setOptions(swipeOptions());
    };
    syncSwipe();

    const observer = new MutationObserver((records) => {
      if (records.some((record) => STYLED.includes(record.attributeName as string))) timing();
      if (records.some((record) => SWIPE.includes(record.attributeName as string))) syncSwipe();
    });
    observer.observe(element, { attributes: true, attributeFilter: [...STYLED, ...SWIPE] });

    /** Docked drawers: triggers report the state (`aria-expanded`). */
    const syncTriggers = () => {
      if (controller || !element.id) return;
      const root = element.getRootNode() as Document | ShadowRoot;
      for (const trigger of root.querySelectorAll(
        `[data-ok-drawer-open="${CSS.escape(element.id)}"]`,
      )) {
        trigger.setAttribute("aria-expanded", String(instance.isOpen));
        trigger.setAttribute("aria-controls", element.id);
      }
    };

    const instance: DrawerInstance = {
      get isOpen() {
        return controller ? controller.isOpen : !element.hidden;
      },
      open(trigger = null) {
        if (instance.isOpen) return true;
        if (!emit("beforeopen", { trigger }, { cancelable: true })) return false;
        swipeRefused = false;
        if (controller) {
          controller.setOptions(options());
          controller.open(trigger);
        } else {
          element.hidden = false;
          syncTriggers();
        }
        emit("open", { trigger });
        return true;
      },
      close(reason = "api") {
        if (!instance.isOpen) return true;
        if (kind === "permanent") return false;
        if (!emit("beforeclose", { reason }, { cancelable: true })) return false;
        if (controller) {
          // After the exit (the slide back to the edge); an `open()` during it keeps it open.
          const closing = controller.close();
          if (!controller.isClosing) emit("close", { reason });
          else
            closing.then((closed) => {
              if (closed) emit("close", { reason });
            });
          return true;
        }
        element.hidden = true;
        syncTriggers();
        emit("close", { reason });
        return true;
      },
      toggle(trigger = null) {
        return instance.isOpen ? instance.close("trigger") : instance.open(trigger);
      },
      destroy() {
        swipe?.destroy();
        controller?.destroy();
        observer.disconnect();
      },
    };

    if (kind === "permanent") element.hidden = false;
    if (element.hasAttribute("data-ok-open")) instance.open();
    syncTriggers();
    return instance;
  },

  delegate: [
    {
      event: "click",
      selector: "[data-ok-drawer-open]",
      handle(trigger, event, runtime) {
        const id = trigger.getAttribute("data-ok-drawer-open") as string;
        const target = byId(trigger, id);
        const instance = runtime.getOrCreate<DrawerInstance>(target, "drawer");
        if (!instance) {
          console.warn(`[owlky] No drawer with id "${id}" for this trigger.`, trigger);
          return;
        }
        event.preventDefault();
        // A docked (persistent) drawer toggles; a temporary one opens (it covers the trigger).
        const docked = readStyle(target as Element, variant) !== "temporary";
        if (docked && instance.isOpen) instance.close("trigger");
        else instance.open(trigger as HTMLElement);
      },
    },
    {
      event: "click",
      selector: "[data-ok-drawer-close]",
      handle(trigger, event, runtime) {
        const id = trigger.getAttribute("data-ok-drawer-close");
        const target = id ? byId(trigger, id) : trigger.closest("[data-ok-drawer]");
        const instance = runtime.get<DrawerInstance>(target, "drawer");
        if (!instance) return;
        event.preventDefault();
        instance.close("trigger");
      },
    },
  ],
});
