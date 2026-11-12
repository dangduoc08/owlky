import {
  type DataAttributes,
  defineOptions,
  flag,
  number,
  optionAttributes,
  state,
  style,
} from "../options/define.js";

// --- Autocomplete -------------------------------------------------------------------------------

export const autocompleteOptions = defineOptions("autocomplete", "data-ok-autocomplete", {
  multiple: flag("data-ok-multiple", "Several values, shown as chips in the field."),
  freeSolo: flag("data-ok-free-solo", "Any text is a value (Enter commits it)."),
  disableCloseOnSelect: flag(
    "data-ok-disable-close-on-select",
    "The list stays open after a pick (multiple select with checkboxes).",
  ),
  disableClearable: flag("data-ok-disable-clearable", "No clear button."),
  openOnFocus: flag("data-ok-open-on-focus", "The list opens when the field gets focus."),
  autoHighlight: flag("data-ok-auto-highlight", "The first option is highlighted while typing."),
  limitTags: number(
    "data-ok-limit-tags",
    undefined,
    'Multiple: chips shown when the field isn\'t focused (the rest as "+3").',
    { min: 0 },
  ),
  autoComplete: flag(
    "data-ok-auto-complete",
    "Inline completion: the input shows the highlighted option, the rest of its label selected.",
  ),
  autoSelect: flag(
    "data-ok-auto-select",
    "Leaving the field picks the option highlighted by the keys or `autoHighlight` (free solo: the text).",
  ),
  blurOnSelect: style(
    "data-ok-blur-on-select",
    ["true", "mouse", "touch"],
    "true",
    "The input loses focus after a pick: always (`true`), or only after a mouse or touch pick.",
    { optional: true },
  ),
  clearOnBlur: style(
    "data-ok-clear-on-blur",
    ["true", "false"],
    "true",
    "Leaving the field puts back the chosen label (or empties the text). Default: on, off in free solo.",
    { optional: true },
  ),
  clearOnEscape: flag(
    "data-ok-clear-on-escape",
    "Escape on a closed list clears the value and the text.",
  ),
  disabledItemsFocusable: flag(
    "data-ok-disabled-items-focusable",
    "Disabled options can be highlighted (not picked).",
  ),
  disableListWrap: flag(
    "data-ok-disable-list-wrap",
    "The arrows stop at the first and last options instead of wrapping.",
  ),
  filterSelectedOptions: flag(
    "data-ok-filter-selected-options",
    "Chosen options are left out of the list.",
  ),
  handleHomeEndKeys: style(
    "data-ok-handle-home-end-keys",
    ["true", "false"],
    "true",
    "Home and End highlight the first and last options. Default: on, off in free solo.",
    { optional: true },
  ),
  includeInputInList: flag(
    "data-ok-include-input-in-list",
    "The arrows move from the last or first option back to the input.",
  ),
  loading: flag(
    "data-ok-loading",
    "Options are loading: the list shows the loading text while it has no options.",
  ),
  readOnly: flag(
    "data-ok-read-only",
    "The value can't change: the list doesn't open and chips have no remove button.",
  ),
  resetHighlightOnMouseLeave: flag(
    "data-ok-reset-highlight-on-mouse-leave",
    "The pointer leaving the list removes the highlight it made.",
  ),
  selectOnFocus: style(
    "data-ok-select-on-focus",
    ["true", "false"],
    "true",
    "The first click in the field selects its text. Default: on, off in free solo.",
    { optional: true },
  ),
  virtualize: flag(
    "data-ok-virtualize",
    "Long lists draw only the options in view (groups aren't shown).",
  ),
  value: state("aria-selected", "Chosen option(s) (`value` / `defaultValue`).", "change"),
});

export interface AutocompleteAnatomyOptions {
  multiple?: boolean | undefined;
  freeSolo?: boolean | undefined;
  disableCloseOnSelect?: boolean | undefined;
  disableClearable?: boolean | undefined;
  openOnFocus?: boolean | undefined;
  autoHighlight?: boolean | undefined;
  limitTags?: number | undefined;
  autoComplete?: boolean | undefined;
  autoSelect?: boolean | undefined;
  blurOnSelect?: boolean | "mouse" | "touch" | undefined;
  clearOnBlur?: boolean | undefined;
  clearOnEscape?: boolean | undefined;
  disabledItemsFocusable?: boolean | undefined;
  disableListWrap?: boolean | undefined;
  filterSelectedOptions?: boolean | undefined;
  handleHomeEndKeys?: boolean | undefined;
  includeInputInList?: boolean | undefined;
  loading?: boolean | undefined;
  readOnly?: boolean | undefined;
  resetHighlightOnMouseLeave?: boolean | undefined;
  selectOnFocus?: boolean | undefined;
  virtualize?: boolean | undefined;
}

const trueFalse = (value: boolean | undefined) =>
  value === undefined ? undefined : value ? "true" : "false";

/** `data-ok-*` attributes of an autocomplete root. */
export const autocompleteAttributes = (options: AutocompleteAnatomyOptions = {}): DataAttributes =>
  optionAttributes(autocompleteOptions, {
    ...options,
    blurOnSelect: options.blurOnSelect === true ? "true" : options.blurOnSelect || undefined,
    clearOnBlur: trueFalse(options.clearOnBlur),
    handleHomeEndKeys: trueFalse(options.handleHomeEndKeys),
    selectOnFocus: trueFalse(options.selectOnFocus),
  });
