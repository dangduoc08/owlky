# ADR-0061: Phone input — libphonenumber-js `min` behind opt-in entries, a Select of countries

**Status:** Accepted (2026-11-11, roadmap 4.25; auto-approved under the approved Phase 4 plan).

## Context
The reference's Utilities page has a "Phone input" section: a text field with a country select
in its start adornment (auto-detected from the typed number, a default country, a fixed country,
international only, the select hidden), formatting as you type and three values under each
field (national, international, raw E.164). The reference builds it on react-phone-number-input
(MIT), which formats and validates with libphonenumber-js. Formatting and validation need the
numbering plans of about 245 countries (calling codes, national prefixes, leading digits, lengths,
format patterns): data that changes several times a year and that can't be written again by
hand. The component must keep Owlky's rules: React and HTML with the same markup, behavior in
core, no images from a CDN (react-phone-number-input loads flag SVGs from a GitHub Pages URL by
default), strict CSP, and `owlky.js` free of large opt-in engines (Editor ADR-0023, Map ADR-0025,
Markdown ADR-0035).

## Decision
1. **Dependency:** `libphonenumber-js` **1.13.15** (published 2026-10-08, more than 14 days ago),
   a runtime dependency of `@owlky/core`, pinned exactly. License MIT; its metadata is generated
   from Google's libphonenumber (Apache-2.0, the package ships `LICENSE.Apache`, compatible with
   MIT distribution). No dependencies of its own, no install scripts. Maintained by one author
   (catamphetamine) since 2016 with a release about every two weeks (metadata updates); Renovate
   keeps it current. react-phone-number-input itself is not used: its React layer (and
   `input-format`) is rewritten so React and HTML share one model.
2. **Metadata set: `min`** (react-phone-number-input's default): 19.1 kB gzip as JSON, against
   23.7 kB for `mobile` (adds number types) and 39.3 kB for `max` (strict leading digits).
   `min` formats every country and checks lengths and leading digits loosely, which is what a
   form field needs; servers that must be strict validate again with `max`. A `metadata` option
   (React prop, `createPhoneInput({ metadata })` in HTML) takes another set, as upstream.
3. **Opt-in entries.** `@owlky/core/phone` holds the model (`phoneInputChange`,
   `phoneCountryDigits`, `phoneValueDetails`, `phoneCountryOptions`…) and the input controller,
   and is not re-exported from `@owlky/core`; the option schema (`phoneInputOptions`,
   `phoneInputAttributes`) stays in `@owlky/core` (no metadata). HTML: `@owlky/html/phone` and
   `owlky-phone.js` (IIFE, loaded after `owlky.js`) register the `phone-input` definition; it is
   not in `components` (`OPT_IN`), and `scripts/check-size.mjs` fails if `owlky.js` holds the
   metadata. React: `PhoneInput` is exported from `@owlky/react` and tree-shaken when unused.
4. **Composition.** The root is a TextField (`data-ok-text-field` + `data-ok-phone-input`) whose
   input is `type="tel"` with `autocomplete="tel"`. The country select is the listbox **Select**
   (ADR-0045), composed bare (`data-ok-select` without a variant, as TablePagination does) in the
   start adornment; its options are **MenuItems** holding a **ListItemIcon** (the flag) and a
   **ListItemText** (the name, then "AU (+61)"). Autocomplete was considered for the reference's
   search box but would put a second text input in the field: the Select's typeahead (type
   "viet" to reach Vietnam) finds a country instead, and the search box is an intentional
   difference. `phone-input.css` draws the bare select and restyles its composed parts; no other
   component's CSS changes.
5. **Flags.** Emoji (two regional indicator symbols, `phoneFlag("AU")`), never images, and a
   globe SVG (original) for International. Flags are `aria-hidden`: the option's text names it,
   and in the field the trigger keeps the option's name and code visually hidden, so screen
   readers hear "Country, combobox, Australia AU (+61)". Platforms without flag emoji (Windows)
   show the two letters; `labels` / `locale` change the names, not the flags.
6. **Country names** come from `Intl.DisplayNames` in `locale` (default `en`, so server and
   client agree), sorted with `Intl.Collator`; `labels` overrides them (upstream's `labels`). No
   name list ships in the bundle.
7. **HTML list from the runtime.** Snippets carry an empty listbox; the runtime builds the
   options with DOM methods (the same markup React renders), from the metadata it already holds.
   A snippet stays small, and without JavaScript the field is a plain `tel` input.
8. **Typing model.** The state is the typed "digits" (with a leading `+` for international form)
   and the selected country; the text is `AsYouType` output and the value E.164. The caret goes
   after the same digit; Backspace / Delete next to a formatting character removes the nearest
   digit (core controller, `beforeinput`). Typing `+84…` selects Vietnam and keeps the
   international text (upstream behavior; the reference rewrites it nationally): the national
   form is in the change details.
9. **API (ADR-0015)** mapped from react-phone-number-input prop by prop: `value` / `onChange`
   (E.164, `""` instead of `undefined` so a controlled field stays controlled; details carry
   `national`, `international`, `country`, `valid`, `possible`), `defaultCountry`, `country`
   (fixed), `international`, `countryCallingCodeEditable`, `countries`, `countryOptionsOrder`,
   `addInternationalOption`, `limitMaxLength`, `focusInputOnCountrySelection`,
   `onCountryChange`, `labels`, `locale` (upstream `locales`), `metadata`; Minimals' `hideSelect`;
   ours: `defaultValue`, `validate` + `invalidText` (the validation state for the helper text) and
   every TextField prop. Not applicable: `flagUrl`, `flags`, `flagComponent`,
   `internationalIcon`, `inputComponent`, `countrySelectComponent`, `containerComponent`,
   `smartCaret` (always on), `initialValueFormat` (always national when the value's country is
   selected).
10. **Size budget:** `owlky-phone.js` measured 45.3 kB gzip (libphonenumber-js and its metadata
    about 35.5 kB of it); budget 47.5 kB in `check-size.mjs`.

## Consequences
- Pages without a phone input never load the metadata; pages with one load about 45 kB once.
- The field formats, detects and checks numbers of every country libphonenumber knows, and the
  metadata follows the dependency's releases.
- No search box in the country list (typeahead instead); flags look like letters on Windows.
- A future `flagComponent` (custom SVG flags) or a searchable list would be additive.
