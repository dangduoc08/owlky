import { defineComponent } from "../../runtime/define.js";
import { syncCustomProperties } from "../../runtime/style.js";
import { SWATCH, syncSwatch } from "../../runtime/swatch.js";

/**
 * Radio — spec: specs/components/radio.md
 *
 * Markup:  <span data-ok-radio data-ok-color="primary" data-ok-size="medium" data-ok-swatch="#FF9800">
 *            <input type="radio" data-ok-radio-input name="color" value="#FF9800" aria-label="Orange">
 *            <span data-ok-radio-swatch aria-hidden="true"><svg …></span>
 *          </span>
 * Radios are CSS only; this runtime only paints color swatches: `data-ok-swatch` becomes
 * `--_ok-swatch` and `--_ok-swatch-mark` (CSSOM), again when it changes.
 */
export const radio = defineComponent({
  name: "radio",
  selector: `[data-ok-radio][${SWATCH}]`,

  setup(element) {
    let written = syncSwatch(element, []);
    const observer = new MutationObserver(() => {
      written = syncSwatch(element, written);
    });
    observer.observe(element, { attributes: true, attributeFilter: [SWATCH] });
    return {
      destroy() {
        observer.disconnect();
        syncCustomProperties(element, {}, written);
      },
    };
  },
});
