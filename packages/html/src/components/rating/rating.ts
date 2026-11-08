import { nextRating, ratingOptions } from "@owlky/core";
import { defineComponent } from "../../runtime/define.js";
import type { ComponentInstance } from "../../runtime/types.js";

export interface RatingInstance extends ComponentInstance {
  /** The checked value, or `null`. */
  readonly value: number | null;
  /** Checks `value` (`null`: none) without emitting events. */
  setValue(value: number | null): void;
}

const { highlightSelectedOnly, readOnly } = ratingOptions.options;

/**
 * Rating — spec: specs/components/rating.md
 *
 * Markup:  <span data-ok-rating data-ok-size="medium" data-ok-color="warning">
 *            <span data-ok-rating-item>
 *              <label data-ok-rating-icon data-ok-value="1" for="r-1">…svg…<span data-ok-rating-label-text>1 Star</span></label>
 *              <input type="radio" data-ok-rating-input id="r-1" name="r" value="1">
 *            </span> …
 *            <label data-ok-rating-empty for="r-empty">Empty</label><input type="radio" data-ok-rating-input id="r-empty" name="r" value="">
 *          </span>
 * Behavior: keeps `data-ok-filled` on the icons in step with the checked radio and the pointer
 *          (`data-ok-hover`); a pointer click on the checked value clears it. Read-only ratings
 *          (`data-ok-read-only`) are static markup.
 * Events:  ok:rating:change (cancelable, detail `{ value, previous }`),
 *          ok:rating:active (detail `{ value }`: the value under the pointer, or null).
 */
export const rating = defineComponent<RatingInstance>({
  name: "rating",
  selector: "[data-ok-rating]",

  setup(element, { emit, signal }) {
    const inputs = () => [...element.querySelectorAll<HTMLInputElement>("[data-ok-rating-input]")];
    const icons = () => [...element.querySelectorAll<HTMLElement>("[data-ok-rating-icon]")];
    const parse = (text: string | null | undefined) => {
      const value = text === "" || text == null ? Number.NaN : Number(text);
      return Number.isFinite(value) ? value : null;
    };
    const checked = () => parse(inputs().find((input) => input.checked)?.value);
    let value = checked();
    let hover: number | null = null;

    const paint = () => {
      const shown = hover ?? value;
      const only = element.hasAttribute(highlightSelectedOnly.attr);
      for (const icon of icons()) {
        const own = parse(icon.getAttribute("data-ok-value"));
        const on = shown !== null && own !== null && (only ? own === shown : own <= shown + 1e-9);
        icon.toggleAttribute("data-ok-filled", on);
        icon.toggleAttribute("data-ok-hover", hover !== null && own === hover);
      }
    };

    const instance: RatingInstance = {
      get value() {
        return value;
      },
      setValue(next) {
        value = next;
        for (const input of inputs()) input.checked = parse(input.value) === next;
        paint();
      },
    };

    const request = (next: number | null) => {
      const previous = value;
      if (next === previous) return;
      if (!emit("change", { value: next, previous }, { cancelable: true })) {
        instance.setValue(previous);
        return;
      }
      instance.setValue(next);
    };

    if (!element.hasAttribute(readOnly.attr)) {
      // WebKit forwards a label click to the radio with `detail` 0, like Space: track the press.
      let pressed = false;
      element.addEventListener("pointerdown", () => (pressed = true), { signal });
      element.addEventListener("keydown", () => (pressed = false), { signal });
      element.addEventListener(
        "change",
        (event) => {
          const input = event.target as HTMLInputElement;
          if (input.matches("[data-ok-rating-input]")) request(parse(input.value));
        },
        { signal },
      );
      element.addEventListener(
        "click",
        (event) => {
          const input = event.target as HTMLInputElement;
          // A pointer click on the value that was already checked clears it (not Space).
          // The label's own click comes first: only the radio's click consumes the press.
          if (!input.matches?.("[data-ok-rating-input]")) return;
          const pointer = (event as MouseEvent).detail > 0 || pressed;
          pressed = false;
          if (!pointer) return;
          const clicked = parse(input.value);
          if (clicked !== null && clicked === value) request(nextRating(value, clicked));
        },
        { signal },
      );
      const active = (next: number | null) => {
        if (next === hover) return;
        hover = next;
        paint();
        emit("active", { value: next });
      };
      element.addEventListener(
        "pointermove",
        (event) => {
          const icon = (event.target as Element).closest?.("[data-ok-rating-icon]");
          active(icon ? parse(icon.getAttribute("data-ok-value")) : null);
        },
        { signal },
      );
      element.addEventListener("pointerleave", () => active(null), { signal });
      paint();
    }
    return instance;
  },
});
