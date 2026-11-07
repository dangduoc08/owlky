import { readNumber, textFieldOptions } from "@owlky/core";
import { defineComponent } from "../../runtime/define.js";
import { syncCustomProperties } from "../../runtime/style.js";

const { minRows, maxRows, error } = textFieldOptions.options;
const REVEAL = "data-ok-text-field-reveal";

/**
 * Text field — spec: specs/components/text-field.md
 *
 * Markup:  <div data-ok-text-field data-ok-variant="outlined" data-ok-size="medium" data-ok-color="default" data-ok-margin="none">
 *            <label data-ok-text-field-label for="name">Name</label>
 *            <div data-ok-text-field-control>
 *              <input id="name" data-ok-text-field-input placeholder=" ">
 *              <fieldset data-ok-text-field-outline aria-hidden="true"><legend><span>Name</span></legend></fieldset>
 *            </div>
 *          </div>
 * CSS only, except: `data-ok-min-rows` / `data-ok-max-rows` become private custom properties
 * (CSSOM) for a growing textarea, `data-ok-error` sets the input's `aria-invalid`, and a button
 * with `data-ok-text-field-reveal` inside the field shows or hides a password (`aria-pressed`).
 */
export const textField = defineComponent({
  name: "text-field",
  selector: "[data-ok-text-field]",

  setup(element) {
    let written: string[] = [];
    let invalidSet = false;
    const input = () => element.querySelector("[data-ok-text-field-input]");
    const draw = () => {
      // `data-ok-error` also marks the input invalid (only an aria-invalid it set itself is removed).
      const field = input();
      if (element.hasAttribute(error.attr)) {
        if (field && field.getAttribute("aria-invalid") !== "true") {
          field.setAttribute("aria-invalid", "true");
          invalidSet = true;
        }
      } else if (invalidSet) {
        field?.removeAttribute("aria-invalid");
        invalidSet = false;
      }
      const min = readNumber(element, minRows);
      const max = readNumber(element, maxRows);
      written = syncCustomProperties(
        element,
        {
          ...(min !== undefined ? { "--_ok-min-rows": String(min) } : {}),
          ...(max !== undefined ? { "--_ok-max-rows": String(max) } : {}),
        },
        written,
      );
    };
    draw();
    const observer = new MutationObserver(draw);
    observer.observe(element, {
      attributes: true,
      attributeFilter: [minRows.attr, maxRows.attr, error.attr],
    });
    return {
      destroy() {
        observer.disconnect();
        syncCustomProperties(element, {}, written);
      },
    };
  },

  delegate: [
    {
      event: "click",
      selector: `[data-ok-text-field] button[${REVEAL}]`,
      handle(button) {
        const input = button
          .closest("[data-ok-text-field]")
          ?.querySelector<HTMLInputElement>("input[data-ok-text-field-input]");
        if (!input) return;
        const reveal = input.type === "password";
        input.type = reveal ? "text" : "password";
        button.setAttribute("aria-pressed", String(reveal));
      },
    },
  ],
});
