import {
  createHoverIntent,
  createPopoverController,
  pointAnchor,
  readNumber,
  tooltipOptions,
} from "@owlky/core";
import { defineComponent } from "../../runtime/define.js";
import type { ComponentInstance, EventSpec, Runtime } from "../../runtime/types.js";

/** Events of this component (`ok:<name>:<event>` on the root). */
export interface TooltipEvents {
  /** After the tooltip showed for `trigger`. */
  open: EventSpec<{ trigger: Element | null }>;
  /** After the tooltip hid. */
  close: EventSpec;
}

export interface TooltipInstance extends ComponentInstance {
  /** Whether the tooltip shows. */
  readonly isOpen: boolean;
  /** Shows it next to `trigger` (default: the last trigger, else the first one in the page). */
  show(trigger?: Element): void;
  /** Hides the tooltip. */
  hide(): void;
}

interface Internal extends TooltipInstance {
  intent: ReturnType<typeof createHoverIntent>;
  trigger: Element | null;
  /** The pointer over the trigger (`data-ok-follow-cursor`). */
  pointer: { x: number; y: number } | null;
  /** Re-reads the timing options. */
  refresh(): void;
  /** Moves a tooltip that follows the pointer. */
  follow(): void;
}

const ARROW = 10;
const { arrow, enterDelay, leaveDelay, enterNextDelay, followCursor } = tooltipOptions.options;
const RELATIONS = ["aria-labelledby", "aria-describedby"] as const;
const TRIGGER = "[aria-labelledby], [aria-describedby]";
const RUNTIME_OFF = '[data-ok-runtime="off"]';

const rootOf = (from: Element) => from.getRootNode() as Document | ShadowRoot;

/** The tooltip a trigger points at through aria-labelledby / aria-describedby. */
function tooltipFor(trigger: Element): HTMLElement | null {
  for (const relation of RELATIONS) {
    for (const id of (trigger.getAttribute(relation) ?? "").split(/\s+/)) {
      if (!id) continue;
      const element = rootOf(trigger).getElementById(id);
      if (element?.hasAttribute("data-ok-tooltip") && !element.closest(RUNTIME_OFF)) return element;
    }
  }
  return null;
}

const instanceFor = (trigger: Element, runtime: Runtime) =>
  runtime.getOrCreate<Internal>(tooltipFor(trigger), "tooltip");

/**
 * Tooltip — spec: specs/components/tooltip.md
 *
 * Markup:  <button aria-labelledby="t1">…icon…</button>   (or aria-describedby for a labelled one)
 *          <div id="t1" role="tooltip" popover="manual" data-ok-tooltip data-ok-placement="bottom">Add</div>
 * Behavior: hover (data-ok-enter-delay, default 100 ms; data-ok-leave-delay, 0), keyboard focus
 *          (focus-visible), a touch long press (700 ms) open it; leaving, blur and Escape close it.
 *          The tooltip is hoverable. Events: ok:tooltip:open, ok:tooltip:close.
 */
export const tooltip = defineComponent<TooltipInstance, TooltipEvents>({
  name: "tooltip",
  selector: "[data-ok-tooltip]",

  setup(element, { emit, signal }) {
    const options = () => ({
      arrow: element.hasAttribute(arrow.attr) ? ARROW : 0,
      offset: element.hasAttribute(arrow.attr) ? 10 : 8,
      autoFocus: false,
      restoreFocus: false,
      closeOnOutside: false,
      onDismiss: () => instance.intent.hide(),
    });
    const controller = createPopoverController(element, options());
    const anchorOf = (trigger: Element) =>
      element.hasAttribute(followCursor.attr) && instance.pointer
        ? pointAnchor(instance.pointer.x, instance.pointer.y, trigger)
        : trigger;
    const intentOptions = () => ({
      enterNextDelay: readNumber(element, enterNextDelay) as number | undefined,
      enterDelay: readNumber(element, enterDelay) as number,
      leaveDelay: readNumber(element, leaveDelay) as number,
      onOpenChange: (open: boolean) => {
        const trigger =
          instance.trigger ??
          rootOf(element).querySelector(
            `[aria-labelledby~="${CSS.escape(element.id)}"], [aria-describedby~="${CSS.escape(element.id)}"]`,
          );
        if (open && trigger) {
          controller.setOptions(options());
          controller.open(anchorOf(trigger));
          emit("open", { trigger });
        } else if (!open && controller.isOpen) {
          controller.close();
          emit("close");
        }
      },
    });
    const instance: Internal = {
      intent: createHoverIntent(intentOptions()),
      trigger: null,
      pointer: null,
      refresh() {
        instance.intent.setOptions(intentOptions());
      },
      follow() {
        if (controller.isOpen && instance.trigger) controller.open(anchorOf(instance.trigger));
      },
      get isOpen() {
        return controller.isOpen;
      },
      show(trigger) {
        if (trigger) instance.trigger = trigger;
        instance.intent.setOptions(intentOptions());
        instance.intent.focus();
      },
      hide() {
        instance.intent.hide();
      },
      destroy() {
        instance.intent.destroy();
        controller.destroy();
      },
    };
    element.addEventListener("pointerenter", () => instance.intent.enterTooltip(), { signal });
    element.addEventListener("pointerleave", () => instance.intent.leave(), { signal });
    return instance;
  },

  delegate: [
    {
      event: "pointerover",
      selector: TRIGGER,
      handle(trigger, e, runtime) {
        const event = e as PointerEvent;
        if (event.relatedTarget instanceof Node && trigger.contains(event.relatedTarget)) return;
        const instance = instanceFor(trigger, runtime);
        if (!instance) return;
        instance.trigger = trigger;
        instance.refresh();
        instance.intent.enter(event.pointerType);
      },
    },
    {
      event: "pointerout",
      selector: TRIGGER,
      handle(trigger, e, runtime) {
        const next = (e as PointerEvent).relatedTarget;
        if (next instanceof Node && trigger.contains(next)) return;
        const instance = instanceFor(trigger, runtime);
        if (!instance) return;
        instance.pointer = null;
        instance.intent.leave();
      },
    },
    {
      event: "pointermove",
      selector: TRIGGER,
      handle(trigger, e, runtime) {
        const event = e as PointerEvent;
        if (event.pointerType === "touch") return;
        const instance = instanceFor(trigger, runtime);
        if (!instance || !tooltipFor(trigger)?.hasAttribute(followCursor.attr)) return;
        instance.pointer = { x: event.clientX, y: event.clientY };
        instance.follow();
      },
    },
    {
      event: "pointerdown",
      selector: TRIGGER,
      handle(trigger, e, runtime) {
        if ((e as PointerEvent).pointerType !== "touch") return;
        const instance = instanceFor(trigger, runtime);
        if (!instance) return;
        instance.trigger = trigger;
        instance.intent.touchStart();
      },
    },
    ...(["pointerup", "pointercancel"] as const).map((event) => ({
      event,
      selector: TRIGGER,
      handle(trigger: Element, _e: Event, runtime: Runtime) {
        instanceFor(trigger, runtime)?.intent.touchEnd();
      },
    })),
    {
      event: "focusin",
      selector: TRIGGER,
      handle(trigger, _e, runtime) {
        if (!trigger.matches(":focus-visible")) return;
        const instance = instanceFor(trigger, runtime);
        if (!instance) return;
        instance.trigger = trigger;
        instance.intent.focus();
      },
    },
    {
      event: "focusout",
      selector: TRIGGER,
      handle(trigger, _e, runtime) {
        instanceFor(trigger, runtime)?.intent.blur();
      },
    },
  ],
});
