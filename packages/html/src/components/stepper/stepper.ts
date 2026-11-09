import { clampStep, readNumber, stepOptions, stepperOptions, stepState } from "@owlky/core";
import { defineComponent } from "../../runtime/define.js";
import type { ComponentInstance, Runtime } from "../../runtime/types.js";

export interface StepperInstance extends ComponentInstance {
  /** Index of the current step; equal to the step count once every step is completed. */
  readonly activeStep: number;
  /** Moves to `step` without emitting events (clamped to 0 … step count). */
  setActiveStep(step: number): void;
  /** Moves as the user would (Next / Back / Reset). Returns `false` if prevented or unchanged. */
  go(step: number): boolean;
}

const { activeStep } = stepperOptions.options;
const { active, completed, disabled } = stepOptions.options;
const TRIGGERS = {
  next: "data-ok-stepper-next",
  back: "data-ok-stepper-back",
  reset: "data-ok-stepper-reset",
} as const;

/**
 * Stepper — spec: specs/components/stepper.md
 *
 * Markup:  <ol id="s" data-ok-stepper data-ok-active-step="0">
 *            <li data-ok-step>…<span data-ok-step-label>…</span></li> …
 *          </ol>
 *          <div data-ok-stepper-panel="s">Step 1</div> … <div data-ok-stepper-panel="s" hidden>Done</div>
 *          <button data-ok-stepper-back="s">Back</button> <button data-ok-stepper-next="s">Next</button>
 * Behavior: the runtime derives every step's state from `data-ok-active-step` (earlier steps
 *          completed, later ones not reached), shows the panel at that index (or the one whose
 *          `data-ok-stepper-panel-step` names it), and disables Back
 *          triggers on the first step. Triggers: data-ok-stepper-next / -back / -reset="<id>" (several
 *          space-separated ids move steppers that show the same steps together).
 * Events:  ok:stepper:change (cancelable, detail `{ activeStep, previous }`).
 */
export const stepper = defineComponent<StepperInstance>({
  name: "stepper",
  selector: "[data-ok-stepper]",

  setup(element, { emit }) {
    const root = element.getRootNode() as Document | ShadowRoot;
    const steps = () =>
      [...element.children].filter((child): child is HTMLElement =>
        child.matches("[data-ok-step]"),
      );
    const current = () => clampStep(readNumber(element, activeStep), steps().length);
    const linked = (selector: string) =>
      element.id
        ? [...root.querySelectorAll<HTMLElement>(`[${selector}~="${CSS.escape(element.id)}"]`)]
        : [];

    const apply = (step: number) => {
      element.setAttribute(activeStep.attr, String(step));
      steps().forEach((item, index) => {
        const state = stepState(index, step);
        item.toggleAttribute(active.attr, state.active);
        item.toggleAttribute(completed.attr, state.completed);
        item.toggleAttribute(disabled.attr, state.disabled);
        if (state.active) item.setAttribute("aria-current", "step");
        else item.removeAttribute("aria-current");
        // Vertical steppers: the content is a Collapse, closed on the other steps.
        const content = item.querySelector<HTMLElement>(":scope > [data-ok-step-content]");
        if (content) content.hidden = !state.active;
      });
      linked("data-ok-stepper-panel").forEach((panel, index) => {
        const own = Number(panel.getAttribute("data-ok-stepper-panel-step") ?? index);
        panel.hidden = own !== step;
      });
      for (const back of linked(TRIGGERS.back)) (back as HTMLButtonElement).disabled = step === 0;
    };

    const instance: StepperInstance = {
      get activeStep() {
        return current();
      },
      setActiveStep(step) {
        apply(clampStep(step, steps().length));
      },
      go(step) {
        const previous = current();
        const next = clampStep(step, steps().length);
        if (next === previous) return false;
        if (!emit("change", { activeStep: next, previous }, { cancelable: true })) return false;
        apply(next);
        return true;
      },
    };
    apply(current());
    return instance;
  },

  delegate: (Object.entries(TRIGGERS) as [keyof typeof TRIGGERS, string][]).map(
    ([action, attribute]) => ({
      event: "click" as const,
      selector: `[${attribute}]`,
      handle(trigger: Element, _event: Event, runtime: Runtime) {
        const root = trigger.getRootNode() as Document | ShadowRoot;
        // One trigger may move several steppers that show the same steps (space-separated ids).
        for (const id of (trigger.getAttribute(attribute) as string).split(/\s+/)) {
          const target = id ? root.getElementById(id) : null;
          if (!target?.hasAttribute("data-ok-stepper")) continue;
          const instance = runtime.getOrCreate<StepperInstance>(target, "stepper");
          if (!instance) continue;
          const step = instance.activeStep;
          instance.go(action === "next" ? step + 1 : action === "back" ? step - 1 : 0);
        }
      },
    }),
  ),
});
