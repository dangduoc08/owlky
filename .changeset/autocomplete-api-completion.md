---
"@owlky/core": minor
"@owlky/styles": minor
"@owlky/react": minor
"@owlky/html": minor
---

Autocomplete: the rest of the MUI API. New options in React and HTML: `autoComplete` (inline completion), `autoSelect`, `blurOnSelect`, `clearOnBlur`, `clearOnEscape`, `disabledItemsFocusable`, `disableListWrap`, `filterSelectedOptions`, `handleHomeEndKeys`, `includeInputInList`, `loading` (with `loadingText`), `readOnly`, `resetHighlightOnMouseLeave`, `selectOnFocus` and `virtualize` (long lists draw only the options in view). Groups (`groupBy`, `renderGroup`; HTML: `li[data-ok-list-subheader]` headings), highlight events (`onHighlightChange`, `ok:autocomplete:highlight`) and the HTML instance method `setOptions`. React adds object options and values (`getOptionLabel`, `getOptionKey`, `getOptionValue`, `isOptionEqualToValue`, `getOptionDisabled`), `renderValue` (HTML: the chip template, single values too), `clearIcon`, `popupIcon`, `forcePopupIcon`, `ListboxComponent` and the `useAutocomplete` hook; core adds `createFilterOptions`. `selectOnFocus` follows MUI's default: the first click in a field that isn't free solo selects its text.
