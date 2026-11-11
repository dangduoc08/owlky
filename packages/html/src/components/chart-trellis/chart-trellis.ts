import { defineComponent } from "../../runtime/define.js";
import type { ComponentInstance, EventSpec } from "../../runtime/types.js";

/** Events of this component (`ok:<name>:<event>` on the root). */
export interface ChartTrellisEvents {
  /**
   * Before a header shows its panel alone (`index`), or a header or **All panels** shows every
   * panel again (`index` is `null`). Call `preventDefault()` to refuse.
   */
  promote: EventSpec<{ index: number | null }, true>;
}

export interface ChartTrellisInstance extends ComponentInstance {
  /** The index of the panel shown alone, or `null`. */
  readonly promoted: number | null;
  /** Shows one panel alone across the grid (no event). */
  promotePanel(index: number): void;
  /** Shows every panel again (no event). */
  restorePanels(): void;
}

/**
 * ChartTrellis — spec: specs/components/chart.md (ADR-0060)
 *
 * Markup:  <div data-ok-chart-trellis data-ok-promote role="group" aria-label="…">
 *            <button type="button" data-ok-chart-trellis-back hidden>All panels</button>
 *            <div data-ok-chart-trellis-panel>
 *              <button type="button" data-ok-chart-trellis-header aria-expanded="false">North</button>
 *              <figure data-ok-chart …>…</figure>
 *            </div> …
 *          </div>
 * Behavior: with `data-ok-promote`, a header shows its panel alone (the others `hidden`), pressed
 *          again or **All panels** shows every panel. The charts are ordinary charts.
 */
export const chartTrellis = defineComponent<ChartTrellisInstance, ChartTrellisEvents>({
  name: "chart-trellis",
  selector: "[data-ok-chart-trellis]",

  setup(element, { emit, signal }) {
    const panels = () =>
      [...element.children].filter((child) => child.hasAttribute("data-ok-chart-trellis-panel"));
    const back = () =>
      element.querySelector<HTMLButtonElement>(":scope > [data-ok-chart-trellis-back]");
    let promoted: number | null = null;

    const show = (index: number | null) => {
      const list = panels();
      promoted = index !== null && index >= 0 && index < list.length ? index : null;
      list.forEach((panel, i) => {
        (panel as HTMLElement).hidden = promoted !== null && promoted !== i;
        if (promoted === i) panel.setAttribute("data-ok-promoted", "");
        else panel.removeAttribute("data-ok-promoted");
        panel
          .querySelector(":scope > button[data-ok-chart-trellis-header]")
          ?.setAttribute("aria-expanded", String(promoted === i));
      });
      const button = back();
      if (button) button.hidden = promoted === null;
    };
    const request = (index: number | null) => {
      if (!element.hasAttribute("data-ok-promote")) return;
      if (!emit("promote", { index }, { cancelable: true })) return;
      show(index);
      // The header that stays (or the first one) keeps the focus when the back button hides.
      if (index === null)
        panels()[0]?.querySelector<HTMLElement>(":scope > [data-ok-chart-trellis-header]")?.focus();
    };

    element.addEventListener(
      "click",
      (event) => {
        const target = event.target as Element;
        const header = target.closest?.("button[data-ok-chart-trellis-header]");
        const panel = header?.parentElement;
        if (header && panel?.parentElement === element) {
          const index = panels().indexOf(panel);
          request(promoted === index ? null : index);
          return;
        }
        const button = target.closest?.("[data-ok-chart-trellis-back]");
        if (button && button.parentElement === element) request(null);
      },
      { signal },
    );
    // Markup may arrive with a promoted panel.
    const initial = panels().findIndex((panel) => panel.hasAttribute("data-ok-promoted"));
    if (initial >= 0) show(initial);

    return {
      get promoted() {
        return promoted;
      },
      promotePanel(index) {
        show(index);
      },
      restorePanels() {
        show(null);
      },
      destroy() {},
    };
  },
});
