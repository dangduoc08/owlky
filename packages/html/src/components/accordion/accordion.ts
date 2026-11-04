import { accordionOptions, closeOtherDetails } from "@owlky/core";
import { defineComponent } from "../../runtime/define.js";
import type { ComponentInstance } from "../../runtime/types.js";

export interface AccordionInstance extends ComponentInstance {
  readonly isOpen: boolean;
  /**
   * Opens (`true`), closes (`false`) or flips the item. Returns `false` if it is disabled or
   * `ok:accordion:beforetoggle` was prevented.
   */
  toggle(open?: boolean): boolean;
}

const { disabled } = accordionOptions.options;

/**
 * Accordion — spec: specs/components/accordion.md
 *
 * Markup:  <details data-ok-accordion data-ok-variant="default" name="faq"?>
 *            <summary data-ok-accordion-summary>…<span data-ok-accordion-icon aria-hidden>…</span></summary>
 *            <div data-ok-accordion-details>…</div>
 *          </details>
 * Options: data-ok-disabled (+ aria-disabled / tabindex=-1 on the summary), name (one open at a time)
 * Events:  ok:accordion:beforetoggle (cancelable, detail.open), ok:accordion:toggle (detail.open)
 *
 * Works without the runtime (native <details>); the runtime adds the events, disabled and the
 * `name` fallback for browsers without exclusive <details>.
 */
export const accordion = defineComponent<AccordionInstance>({
  name: "accordion",
  selector: "[data-ok-accordion]",

  setup(element, { emit, signal }) {
    const details = element as HTMLDetailsElement;
    // Every open / close, whatever caused it (summary, API, find-in-page, an exclusive group).
    details.addEventListener(
      "toggle",
      () => {
        if (details.open) closeOtherDetails(details);
        emit("toggle", { open: details.open });
      },
      { signal },
    );
    const instance: AccordionInstance = {
      get isOpen() {
        return details.open;
      },
      toggle(open = !details.open) {
        if (open === details.open) return true;
        if (details.hasAttribute(disabled.attr)) return false;
        if (!emit("beforetoggle", { open }, { cancelable: true })) return false;
        details.open = open;
        return true;
      },
    };
    return instance;
  },

  delegate: [
    {
      event: "click",
      selector: "[data-ok-accordion-summary]",
      handle(summary, event, runtime) {
        if (!summary.matches("details[data-ok-accordion] > summary")) return;
        const root = summary.parentElement as HTMLElement;
        // Always mounted here: delegation already skips data-ok-runtime="off" subtrees.
        const instance = runtime.getOrCreate<AccordionInstance>(
          root,
          "accordion",
        ) as AccordionInstance;
        // The instance decides (events, disabled); the native toggle is replaced by it.
        event.preventDefault();
        instance.toggle();
      },
    },
  ],
});
