import {
  createWalktourController,
  initialWalktourState,
  type WalktourAction,
  type WalktourApi,
  type WalktourOrigin,
  type WalktourState,
  walktourEvents,
  walktourOptions,
  walktourTransition,
} from "@owlky/core";
import { defineComponent } from "../../runtime/define.js";
import type { ComponentInstance } from "../../runtime/types.js";

/** The walktour instance (`runtime.get(root, "walktour")`). */
export interface WalktourInstance extends ComponentInstance, WalktourApi {}

const START = "data-ok-walktour-start";
const RUN = "data-ok-run";
/** Root attributes the runtime watches: `data-ok-run` and every option. */
const OBSERVED = [
  RUN,
  ...Object.values(walktourOptions.options)
    .map((spec) => spec.attr)
    .filter((attr) => attr !== RUN && attr !== "data-ok-step-index"),
];

const byId = (from: Element, id: string): Element | null =>
  (from.getRootNode() as Document | ShadowRoot).getElementById(id);

/** A step index from an attribute: a non-negative integer, else 0. */
function readIndex(element: Element, attr: string): number {
  const value = Number(element.getAttribute(attr) ?? 0);
  return Number.isInteger(value) && value >= 0 ? value : 0;
}

/**
 * Walktour — spec: specs/components/walktour.md (ADR-0039)
 *
 * Markup:  <div id="tour" data-ok-walktour data-ok-run data-ok-continuous …options>
 *            <div data-ok-backdrop data-ok-invisible data-ok-walktour-overlay popover="manual"
 *                 aria-hidden="true"><svg data-ok-walktour-spotlight …><path data-ok-walktour-mask
 *                 fill-rule="evenodd"/><path data-ok-walktour-hole/></svg></div>
 *            <button type="button" data-ok-walktour-beacon aria-label="Open the dialog" hidden>…
 *            <div popover="manual" data-ok-popover data-ok-arrow data-ok-walktour-step
 *                 data-ok-target="#card" data-ok-placement="bottom" role="dialog" …>
 *              …header (title, close), content, LinearProgress, footer (skip, back, primary)…
 *            </div> …
 *            <span data-ok-walktour-live aria-live="polite" data-ok-format="Step {current} of {total}">
 *          </div>
 * Triggers: [data-ok-walktour-start="<id>"] (+ data-ok-index) starts the tour over.
 * State:   data-ok-run (present: running; removing it pauses), data-ok-step-index (first step).
 * Events:  ok:walktour:beforechange (cancelable, detail { index, previousIndex, action, origin }),
 *          ok:walktour:change (detail: the state + previousIndex),
 *          ok:walktour:event (detail: { type, action, origin, index, status, lifecycle, size }).
 */
export const walktour = defineComponent<WalktourInstance>({
  name: "walktour",
  selector: "[data-ok-walktour]",

  setup(element, { emit }) {
    let state: WalktourState = initialWalktourState(readIndex(element, "data-ok-step-index"));
    const controller = createWalktourController(element, {
      onIntent: (intent, origin) => dispatch(intent, origin),
    });

    function dispatch(action: WalktourAction, origin: WalktourOrigin = "api", index?: number) {
      const context = controller.context();
      const { state: next, notFound } = walktourTransition(state, action, context, {
        index,
        origin,
      });
      if (next === state) return;
      const previous = state;
      if (
        next.index !== previous.index &&
        next.status === "running" &&
        !emit(
          "beforechange",
          { index: next.index, previousIndex: previous.index, action, origin },
          { cancelable: true },
        )
      )
        return;
      state = next;
      controller.render(state);
      emit("change", { ...state, previousIndex: previous.index });
      for (const event of walktourEvents(previous, next, context.size, notFound))
        emit("event", event);
    }

    // `data-ok-run` runs and pauses the tour, like React's `run`; other options show at once.
    const observer = new MutationObserver((records) => {
      if (records.some((record) => record.attributeName === RUN))
        dispatch(element.hasAttribute(RUN) ? "start" : "stop");
      else controller.render(state);
    });
    observer.observe(element, { attributes: true, attributeFilter: OBSERVED });
    if (element.hasAttribute(RUN)) dispatch("start");

    return {
      get state() {
        return state;
      },
      start: (index) => dispatch("start", "api", index),
      stop: () => dispatch("stop"),
      reset(restart) {
        dispatch("reset");
        if (restart) dispatch("start", "api", 0);
      },
      next: () => dispatch("next"),
      prev: () => dispatch("prev"),
      go: (index) => dispatch("go", "api", index),
      close: () => dispatch("close"),
      skip: () => dispatch("skip"),
      open: () => dispatch("open"),
      destroy() {
        observer.disconnect();
        controller.destroy();
      },
    };
  },

  delegate: [
    {
      event: "click",
      selector: `[${START}]`,
      handle(trigger, event, runtime) {
        const id = trigger.getAttribute(START) as string;
        const instance = runtime.getOrCreate<WalktourInstance>(byId(trigger, id), "walktour");
        if (!instance) {
          console.warn(`[owlky] No walktour with id "${id}" for this trigger.`, trigger);
          return;
        }
        event.preventDefault();
        instance.reset();
        instance.start(readIndex(trigger, "data-ok-index"));
      },
    },
  ],
});
