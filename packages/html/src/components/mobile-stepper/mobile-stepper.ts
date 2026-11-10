import {
  clampStep,
  mobileStepperOptions,
  mobileStepperProgress,
  mobileStepperText,
  readNumber,
} from "@owlky/core";
import { defineComponent } from "../../runtime/define.js";
import type { ComponentInstance, EventSpec, Runtime } from "../../runtime/types.js";

/** Events of this component (`ok:<name>:<event>` on the root). */
export interface MobileStepperEvents {
  /** Before a trigger moves to another step. Call `preventDefault()` to stay. */
  change: EventSpec<{ activeStep: number; previous: number }, true>;
}

export interface MobileStepperInstance extends ComponentInstance {
  /** The active step (0-based). */
  readonly activeStep: number;
  /** Moves to `step` without emitting events (clamped to the steps). */
  setActiveStep(step: number): void;
  /** Moves as the user would (Next / Back). Returns `false` if prevented or unchanged. */
  go(step: number): boolean;
}

const { activeStep, steps } = mobileStepperOptions.options;
const TRIGGERS = {
  next: "data-ok-mobile-stepper-next",
  back: "data-ok-mobile-stepper-back",
} as const;
const LABEL = "Step {step} of {steps}";

/**
 * Mobile stepper — spec: specs/components/stepper.md
 *
 * Markup:  <div data-ok-mobile-stepper data-ok-variant="dots" data-ok-steps="3" data-ok-active-step="0">
 *            <button data-ok-button data-ok-mobile-stepper-back>Back</button>
 *            <span data-ok-mobile-stepper-dots role="img" aria-label="Step 1 of 3">…dots…</span>
 *            <button data-ok-button data-ok-mobile-stepper-next>Next</button>
 *          </div>
 * Behavior: keeps the text ("2 / 3"), the dots or the progress bar in step with
 *          `data-ok-active-step`; Back is disabled on the first step and Next on the last. Triggers
 *          inside the stepper act on it; outside, they name it (`data-ok-mobile-stepper-next="<id>"`).
 *          `data-ok-label-step` sets the accessible name template (default "Step {step} of {steps}");
 *          elements with `data-ok-mobile-stepper-panel="<id>"` show the one at the active step.
 * Events:  ok:mobile-stepper:change (cancelable, detail `{ activeStep, previous }`).
 */
export const mobileStepper = defineComponent<MobileStepperInstance, MobileStepperEvents>({
  name: "mobile-stepper",
  selector: "[data-ok-mobile-stepper]",

  setup(element, { emit }) {
    const count = () => Math.max(1, Math.floor(readNumber(element, steps) as number) || 1);
    const current = () => clampStep(readNumber(element, activeStep), count() - 1);
    const triggers = (attribute: string) => {
      const inside = [...element.querySelectorAll<HTMLElement>(`[${attribute}=""]`)];
      const root = element.getRootNode() as Document | ShadowRoot;
      const outside = element.id
        ? [...root.querySelectorAll<HTMLElement>(`[${attribute}="${CSS.escape(element.id)}"]`)]
        : [];
      return [...inside, ...outside];
    };

    const apply = (step: number) => {
      const total = count();
      element.setAttribute(activeStep.attr, String(step));
      const label = (element.getAttribute("data-ok-label-step") || LABEL)
        .replace("{step}", String(step + 1))
        .replace("{steps}", String(total));
      const text = element.querySelector("[data-ok-mobile-stepper-text]");
      if (text) text.textContent = mobileStepperText(step, total);
      const dots = element.querySelector("[data-ok-mobile-stepper-dots]");
      if (dots) {
        dots.setAttribute("aria-label", label);
        while (dots.children.length < total) {
          const dot = document.createElement("span");
          dot.setAttribute("data-ok-mobile-stepper-dot", "");
          dots.append(dot);
        }
        while (dots.children.length > total) dots.lastElementChild?.remove();
        [...dots.children].forEach((dot, index) => {
          dot.toggleAttribute("data-ok-active", index === step);
        });
      }
      const progress = element.querySelector("[data-ok-mobile-stepper-progress]");
      if (progress) {
        progress.setAttribute("aria-valuenow", String(mobileStepperProgress(step, total)));
        progress.setAttribute("aria-label", label);
      }
      const root = element.getRootNode() as Document | ShadowRoot;
      if (element.id) {
        const panels = root.querySelectorAll<HTMLElement>(
          `[data-ok-mobile-stepper-panel="${CSS.escape(element.id)}"]`,
        );
        panels.forEach((panel, index) => {
          panel.hidden = index !== step;
        });
      }
      for (const back of triggers(TRIGGERS.back)) (back as HTMLButtonElement).disabled = step === 0;
      for (const next of triggers(TRIGGERS.next))
        (next as HTMLButtonElement).disabled = step === total - 1;
    };

    const instance: MobileStepperInstance = {
      get activeStep() {
        return current();
      },
      setActiveStep(step) {
        apply(clampStep(step, count() - 1));
      },
      go(step) {
        const previous = current();
        const next = clampStep(step, count() - 1);
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
        const id = trigger.getAttribute(attribute) as string;
        const root = trigger.getRootNode() as Document | ShadowRoot;
        const target =
          id === "" ? trigger.closest("[data-ok-mobile-stepper]") : root.getElementById(id);
        if (!target?.hasAttribute("data-ok-mobile-stepper")) return;
        const instance = runtime.getOrCreate<MobileStepperInstance>(target, "mobile-stepper");
        if (instance) instance.go(instance.activeStep + (action === "next" ? 1 : -1));
      },
    }),
  ),
});
