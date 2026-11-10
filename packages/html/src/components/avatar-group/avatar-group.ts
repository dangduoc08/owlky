import { avatarGroupOptions, avatarGroupStyle } from "@owlky/core";
import { defineComponent } from "../../runtime/define.js";
import { syncCustomProperties } from "../../runtime/style.js";

const { spacing } = avatarGroupOptions.options;

/**
 * Avatar group — spec: specs/components/avatar.md (markup in `avatar/examples`).
 *
 * Markup:  <div data-ok-avatar-group data-ok-spacing="12">…avatars…</div>
 * CSS only for `medium` / `small`; a number of px becomes `--_ok-overlap` (CSSOM, observed).
 */
export const avatarGroup = defineComponent({
  name: "avatar-group",
  selector: "[data-ok-avatar-group]",

  setup(element) {
    let written: string[] = [];
    const draw = () => {
      written = syncCustomProperties(
        element,
        avatarGroupStyle(element.getAttribute(spacing.attr)),
        written,
      );
    };
    draw();
    const observer = new MutationObserver(draw);
    observer.observe(element, { attributes: true, attributeFilter: [spacing.attr] });
    return {
      destroy() {
        observer.disconnect();
        syncCustomProperties(element, {}, written);
      },
    };
  },
});
