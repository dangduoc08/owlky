import { autocompleteOptions } from "@owlky/core";
import { Autocomplete, type AutocompleteOption, Checkbox } from "@owlky/react";
import type { ReactGroup } from "../../helpers/groups.js";
import type { GroupFiles } from "../shared/snippets.js";

export const FRUITS = [
  "Apple",
  "Apricot",
  "Banana",
  "Blueberry",
  "Cherry",
  "Grape",
  "Kiwi",
  "Lemon",
  "Mango",
  "Orange",
  "Peach",
  "Pear",
];

/** An option with a checkbox that mirrors its selection (decorative: the option is selected). */
export function checkboxOption(option: AutocompleteOption, { selected }: { selected: boolean }) {
  return (
    <>
      <Checkbox size="small" checked={selected} readOnly tabIndex={-1} aria-hidden="true" />
      {option.label}
    </>
  );
}

/**
 * Story groups — the same examples as `packages/html/src/components/autocomplete/examples/`. The
 * `div.sb-autocomplete` wrappers are story-only demo markup (a column width).
 */
export const autocompleteStories: Record<string, ReactGroup[]> = {
  playground: [
    {
      title: "Combo box",
      content: (
        <div className="sb-autocomplete">
          <Autocomplete id="ac-combo" label="Combo box" options={FRUITS} />
        </div>
      ),
    },
    {
      title: "Controllable states",
      content: (
        <div className="sb-autocomplete">
          <Autocomplete
            id="ac-controllable"
            label="Controllable"
            options={["Option 1", "Option 2"]}
            defaultValue="Option 1"
          />
        </div>
      ),
    },
    {
      title: "Free solo",
      content: (
        <div className="sb-autocomplete">
          <Autocomplete id="ac-free" label="Free solo" freeSolo options={FRUITS} />
          <Autocomplete
            id="ac-search"
            label="Search input"
            freeSolo
            disableClearable
            options={FRUITS}
          />
        </div>
      ),
    },
    {
      title: "Multiple values",
      content: (
        <div className="sb-autocomplete">
          <Autocomplete
            id="ac-multiple"
            label="Multiple select"
            placeholder="Favorites"
            multiple
            limitTags={3}
            options={FRUITS}
            defaultValue={FRUITS.slice(0, 5)}
          />
        </div>
      ),
    },
    {
      title: "Checkboxes",
      content: (
        <div className="sb-autocomplete">
          <Autocomplete
            id="ac-checkboxes"
            label="Checkboxes"
            placeholder="Favorites"
            multiple
            disableCloseOnSelect
            options={FRUITS}
            defaultValue={[FRUITS[0] as string]}
            renderOption={checkboxOption}
          />
        </div>
      ),
    },
    {
      title: "Sizes",
      content: (
        <div className="sb-autocomplete">
          <Autocomplete id="ac-medium" label="Size medium" options={FRUITS} defaultValue="Mango" />
          <Autocomplete
            id="ac-small"
            label="Size small"
            size="small"
            multiple
            placeholder="Favorites"
            options={FRUITS}
            defaultValue={["Mango"]}
          />
        </div>
      ),
    },
  ],
};

export const AUTOCOMPLETE_FILES: Record<string, GroupFiles> = {
  playground: [
    ["Combo box", "combo"],
    ["Controllable states", "controllable"],
    ["Free solo", "free-solo"],
    ["Multiple values", "multiple"],
    ["Checkboxes", "checkboxes"],
    ["Sizes", "sizes"],
  ],
  country: [
    ["Output label", "label"],
    ["Output code", "code"],
    ["Variants", "variants"],
  ],
};

/** Story Controls shared by the React and HTML stories (ADR-0015). */
export const AUTOCOMPLETE_CONTROLS = {
  schema: autocompleteOptions,
  keys: ["openOnFocus", "autoHighlight"],
} as const;
