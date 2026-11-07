import { checkboxOptions, selectAllState } from "@owlky/core";
import { defineComponent } from "../../runtime/define.js";

const MIXED = checkboxOptions.options.indeterminate.attr;
const INPUT = ":scope > input[type=checkbox]";

const rootOf = (from: Element) => from.getRootNode() as Document | ShadowRoot;
const inputOf = (root: Element) => root.querySelector<HTMLInputElement>(INPUT);
const tokens = (value: string | null) => (value ?? "").split(/\s+/).filter(Boolean);

/** The checkboxes a parent lists in `aria-controls` (ids resolved in its own root). */
function childrenOf(parent: HTMLInputElement): HTMLInputElement[] {
  return tokens(parent.getAttribute("aria-controls"))
    .map((id) => rootOf(parent).getElementById(id))
    .filter(
      (el): el is HTMLInputElement =>
        el instanceof HTMLInputElement && el.type === "checkbox" && el !== parent,
    );
}

/** Parents whose `aria-controls` lists this checkbox. */
function parentsOf(input: HTMLInputElement): HTMLInputElement[] {
  if (input.id === "") return [];
  return [
    ...rootOf(input).querySelectorAll<HTMLInputElement>(
      "[data-ok-checkbox] > input[aria-controls]",
    ),
  ].filter(
    (parent) => parent !== input && tokens(parent.getAttribute("aria-controls")).includes(input.id),
  );
}

/** Marks a checkbox mixed or not (attribute for the icon, property for assistive technology). */
function setMixed(input: HTMLInputElement, mixed: boolean) {
  input.indeterminate = mixed;
  input.closest("[data-ok-checkbox]")?.toggleAttribute(MIXED, mixed);
}

/** A parent follows its children: all checked, none, or mixed. Then its own parents follow. */
function syncParents(from: HTMLInputElement, seen = new Set<HTMLInputElement>()) {
  for (const parent of parentsOf(from)) {
    if (seen.has(parent)) continue;
    seen.add(parent);
    const children = childrenOf(parent);
    const state = selectAllState(children.filter((c) => c.checked).length, children.length);
    parent.checked = state.checked;
    setMixed(parent, state.indeterminate);
    syncParents(parent, seen);
  }
}

/**
 * Checkbox — spec: specs/components/checkbox.md
 *
 * Markup:  <span data-ok-checkbox data-ok-color="primary" data-ok-size="medium">
 *            <input type="checkbox" data-ok-checkbox-input aria-label="…">
 *            <span data-ok-checkbox-icon="unchecked" aria-hidden="true"><svg …></span>
 *            <span data-ok-checkbox-icon="checked" aria-hidden="true"><svg …></span>
 *            <span data-ok-checkbox-icon="indeterminate" aria-hidden="true"><svg …></span>
 *          </span>
 * The runtime keeps `data-ok-indeterminate` and the input's `indeterminate` in step (a user
 * click clears both), and makes a checkbox with `aria-controls="<ids>"` a parent: it checks or
 * clears every listed checkbox and shows mixed when only some are checked. Events: native
 * `change` (only for the checkbox the user changed).
 */
export const checkbox = defineComponent({
  name: "checkbox",
  selector: "[data-ok-checkbox]",

  setup(element) {
    const input = inputOf(element);
    if (!input) return {};
    const apply = () => {
      if (element.hasAttribute(MIXED)) input.indeterminate = true;
      else if (input.indeterminate) input.indeterminate = false;
    };
    // Mixed set by other code (e.g. a table's select-all) stays: only the attribute is mirrored.
    if (element.hasAttribute(MIXED)) input.indeterminate = true;
    if (input.hasAttribute("aria-controls")) {
      const [child] = childrenOf(input);
      if (child) syncParents(child);
    }
    const observer = new MutationObserver(apply);
    observer.observe(element, { attributes: true, attributeFilter: [MIXED] });
    return { destroy: () => observer.disconnect() };
  },

  delegate: [
    {
      event: "change",
      selector: "[data-ok-checkbox] > input[type=checkbox]",
      handle(target) {
        const input = target as HTMLInputElement;
        // The user's click resolved the mixed state.
        setMixed(input, false);
        const children = childrenOf(input);
        for (const child of children) {
          child.checked = input.checked;
          setMixed(child, false);
        }
        syncParents(input);
        for (const child of children) syncParents(child);
      },
    },
  ],
});
