import {
  createWalktourController,
  createWalktourFlow,
  initialWalktourState,
  type WalktourApi,
  type WalktourEventData,
  type WalktourState,
  walktourOptions,
} from "@owlky/core";
import { defineComponent } from "../../runtime/define.js";
import type { ComponentInstance, EventSpec } from "../../runtime/types.js";

/** Events of this component (`ok:<name>:<event>` on the root). */
export interface WalktourEvents {
  /** Before the tour moves to another step. Call `preventDefault()` to stay. */
  beforechange: EventSpec<
    { index: number; previousIndex: number; action: string; origin: string | null },
    true
  >;
  /** After the state changed: the new state plus `previousIndex`. */
  change: EventSpec<WalktourState & { previousIndex: number }>;
  /** Each tour event (`tour:start`, `step:before`, `step:after`, `tour:end`…), with the tour's data. */
  event: EventSpec<WalktourEventData>;
  /**
   * A step is about to show (react-joyride's `before` hook). Call `waitUntil(promise)` from the
   * listener to make the tour wait for it (up to `data-ok-before-timeout`).
   */
  beforestep: EventSpec<WalktourEventData & { waitUntil(promise: PromiseLike<unknown>): void }>;
}

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
 *          ok:walktour:event (detail: { type, action, origin, index, status, lifecycle, size }),
 *          ok:walktour:beforestep (the step's data + waitUntil(promise): the `before` hook).
 */
export const walktour = defineComponent<WalktourInstance, WalktourEvents>({
  name: "walktour",
  selector: "[data-ok-walktour]",

  setup(element, { emit }) {
    let state: WalktourState = initialWalktourState(readIndex(element, "data-ok-step-index"));
    const controller = createWalktourController(element, {
      onIntent: (intent, origin) => dispatch(intent, origin),
    });

    const flow = createWalktourFlow({
      state: () => state,
      context: () => controller.context(),
      allow: (next, previous, { action, origin }) =>
        emit(
          "beforechange",
          { index: next.index, previousIndex: previous.index, action, origin },
          { cancelable: true },
        ),
      commit(next, previous) {
        state = next;
        controller.render(state);
        emit("change", { ...state, previousIndex: previous.index });
      },
      wait(next) {
        state = next;
        controller.render(state);
      },
      emit: (event) => {
        emit("event", event);
      },
      // The `before` hook: listeners hand the tour a promise to wait for.
      before(data) {
        const pending: PromiseLike<unknown>[] = [];
        emit("beforestep", {
          ...data,
          waitUntil(promise) {
            pending.push(promise);
          },
        });
        return pending.length ? Promise.all(pending) : undefined;
      },
    });
    const dispatch = flow.dispatch;

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
        flow.cancel();
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
