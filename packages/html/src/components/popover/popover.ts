import { createPopoverController, initialMenuItem, popoverOptions } from "@owlky/core";
import { defineComponent } from "../../runtime/define.js";
import type { ComponentInstance, Runtime } from "../../runtime/types.js";

/** Why a popover closes: Escape, a press outside, a trigger, a chosen menu item, Tab, the API. */
export type PopoverCloseReason = "escape" | "backdrop" | "trigger" | "select" | "tab" | "api";

export interface PopoverInstance extends ComponentInstance {
  readonly isOpen: boolean;
  /** Opens next to `anchor`. Returns `false` if `ok:popover:beforeopen` was prevented. */
  open(anchor: Element): boolean;
  /** Returns `false` if `ok:popover:beforeclose` was prevented. */
  close(reason?: PopoverCloseReason): boolean;
  toggle(anchor: Element): boolean;
}

/** Arrow size in px (`--_ok-arrow-size` in popover.css). */
const ARROW = 24;
const { arrow, disableEscapeKeyDown, disableAutoFocus, disableRestoreFocus } =
  popoverOptions.options;
const OPEN = "data-ok-popover-open";
const HOVER = "data-ok-popover-hover";

const rootOf = (from: Element) => from.getRootNode() as Document | ShadowRoot;

/** Triggers of a popover (click or hover), resolved in its own root. */
function triggersOf(element: Element): Element[] {
  if (!element.id) return [];
  const id = CSS.escape(element.id);
  return [...rootOf(element).querySelectorAll(`[${OPEN}="${id}"], [${HOVER}="${id}"]`)];
}

/**
 * Popover — spec: specs/components/popover.md (also the paper of Menu)
 *
 * Markup:   <button data-ok-popover-open="p1" aria-haspopup="dialog" aria-expanded="false">
 *           <div id="p1" popover="manual" data-ok-popover data-ok-placement="bottom">…</div>
 * Triggers: [data-ok-popover-open="id"] toggles on click; [data-ok-popover-hover="id"] opens on
 *           hover and focus, closes on leave and blur (without moving focus). Both carry
 *           `aria-expanded`, kept in sync.
 * Options:  data-ok-placement, data-ok-arrow, data-ok-disable-escape-key-down,
 *           data-ok-disable-auto-focus, data-ok-disable-restore-focus (re-read on every open)
 * Events:   ok:popover:beforeopen (cancelable, detail.anchor), ok:popover:open,
 *           ok:popover:beforeclose (cancelable, detail.reason), ok:popover:close (detail.reason)
 * A popover holding a `[role=menu]` focuses its selected (or first) item when it opens.
 */
export const popover = defineComponent<PopoverInstance>({
  name: "popover",
  selector: "[data-ok-popover]",

  setup(element, { emit }) {
    let hovered = false;
    const options = () => ({
      arrow: element.hasAttribute(arrow.attr) ? ARROW : 0,
      offset: element.hasAttribute(arrow.attr) ? 14 : 8,
      closeOnEscape: !element.hasAttribute(disableEscapeKeyDown.attr),
      autoFocus: !hovered && !element.hasAttribute(disableAutoFocus.attr),
      restoreFocus: !hovered && !element.hasAttribute(disableRestoreFocus.attr),
      initialFocus: () => {
        const menu = element.querySelector('[role="menu"]');
        return menu ? initialMenuItem(menu) : null;
      },
      onDismiss: (reason: "escape" | "backdrop") => instance.close(reason),
    });
    const controller = createPopoverController(element, options());

    const sync = () => {
      for (const trigger of triggersOf(element)) {
        trigger.setAttribute("aria-expanded", String(controller.isOpen));
        trigger.setAttribute("aria-controls", element.id);
      }
    };

    const instance: PopoverInstance & { hover(anchor: Element, on: boolean): void } = {
      get isOpen() {
        return controller.isOpen;
      },
      open(anchor) {
        if (controller.isOpen) return true;
        if (!emit("beforeopen", { anchor }, { cancelable: true })) return false;
        controller.setOptions(options());
        controller.open(anchor);
        sync();
        emit("open", { anchor });
        return true;
      },
      close(reason = "api") {
        if (!controller.isOpen) return true;
        if (!emit("beforeclose", { reason }, { cancelable: true })) return false;
        controller.close();
        hovered = false;
        sync();
        emit("close", { reason });
        return true;
      },
      toggle(anchor) {
        return controller.isOpen ? instance.close("trigger") : instance.open(anchor);
      },
      hover(anchor, on) {
        if (on) {
          if (controller.isOpen) return;
          hovered = true;
          if (!instance.open(anchor)) hovered = false;
        } else if (hovered) instance.close("trigger");
      },
      destroy() {
        controller.destroy();
      },
    };
    sync();
    return instance;
  },

  delegate: [
    {
      event: "click",
      selector: `[${OPEN}]`,
      handle(trigger, event, runtime) {
        const id = trigger.getAttribute(OPEN) as string;
        const instance = runtime.getOrCreate<PopoverInstance>(
          rootOf(trigger).getElementById(id),
          "popover",
        );
        if (!instance) {
          console.warn(`[owlky] No popover with id "${id}" for this trigger.`, trigger);
          return;
        }
        event.preventDefault();
        instance.toggle(trigger);
      },
    },
    ...(["pointerover", "focusin"] as const).map((event) => ({
      event,
      selector: `[${HOVER}]`,
      handle(trigger: Element, _event: Event, runtime: Runtime) {
        hoverOf(trigger, runtime)?.hover(trigger, true);
      },
    })),
    ...(["pointerout", "focusout"] as const).map((event) => ({
      event,
      selector: `[${HOVER}]`,
      handle(trigger: Element, e: Event, runtime: Runtime) {
        const next = (e as PointerEvent | FocusEvent).relatedTarget;
        if (next instanceof Node && trigger.contains(next)) return;
        hoverOf(trigger, runtime)?.hover(trigger, false);
      },
    })),
  ],
});

type HoverInstance = PopoverInstance & { hover(anchor: Element, on: boolean): void };

function hoverOf(trigger: Element, runtime: Runtime): HoverInstance | undefined {
  const id = trigger.getAttribute(HOVER) as string;
  return runtime.getOrCreate<HoverInstance>(rootOf(trigger).getElementById(id), "popover");
}
