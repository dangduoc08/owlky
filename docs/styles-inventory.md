# Styles inventory (ST1)

Input for ST2–ST7 of `docs/roadmap-styles.md`; decisions in ADR-0070. Measured on 2026-11-12
(commit `b0198f4b`). Maintainer document: terse.

**Method.** Component CSS (`packages/styles/src/components/*.css`, 74 files) parsed with PostCSS;
a declaration counts when a radius, border / outline / stroke width, shadow, font family / weight /
size / case / letter spacing, control height / padding or a timing is written as a literal
instead of an `--ok-*` token. `0`, `inherit`, `none` and pure `var()` values don't count;
spacing-based sizes (`calc(var(--ok-spacing) * n)`) use a token and are listed separately under
Density, since they must become density tokens. Icons: every SVG path string in
`packages/{core,react,html}/src` (tests and illustrations excluded) plus the snippets.

## Summary
| Item | Count |
|---|---|
| Hard-coded design values in component CSS | **386** declarations in 61 files |
| · focus rings (`outline`, `outline-offset`) | 140 |
| · borders (`border*`, private border widths) | 117 |
| · SVG strokes (`stroke-width`) | 45 |
| · shadows (rings and lines drawn with `box-shadow`, one `drop-shadow`) | 30 |
| · radii | 23 (+ 2 spacing-based: lightbox thumbs, org chart lines) |
| · timings (keyframe cycles, delays, easings) | 16 |
| · font sizes | 11 |
| · heights / paddings | 4 |
| · font families, weights, case, letter spacing | 0 (all tokenized already) |
| Of these, kept as geometry (not a style value) | 19 |
| Radius-token uses to map onto radius roles | 184 sites |
| Spacing-based control sizes to map onto density tokens | about 190 declarations in 28 control files |
| Component icons | **114** icon rows (about 150 drawings, counting pairs such as previous / next) in 34 components → **82** distinct Solar names |
| Distinct library path strings | 135 (+ 259 snippet-only: 149 illustration shapes, 110 story / docs demo icons) |
| Story and docs icon sets to replace | `demo-icons.json` 58, `docs-icons.tsx` 6, Lucide imports in 21 docs files |
| Files with `data-ok-preset` / `data-ok-font` / preset APIs | 52 (removal list) |
| Fonts checked | 10: all OFL 1.1 with Vietnamese; 3 without tabular figures |

## ST3 status (done 2026-11-13)
Soft's values are the default (ADR-0070 § 1, ADR-0072). § 2's six spacing-based sizes became
density tokens (`--ok-control-height-xs`, `--ok-fab-height-sm`, `--ok-toggle-group-height-sm|md|lg`,
`--ok-pagination-size-sm|md|lg`, `--ok-item-height-dense`, plus extended Fab sizes on control
heights); every density token has its compact value (`densityCompact` in `default-theme.ts`).
Label moved to `--ok-radius-chip`, Tooltip to `--ok-radius-surface-sm`. Paper draws
`--ok-surface-border-*` (0 / none in Soft).

## ST2 status (done 2026-11-12)
| Section | State |
|---|---|
| § 1 tokens, § 3 hard-coded values | ✅ Every row tokenized with today's value (radius roles, border / line widths, focus rings, density, font roles and sizes, loader timings, `--ok-icon-stroke`). Proof: a computed-style comparison of all 712 snippets, light and dark (every element and its `::before` / `::after`, animations paused at 0): 61.9 million values, 0 differences. `--ok-font-family-secondary` → `--ok-font-family-heading` (Tailwind `font-heading`); the label role reads `--ok-font-family-label`, `--ok-label-text-transform`, `--ok-label-letter-spacing`. |
| § 1 radius roles | ✅ As the table says; Label stays on `--ok-radius-control-sm` until ST3. Lightbox thumbs → `--ok-radius-surface-sm`, org chart lines → `--ok-radius-2xl`. |
| § 2 density | ✅ Tokens where a value matches: Button (heights, padding), Icon button md / lg, Fab and Toggle button md / lg, Text field padding, Chip, Tabs, Menu / Autocomplete items, Tree items, List items, Table cells, Data grid default rows, Accordion summary, Switch padding. ⏸ Kept on `--ok-spacing` (no token holds the value; ST3 decides with the compact values): Icon button sm (28px), Fab and Toggle button sm (40px), Toggle button in groups (38 / 30 / 46px), Pagination items (26 / 32 / 40px), dense Menu items (32px). |
| § 3 "keep" rows | Kept as geometry, plus Motion border `circle` (`50%`: an ellipse on non-square boxes, not `--ok-radius-full`). |
| § 4 component icons | ✅ All 114 rows: Solar, generated into `packages/core/src/icons/solar.ts` (77 names, numbers rounded to 2 decimals, answer 6). Checkbox box and radio ring are CSS from tokens (answer 3), so `stop-linear`, `record-linear`, `check-square-bold` and `minus-square-bold` aren't used; the Map compass stays a graphic (answer 5, `mapCompass`). |
| § 4 story and docs icons | ⏸ ST7 (`DemoIcon`, `docs-icons.tsx`, Lucide, Iconify sets, the Icons guide). |
| § 6 removals | ✅ Presets and font presets (code, CSS, toolbar, docs, website, e2e, specs). ⏸ Lucide, other Iconify sets, hand-drawn story sets: ST7. |

## 1. Existing tokens: Soft's starting point
ST2 keeps these values (no pixel changes); ST3 replaces them with Soft's. Source:
`packages/tokens/src/default-theme.ts`, emitted by `css.ts`.

### Color (generator inputs in ST3)
| Token | Light | Dark |
|---|---|---|
| `--ok-palette-primary-*` lighter / light / main / dark / darker / contrast | `#C8FAD6` `#5BE49B` `#00A76F` `#007867` `#004B50` `#FFFFFF` | same |
| `--ok-palette-secondary-*` | `#EFD6FF` `#C684FF` `#8E33FF` `#5119B7` `#27097A` `#FFFFFF` | same |
| `--ok-palette-info-*` | `#CAFDF5` `#61F3F3` `#00B8D9` `#006C9C` `#003768` `#FFFFFF` | same |
| `--ok-palette-success-*` | `#D3FCD2` `#77ED8B` `#22C55E` `#118D57` `#065E49` `#FFFFFF` | same |
| `--ok-palette-warning-*` | `#FFF5CC` `#FFD666` `#FFAB00` `#B76E00` `#7A4100` `#1C252E` | same |
| `--ok-palette-error-*` | `#FFE9D5` `#FFAC82` `#FF5630` `#B71D18` `#7A0916` `#FFFFFF` | same |
| `--ok-palette-<color>-text` primary / secondary / info / success / warning / error | `#007867` `#5119B7` `#006C9C` `#065E49` `#7A4100` `#B71D18` | `#5BE49B` `#C684FF` `#61F3F3` `#77ED8B` `#FFD666` `#FFAC82` |
| `--ok-palette-grey-50…900` | `#FCFDFD` `#F9FAFB` `#F4F6F8` `#DFE3E8` `#C4CDD5` `#919EAB` `#637381` `#454F5B` `#1C252E` `#141A21` | same |
| `--ok-text-primary` / `-secondary` / `-disabled` | grey 800 / 600 / 500 | white / grey 500 / grey 600 |
| `--ok-bg-default` / `-paper` / `-neutral` | white / white / grey 200 | grey 900 / grey 800 / `#28323D` |
| `--ok-inherit-main` / `-hover` / `-contrast` | grey 800 / 700 / white | white / grey 400 / grey 800 |
| `--ok-divider` | grey 500 at 20 % | grey 500 at 20 % |
| `--ok-action-hover` / `-selected` / `-focus` / `-disabled` / `-disabled-bg` | grey 500 at 8 / 16 / 24 / 80 / 24 % | same |
| `--ok-shadow-color` | grey 500 | black |
| `--ok-backdrop` | grey 800 at 48 % | grey 900 at 64 % |
| `--ok-illustration-skin-light|medium|deep` | `#FFD8BF` `#E0A47C` `#8D5B3D` | same |
| Chart defaults (`chartDefaultColors`, core) | primary-dark, warning, info, error, success, warning-dark, success-darker, info-dark, info-darker | → `--ok-chart-series-1…8` |

### Typography
| Token | Value |
|---|---|
| `--ok-font-family` | `"Public Sans Variable", "Public Sans", ui-sans-serif, system-ui, …` |
| `--ok-font-family-secondary` (→ `-heading`) | `"Barlow", ui-sans-serif, …` (h1–h3 only today) |
| `--ok-font-family-mono` | `ui-monospace, SFMono-Regular, Menlo, …` |
| `--ok-font-weight-regular|medium|semibold|bold|extrabold` | 400 / 500 / 600 / 700 / 800 |
| `--ok-font-size-xs|sm|md|lg|xl` | 0.75 / 0.8125 / 0.875 / 0.9375 / 1rem |
| `--ok-font-family-label`, `--ok-label-text-transform`, `--ok-label-letter-spacing` | new (Soft initial: `var(--ok-font-family)`, `none`, `normal`) |

| Variant | Size (xs → responsive) | Line height | Weight | Family | Case |
|---|---|---|---|---|---|
| h1 | 2.5rem → sm 3.25, md 3.625, lg 4rem | 1.25 | 800 | secondary | none |
| h2 | 2rem → 2.5, 2.75, 3rem | 1.3333 | 800 | secondary | none |
| h3 | 1.5rem → 1.625, 1.875, 2rem | 1.5 | 700 | secondary | none |
| h4 | 1.25rem → md 1.5rem | 1.5 | 700 | text | none |
| h5 | 1.125rem → sm 1.1875rem | 1.5 | 700 | text | none |
| h6 | 1.0625rem → sm 1.125rem | 1.5556 | 600 | text | none |
| subtitle1 / subtitle2 | 1rem / 0.875rem | 1.5 / 1.5714 | 600 | text | none |
| body1 / body2 | 1rem / 0.875rem | 1.5 / 1.5714 | 400 | text | none |
| caption | 0.75rem | 1.5 | 400 | text | none |
| overline | 0.75rem | 1.5 | 700 | text | uppercase |
| button | 0.875rem | 1.7143 | 700 | text | none (`text-transform` token exists, Button doesn't read it) |

`--ok-typography-<variant>-letter-spacing` is new (Soft initial `normal`). h4–h6 move to the
heading family in ST3 (ADR-0070 § 4.5); in ST2 they keep the text family.

### Shape, shadows, motion
| Token | Value |
|---|---|
| `--ok-radius-xs|sm|md|lg|xl|2xl|full` | 4 / 6 / 8 / 12 / 16 / 24 / 9999px |
| `--ok-spacing` | 0.25rem (never changes with density) |
| `--ok-shadow-z1|z4|z8|z12|z16|z20|z24` | `0 1 2 0`, `0 4 8 0`, `0 8 16 0`, `0 12 24 −4`, `0 16 32 −4`, `0 20 40 −4`, `0 24 48 0` (px), shadow color at 16 % |
| `--ok-shadow-card` | `0 0 2 0` at 20 % + `0 12 24 −4` at 12 % |
| `--ok-shadow-dropdown` | `0 0 2 0` at 24 % + `−20 20 40 −4` at 24 % |
| `--ok-shadow-dialog` / `-dialog-start` | `∓40 40 80 −8` at 24 % |
| `--ok-elevation-1…24` | Material geometry (umbra / penumbra / ambient at 20 / 14 / 12 %) |
| `--ok-shadow-<color>` | `0 8 16 0` of the color's `main` at 24 % |
| `--ok-drop-shadow-z1|z4|z8` | `drop-shadow()` of z1 / z4 / z8 |
| `--ok-duration-shortest|shorter|short|standard|exit|enter` | 150 / 200 / 250 / 300 / 480 / 640ms (not style values) |
| `--ok-easing-standard|decelerate|accelerate|expressive` | Material curves (not style values) |

### Radius roles: today's values per site (ST2 mapping)
Every component reads the scale directly (184 sites). ST2 maps each site to the role whose Soft
initial value equals today's value; the roles' ST3 values follow ADR-0070 § 4.1.

| Role (ADR-0070) | Initial value (ST2) | Sites today |
|---|---|---|
| `--ok-radius-control` | 8px (`md`) | Button, ButtonGroup, ToggleButton, TextField, Select, Pagination item, Tabs, Accordion, Alert, Paper default, Tree item, Code editor, Editor parts, Upload zone, Data grid panels, Slider |
| `--ok-radius-control-sm` | 6px (`sm`) | Menu items, Tooltip, Label, Checkbox swatch, Radio swatch, Autocomplete, Digital clock, Data grid cells, Table, Snackbar action, Stepper, Phone input, Chart parts |
| `--ok-radius-inner` | 4px (`xs`) | Date field sections, Date picker toolbar, Breadcrumbs, Link focus, Rating focus, Table detail, Editor marks, Gantt, Map parts, Markdown code |
| `--ok-radius-surface` | 16px (`xl`) | Card, Dialog, Transfer list, Walktour step, Markdown blocks, Accordion group, Editor root |
| `--ok-radius-surface-md` | 12px (`lg`) | Snackbar, Sortable, Avatar rounded, Organization chart cards, Carousel, Map controls, Date picker paper, Motion border, Slider value label |
| `--ok-radius-surface-sm` | 10px (`md × 1.25`) | Popover (every overlay surface), Upload thumbs, Lightbox thumbs |
| `--ok-radius-chip` | 10px (Chip) / 6px (Label) | Chip, Label: two values today, so ST2 keeps Label on `--ok-radius-control-sm` until ST3 |
| `--ok-radius-full` | 9999px | Avatar, Badge, Fab, IconButton, Switch, Radio, Slider thumb, Scrollbar, Progress, calendar days, clocks, Timeline dots, Stepper icons, Map buttons |
| `--ok-radius-2xs` (new scale step) | 2px | Chart bars and markers |

Tooltip sits on `--ok-radius-control-sm` today (6px) and moves to `--ok-radius-surface-sm` in ST3.

## 2. Density: spacing-based control sizes
Today every control size is `calc(var(--ok-spacing) * n)` in a private variable. ST2 turns the
root sizes into the density tokens of ADR-0070 § 4.6 (comfortable = today's value).

| Component | Declaration (file:line) | Today | Density token | Compact (ST3) |
|---|---|---|---|---|
| Button | `--_ok-height` (button.css:33 / 118 / 124 / 130) | md 36, sm 30, lg 48, xl 56px | `--ok-control-height-md|sm|lg|xl` | 32 / 28 / 40 / 48 |
| Button | `--_ok-padding-x` (button.css:34 / 119 / 125 / 131) | 12 / 8 / 16 / 16px | `--ok-control-padding-x-md|sm|lg` | 10 / 6 / 12 |
| Icon button | `--_ok-size` (icon-button.css:20 / 81 / 86) | 36 / 28 / 48px | `--ok-control-height-*` | 32 / 24 / 40 |
| Fab | `--_ok-size` (fab.css:25 / 80 / 87) | 48 / 40 / 56px | `--ok-control-height-*` | 40 / 32 / 48 |
| Toggle button | `--_ok-size` (toggle-button.css:21 / 65 / 70; 104 / 111 / 117 in groups) | 48 / 40 / 56px | `--ok-control-height-*` | 40 / 32 / 48 |
| Text field | `--_ok-pad` (text-field.css:41 / 338) | 16 / 14px, small 8 / 14px | `--ok-field-padding-y|x`, `--ok-field-padding-y-sm` | 8 / 12, 4 / 12 |
| Select | inherits Text field's padding (select.css) | as Text field | as Text field | — |
| Chip | `--_ok-height` (chip.css:25 / 143) | 32 / 24px | `--ok-chip-height`, `-sm` | 24 / 20 |
| Pagination | `--_ok-size` (pagination.css:32 / 124 / 134) | 32 / 26 / 40px | `--ok-control-height-*` (item) | 28 / 24 / 32 |
| Tabs | `min-height` (tabs.css:35 / 133 / 184 / 193) | 48px | `--ok-tab-height` | 40 |
| Menu item | `min-height` (menu.css:34; dense 70) | 34px, dense 32px | `--ok-item-height` | 28 |
| List item | `padding` (list.css:61 / 79) | 8 / 16px | `--ok-item-padding-y`, `--ok-item-padding-x` | 4 / 16 |
| Autocomplete option | `min-height` (autocomplete.css:134) | 34px | `--ok-item-height` | 28 |
| Tree item | `min-height` (tree-view.css:45) | 30px | `--ok-item-height-sm` | 26 |
| Table cell | `--_ok-pad-y|x` (table.css:43–44; small 58) | 16 / 16px, small 6px | `--ok-cell-padding-y|x`, `-y-sm` | 6 / 12 |
| Data grid | `--_ok-data-grid-row-height` / `-header-height` (data-grid.css:27–48) | 52 / 56px (compact 36 / 40, comfortable 68 / 72) | `--ok-row-height`, `--ok-row-height-header` | 36 / 40 |
| Accordion | summary `min-height` (accordion.css:53) | 56px | `--ok-accordion-summary-height` | 48 |
| Switch | `--_ok-pad-x|y` (switch.css:28–29 / 117–118) | 12 / 9px, small 7 / 4px | `--ok-switch-padding-*` | small values |

## 3. Hard-coded design values per component
"Kind" is the property family; "Proposed token" uses ADR-0070 § 4. "keep" marks geometry that
isn't a style value (proportional sizes, option-driven radii, keyframe-shape easings, the
reduced-motion 1ms). Rings and lines drawn with `box-shadow` take border-width tokens.

#### accordion

| Line | Kind | Declaration | Proposed token |
|---|---|---|---|
| 20 | border | `border-top: 1px solid var(--ok-divider)` | `--ok-border-width` |
| 106 | focus ring | `outline: 2px solid var(--ok-text-primary)` | `--ok-focus-ring-width` + `--ok-focus-ring-color` |
| 107 | focus ring | `outline-offset: -2px` | `--ok-focus-ring-inset` (−2px) |
| 131 | border | `border: 1px solid var(--ok-divider)` | `--ok-border-width` |

#### alert

| Line | Kind | Declaration | Proposed token |
|---|---|---|---|
| 29 | border | `border: 1px solid transparent` | `--ok-border-width` |

#### avatar

| Line | Kind | Declaration | Proposed token |
|---|---|---|---|
| 88 | border | `border: 2px solid var(--ok-bg-paper)` | `--ok-border-width-strong` |
| 110 | shadow | `box-shadow: inset 0 0 0 1px rgb(var(--ok-palette-grey-500-channel) / 0.16)` | ring `--ok-border-width` |
| 36 | font-size | `font-size: calc(var(--_ok-size) * 0.45)` | keep (proportional to the avatar size, not a style value) |
| 99 | font-size | `font-size: calc(var(--_ok-size) * 0.32)` | keep (proportional to the avatar size) |

#### badge

| Line | Kind | Declaration | Proposed token |
|---|---|---|---|
| 106 | border | `border: 2px solid var(--ok-bg-paper)` | `--ok-border-width-strong` |
| 162 | border | `border-bottom: 1.5px solid var(--ok-palette-common-white)` | `--ok-line-width-sm` |
| 163 | border | `border-left: 1.5px solid var(--ok-palette-common-white)` | `--ok-line-width-sm` |
| 125 | shadow | `box-shadow: 0 0 0 2px var(--ok-bg-paper)` | ring `--ok-border-width-strong` |
| 142 | shadow | `box-shadow: 0 0 0 2px var(--ok-bg-paper), inset 0 0 0 2px var(--ok-text-disabled)` | ring `--ok-border-width-strong` |
| 151 | height | `height: 2px` | `--ok-border-width-strong` (busy dot bar) |
| 160 | height | `height: 4px` | `--ok-line-width-2xl` (always-on bar) |

#### breadcrumbs

| Line | Kind | Declaration | Proposed token |
|---|---|---|---|
| 74 | focus ring | `outline: 2px solid var(--ok-text-primary)` | `--ok-focus-ring-width` + `--ok-focus-ring-color` |
| 75 | focus ring | `outline-offset: 2px` | `--ok-focus-ring-offset` |
| 127 | focus ring | `outline: 2px solid var(--ok-text-primary)` | `--ok-focus-ring-width` + `--ok-focus-ring-color` |
| 128 | focus ring | `outline-offset: 2px` | `--ok-focus-ring-offset` |

#### button

| Line | Kind | Declaration | Proposed token |
|---|---|---|---|
| 49 | border | `border: 1px solid transparent` | `--ok-border-width` |
| 110 | border | `border: 2px solid currentColor` | `--ok-border-width-strong` |
| 199 | focus ring | `outline: 2px solid var(--_ok-main)` | `--ok-focus-ring-width` |
| 200 | focus ring | `outline-offset: 2px` | `--ok-focus-ring-offset` |
| 190 | shadow | `box-shadow: 0 0 0 0.75px currentColor` | `--ok-line-width-2xs` (hover ring of outlined buttons) |
| 113 | timing | `animation: mt-button-spin 0.8s linear infinite` | `--ok-duration-spin` (0.8s; legacy ring loader) |
| 274 | timing | `animation-duration: 2.4s` | `--ok-duration-spin-reduced` (reduced-motion cycle) |

#### card

| Line | Kind | Declaration | Proposed token |
|---|---|---|---|
| 196 | focus ring | `outline: 2px solid var(--ok-text-primary)` | `--ok-focus-ring-width` + `--ok-focus-ring-color` |
| 197 | focus ring | `outline-offset: -2px` | `--ok-focus-ring-inset` (−2px) |

#### carousel

| Line | Kind | Declaration | Proposed token |
|---|---|---|---|
| 108 | focus ring | `outline: 2px solid var(--ok-text-primary)` | `--ok-focus-ring-width` + `--ok-focus-ring-color` |
| 109 | focus ring | `outline-offset: 2px` | `--ok-focus-ring-offset` |
| 400 | focus ring | `outline: 2px solid var(--_ok-carousel-color)` | `--ok-focus-ring-width` |
| 401 | focus ring | `outline-offset: -2px` | `--ok-focus-ring-inset` (−2px) |
| 423 | border | `border: 1px solid rgb(var(--ok-palette-grey-500-channel) / 0.24)` | `--ok-border-width` |
| 561 | focus ring | `outline: 2px solid var(--ok-text-primary)` | `--ok-focus-ring-width` + `--ok-focus-ring-color` |
| 562 | focus ring | `outline-offset: 2px` | `--ok-focus-ring-offset` |
| 551 | shadow | `box-shadow: 0 0 0 2px var(--ok-palette-primary-main)` | ring `--ok-border-width-strong` |

#### chart

| Line | Kind | Declaration | Proposed token |
|---|---|---|---|
| 325 | radius | `border-radius: 2px` | `--ok-radius-2xs` (2px, new) |
| 411 | radius | `border-radius: 2px` | `--ok-radius-2xs` |
| 314 | border | `border: 2px solid var(--_ok-chart-c)` | `--ok-border-width-strong` |
| 410 | border | `border: 2px solid var(--_ok-chart-c)` | `--ok-border-width-strong` |
| 481 | focus ring | `outline: 2px solid var(--ok-palette-primary-main)` | `--ok-focus-ring-width` + `--ok-focus-ring-color-brand` |
| 482 | focus ring | `outline-offset: 2px` | `--ok-focus-ring-offset` |
| 524 | stroke | `stroke-width: 2.5px` | `--ok-line-width-lg` |
| 553 | stroke | `stroke-width: 2px` | `--ok-line-width-md` |
| 557 | stroke | `stroke-width: 1px` | `--ok-line-width-xs` |
| 561 | stroke | `stroke-width: 3px` | `--ok-line-width-xl` |
| 571 | stroke | `stroke-width: 2.5px` | `--ok-line-width-lg` |
| 581 | stroke | `stroke-width: 4px` | `--ok-line-width-2xl` |
| 594 | stroke | `stroke-width: 1.5px` | `--ok-line-width-sm` |
| 665 | stroke | `stroke-width: 2px` | `--ok-line-width-md` |
| 700 | stroke | `stroke-width: 2px` | `--ok-line-width-md` |
| 705 | stroke | `stroke-width: 1.5px` | `--ok-line-width-sm` |
| 713 | stroke | `stroke-width: 1px` | `--ok-line-width-xs` |
| 724 | stroke | `stroke-width: 2px` | `--ok-line-width-md` |
| 732 | stroke | `stroke-width: 2px` | `--ok-line-width-md` |
| 783 | stroke | `stroke-width: 3px` | `--ok-line-width-xl` |
| 802 | stroke | `stroke-width: 3px` | `--ok-line-width-xl` |
| 814 | stroke | `stroke-width: 1.5px` | `--ok-line-width-sm` |
| 941 | border | `border-bottom: 1px solid var(--ok-divider)` | `--ok-border-width` |
| 1020 | border | `border: 1px solid var(--ok-divider)` | `--ok-border-width` |
| 1047 | focus ring | `outline: 2px solid var(--ok-palette-primary-main)` | `--ok-focus-ring-width` + `--ok-focus-ring-color-brand` |
| 1048 | focus ring | `outline-offset: 2px` | `--ok-focus-ring-offset` |
| 1076 | border | `border: 1px solid var(--ok-divider)` | `--ok-border-width` |
| 1097 | focus ring | `outline: 2px solid var(--ok-palette-primary-main)` | `--ok-focus-ring-width` + `--ok-focus-ring-color-brand` |
| 1098 | focus ring | `outline-offset: 2px` | `--ok-focus-ring-offset` |
| 1128 | border | `border: 1px solid var(--ok-divider)` | `--ok-border-width` |
| 1149 | focus ring | `outline: 2px solid var(--ok-palette-primary-main)` | `--ok-focus-ring-width` + `--ok-focus-ring-color-brand` |
| 1150 | focus ring | `outline-offset: 2px` | `--ok-focus-ring-offset` |
| 1164 | stroke | `stroke-width: 2px` | `--ok-line-width-md` |
| 1181 | stroke | `stroke-width: 1.5px` | `--ok-line-width-sm` |
| 1188 | stroke | `stroke-width: 4px` | `--ok-line-width-2xl` |
| 1195 | stroke | `stroke-width: 2px` | `--ok-line-width-md` |
| 1201 | stroke | `stroke-width: 3px` | `--ok-line-width-xl` |
| 1209 | stroke | `stroke-width: 1.5px` | `--ok-line-width-sm` |
| 1215 | stroke | `stroke-width: 1.5px` | `--ok-line-width-sm` |
| 1221 | stroke | `stroke-width: 2.5px` | `--ok-line-width-lg` |
| 1227 | stroke | `stroke-width: 2.5px` | `--ok-line-width-lg` |
| 1234 | stroke | `stroke-width: 2px` | `--ok-line-width-md` |
| 1250 | stroke | `stroke-width: 0.75` | `--ok-line-width-2xs` |
| 1276 | stroke | `stroke-width: 0.5` | `--ok-line-width-hairline` |
| 1301 | stroke | `stroke-width: 2px` | `--ok-line-width-md` |
| 1325 | stroke | `stroke-width: 1px` | `--ok-line-width-xs` |
| 1332 | stroke | `stroke-width: 1.5px` | `--ok-line-width-sm` |
| 1342 | stroke | `stroke-width: 1px` | `--ok-line-width-xs` |
| 1347 | stroke | `stroke-width: 1px` | `--ok-line-width-xs` |
| 1354 | stroke | `stroke-width: 1px` | `--ok-line-width-xs` |
| 1373 | stroke | `stroke-width: 1px` | `--ok-line-width-xs` |
| 1381 | stroke | `stroke-width: 2px` | `--ok-line-width-md` |
| 1392 | stroke | `stroke-width: 1.5px` | `--ok-line-width-sm` |
| 1407 | stroke | `stroke-width: 2px` | `--ok-line-width-md` |
| 1414 | stroke | `stroke-width: 2px` | `--ok-line-width-md` |
| 1492 | border | `border: 1px solid var(--ok-divider)` | `--ok-border-width` |
| 1512 | focus ring | `outline: 2px solid var(--ok-palette-primary-main)` | `--ok-focus-ring-width` + `--ok-focus-ring-color-brand` |
| 1513 | focus ring | `outline-offset: 2px` | `--ok-focus-ring-offset` |
| 1526 | stroke | `stroke-width: 1.5` | `--ok-line-width-sm` |
| 1533 | stroke | `stroke-width: 2` | `--ok-line-width-md` |
| 1557 | focus ring | `outline: 2px dashed var(--ok-text-primary)` | `--ok-focus-ring-width` + `--ok-focus-ring-color` |
| 1558 | focus ring | `outline-offset: 2px` | `--ok-focus-ring-offset` |
| 689 | font-size | `font-size: calc(var(--ok-font-size-xl) * 1.25)` | `--ok-font-size-3xl` (new, 1.25rem: donut center value) |

#### checkbox

| Line | Kind | Declaration | Proposed token |
|---|---|---|---|
| 129 | focus ring | `outline: 2px solid currentColor` | `--ok-focus-ring-width` |
| 130 | focus ring | `outline-offset: -2px` | `--ok-focus-ring-inset` (−2px) |
| 213 | focus ring | `outline: 2px solid CanvasText` | `--ok-focus-ring-width` (forced-colors fallback) |
| 214 | focus ring | `outline-offset: 2px` | `--ok-focus-ring-offset` |
| 181 | shadow | `box-shadow: inset 0 0 0 1px rgb(var(--ok-palette-grey-500-channel) / 0.16)` | ring `--ok-border-width` |
| 198 | shadow | `box-shadow: inset 0 0 0 1px rgb(var(--ok-palette-grey-500-channel) / 0.16), var(--ok-sh...` | ring `--ok-border-width` + `--ok-shadow-z8` |

#### chip

| Line | Kind | Declaration | Proposed token |
|---|---|---|---|
| 38 | radius | `border-radius: calc(var(--ok-radius-md) * 1.25)` | `--ok-radius-chip` (10px today) |
| 157 | border | `border: 1px solid var(--_ok-main)` | `--ok-border-width` |
| 211 | focus ring | `outline: 2px solid var(--ok-text-primary)` | `--ok-focus-ring-width` + `--ok-focus-ring-color` |
| 212 | focus ring | `outline-offset: 2px` | `--ok-focus-ring-offset` |
| 216 | focus ring | `outline: 2px solid currentColor` | `--ok-focus-ring-width` |

#### circular-progress

| Line | Kind | Declaration | Proposed token |
|---|---|---|---|
| 33 | timing | `animation: ok-circular-progress-rotate 1.4s linear infinite` | `--ok-duration-progress-rotate` (1.4s) |
| 51 | timing | `animation: ok-circular-progress-dash 1.4s ease-in-out infinite` | `--ok-duration-progress-rotate` + `--ok-easing-in-out` (new: `ease-in-out`) |
| 115 | timing | `animation-duration: 2.8s` | `--ok-duration-progress-rotate-reduced` (2.8s) |

#### code-editor

| Line | Kind | Declaration | Proposed token |
|---|---|---|---|
| 29 | border | `border: 1px solid rgb(var(--ok-palette-grey-500-channel) / 0.2)` | `--ok-border-width` |
| 93 | border | `border-right: 1px solid rgb(var(--ok-palette-grey-500-channel) / 0.2)` | `--ok-border-width` |
| 101 | focus ring | `outline: 2px solid var(--ok-palette-primary-main)` | `--ok-focus-ring-width` + `--ok-focus-ring-color-brand` |
| 102 | focus ring | `outline-offset: -2px` | `--ok-focus-ring-inset` (−2px) |

#### data-grid

| Line | Kind | Declaration | Proposed token |
|---|---|---|---|
| 119 | border | `border-bottom: 1px dashed var(--ok-divider)` | `--ok-border-width` |
| 314 | focus ring | `outline: 2px solid var(--ok-palette-primary-main)` | `--ok-focus-ring-width` + `--ok-focus-ring-color-brand` |
| 315 | focus ring | `outline-offset: -2px` | `--ok-focus-ring-inset` (−2px) |
| 335 | border | `border-top: 1px dashed var(--ok-divider)` | `--ok-border-width` |
| 362 | border | `border-top: 1px dashed var(--ok-divider)` | `--ok-border-width` |
| 402 | border | `border: 1px solid var(--ok-divider)` | `--ok-border-width` |
| 624 | focus ring | `outline: 2px solid var(--ok-palette-primary-main)` | `--ok-focus-ring-width` + `--ok-focus-ring-color-brand` |
| 625 | focus ring | `outline-offset: -2px` | `--ok-focus-ring-inset` (−2px) |
| 967 | border | `border-bottom: 1px solid var(--ok-divider)` | `--ok-border-width` |
| 972 | border | `border-top: 1px solid var(--ok-divider)` | `--ok-border-width` |
| 994 | border | `border-bottom: 1px solid var(--ok-divider)` | `--ok-border-width` |
| 1126 | border | `border: 1px solid var(--ok-bg-paper)` | `--ok-border-width` |
| 1173 | border | `border: 1px solid var(--ok-bg-paper)` | `--ok-border-width` |
| 1204 | border | `border-inline-end: 1px solid var(--ok-divider)` | `--ok-border-width` |
| 1212 | border | `border-inline-end: 1px solid var(--ok-divider)` | `--ok-border-width` |
| 1300 | border | `border: 1px dashed var(--ok-divider)` | `--ok-border-width` |
| 1338 | border | `border-block-start: 1px dashed var(--ok-divider)` | `--ok-border-width` |
| 1394 | border | `border-top: 1px dashed var(--ok-divider)` | `--ok-border-width` |
| 454 | shadow | `box-shadow: 1px 0 0 var(--ok-divider)` | line `--ok-border-width` |
| 458 | shadow | `box-shadow: -1px 0 0 var(--ok-divider)` | line `--ok-border-width` |
| 466 | shadow | `box-shadow: -1px 0 0 var(--ok-divider)` | line `--ok-border-width` |
| 472 | shadow | `box-shadow: 1px 0 0 var(--ok-divider)` | line `--ok-border-width` |
| 494 | shadow | `box-shadow: 1px 0 0 var(--ok-divider), var(--ok-shadow-z8)` | line `--ok-border-width` + `--ok-shadow-z8` |
| 516 | shadow | `box-shadow: -1px 0 0 var(--ok-divider), var(--ok-shadow-z8)` | line `--ok-border-width` + `--ok-shadow-z8` |
| 548 | shadow | `box-shadow: -1px 0 0 var(--ok-divider), var(--ok-shadow-z8)` | line `--ok-border-width` + `--ok-shadow-z8` |
| 560 | shadow | `box-shadow: 1px 0 0 var(--ok-divider), var(--ok-shadow-z8)` | line `--ok-border-width` + `--ok-shadow-z8` |
| 950 | shadow | `box-shadow: inset 0 2px 0 var(--ok-palette-primary-main)` | line `--ok-border-width-strong` |
| 954 | shadow | `box-shadow: inset 0 -2px 0 var(--ok-palette-primary-main)` | line `--ok-border-width-strong` |
| 1181 | shadow | `box-shadow: inset 0 0 0 1px var(--ok-palette-primary-main)` | ring `--ok-border-width` |
| 1384 | shadow | `box-shadow: 0 -2px 0 var(--ok-palette-primary-main)` | line `--ok-border-width-strong` |
| 1388 | shadow | `box-shadow: 0 2px 0 var(--ok-palette-primary-main)` | line `--ok-border-width-strong` |

#### date-calendar

| Line | Kind | Declaration | Proposed token |
|---|---|---|---|
| 154 | border | `border: 1px solid var(--ok-text-secondary)` | `--ok-border-width` |
| 274 | focus ring | `outline: 2px solid var(--ok-palette-primary-main)` | `--ok-focus-ring-width` + `--ok-focus-ring-color-brand` |
| 275 | focus ring | `outline-offset: 1px` | `--ok-focus-ring-offset-tight` |
| 225 | padding | `padding: 1px calc(var(--ok-spacing) * 1.5)` | `--ok-border-width` (1px block padding of month / year buttons) |

#### date-picker

| Line | Kind | Declaration | Proposed token |
|---|---|---|---|
| 146 | border | `border-inline-end: 1px solid var(--ok-divider)` | `--ok-border-width` |
| 286 | focus ring | `outline: 2px solid var(--ok-palette-primary-main)` | `--ok-focus-ring-width` + `--ok-focus-ring-color-brand` |
| 287 | focus ring | `outline-offset: 2px` | `--ok-focus-ring-offset` |
| 294 | border | `border-inline-start: 1px solid var(--ok-divider)` | `--ok-border-width` |
| 314 | border | `border-block-start: 1px solid var(--ok-divider)` | `--ok-border-width` |

#### date-range-calendar

| Line | Kind | Declaration | Proposed token |
|---|---|---|---|
| 47 | border | `border-inline-end: 1px solid var(--ok-divider)` | `--ok-border-width` |
| 161 | border | `border-block-width: 1px` | `--ok-border-width` |
| 166 | border | `border-inline-start-width: 1px` | `--ok-border-width` |
| 173 | border | `border-inline-end-width: 1px` | `--ok-border-width` |

#### date-range-picker

| Line | Kind | Declaration | Proposed token |
|---|---|---|---|
| 113 | border | `border-inline-start: 1px solid var(--ok-divider)` | `--ok-border-width` |

#### dialog

| Line | Kind | Declaration | Proposed token |
|---|---|---|---|
| 188 | border | `border-block: 1px solid var(--ok-divider)` | `--ok-border-width` |
| 200 | focus ring | `outline: 2px solid var(--ok-text-primary)` | `--ok-focus-ring-width` + `--ok-focus-ring-color` |
| 201 | focus ring | `outline-offset: -2px` | `--ok-focus-ring-inset` (−2px) |

#### digital-clock

| Line | Kind | Declaration | Proposed token |
|---|---|---|---|
| 50 | border | `border-inline-start: 1px solid var(--ok-divider)` | `--ok-border-width` |
| 89 | focus ring | `outline: 2px solid var(--ok-palette-primary-main)` | `--ok-focus-ring-width` + `--ok-focus-ring-color-brand` |
| 90 | focus ring | `outline-offset: -2px` | `--ok-focus-ring-inset` (−2px) |

#### divider

| Line | Kind | Declaration | Proposed token |
|---|---|---|---|
| 22 | border | `border-bottom: 1px solid var(--ok-divider)` | `--ok-border-width` |
| 39 | border | `border-inline-end: 1px solid var(--ok-divider)` | `--ok-border-width` |
| 78 | border | `border-top: 1px solid var(--ok-divider)` | `--ok-border-width` |
| 103 | border | `border-inline-start: 1px solid var(--ok-divider)` | `--ok-border-width` |

#### drawer

| Line | Kind | Declaration | Proposed token |
|---|---|---|---|
| 141 | border | `border-right: 1px solid var(--ok-divider)` | `--ok-border-width` |
| 150 | border | `border-left: 1px solid var(--ok-divider)` | `--ok-border-width` |
| 158 | border | `border-bottom: 1px solid var(--ok-divider)` | `--ok-border-width` |
| 168 | border | `border-top: 1px solid var(--ok-divider)` | `--ok-border-width` |

#### editor

| Line | Kind | Declaration | Proposed token |
|---|---|---|---|
| 64 | radius | `border-radius: var(--ok-radius-md) var(--ok-radius-md) 0 0` | `--ok-radius-control` on two corners (logical longhands) |
| 200 | radius | `border-radius: 0 0 var(--ok-radius-md) var(--ok-radius-md)` | `--ok-radius-control` on two corners (logical longhands) |
| 499 | radius | `border-radius: 0 0 var(--ok-radius-md) var(--ok-radius-md)` | `--ok-radius-control` on two corners (logical longhands) |
| 29 | border | `border: 1px solid var(--_ok-editor-border)` | `--ok-border-width` |
| 63 | border | `border-bottom: 1px solid var(--_ok-editor-border)` | `--ok-border-width` |
| 131 | border | `border: 1px solid var(--_ok-editor-border)` | `--ok-border-width` |
| 170 | focus ring | `outline: 2px solid var(--ok-text-primary)` | `--ok-focus-ring-width` + `--ok-focus-ring-color` |
| 171 | focus ring | `outline-offset: -2px` | `--ok-focus-ring-inset` (−2px) |
| 327 | border | `border-top: 1px solid var(--ok-divider)` | `--ok-border-width` |
| 375 | border | `border: 1px solid rgb(var(--ok-palette-grey-500-channel) / 0.24)` | `--ok-border-width` |
| 457 | focus ring | `outline: 2px solid var(--ok-palette-primary-main)` | `--ok-focus-ring-width` + `--ok-focus-ring-color-brand` |
| 472 | border | `border-top: 1px solid currentcolor` | `--ok-border-width` |
| 498 | border | `border-top: 1px solid var(--_ok-editor-border)` | `--ok-border-width` |
| 626 | border | `border: 1px solid var(--_ok-editor-border)` | `--ok-border-width` |
| 314 | font-size | `font-size: calc(var(--ok-spacing) * 16)` | `--ok-typography-quote-mark-size` (64px, new; shared with Markdown) |
| 345 | font-size | `font-size: 0.875em` | `--ok-font-size-code` (0.875em, new; shared with Markdown) |
| 516 | font-size | `font-size: calc(var(--ok-font-size-xl) * 17 / 16)` | `--ok-font-size-2xl` (new, 1.0625rem = 17px; menu preview of h1 blocks) |
| 473 | timing | `animation: ok-editor-cursor-blink 1.1s steps(2, start) infinite` | `--ok-duration-caret-blink` (1.1s, steps(2, start) stays) |

#### fab

| Line | Kind | Declaration | Proposed token |
|---|---|---|---|
| 41 | border | `border: 1px solid transparent` | `--ok-border-width` |
| 148 | focus ring | `outline: 2px solid var(--_ok-outline-color)` | `--ok-focus-ring-width` |
| 149 | focus ring | `outline-offset: 2px` | `--ok-focus-ring-offset` |

#### gantt

| Line | Kind | Declaration | Proposed token |
|---|---|---|---|
| 55 | border | `border-bottom: 1px solid var(--ok-divider)` | `--ok-border-width` |
| 74 | border | `border: 1px solid var(--ok-divider)` | `--ok-border-width` |
| 110 | border | `border-bottom: 1px solid var(--ok-divider)` | `--ok-border-width` |
| 169 | border | `border-bottom: 1px solid var(--ok-divider)` | `--ok-border-width` |
| 180 | border | `border-inline-start: 1px solid var(--ok-divider)` | `--ok-border-width` |
| 222 | stroke | `stroke-width: 1` | `--ok-line-width-xs` |
| 228 | stroke | `stroke-width: 2` | `--ok-line-width-md` |
| 235 | stroke | `stroke-width: 1.5` | `--ok-line-width-sm` |
| 241 | stroke | `stroke-width: 1.5` | `--ok-line-width-sm` |
| 270 | border | `border-bottom: 1px solid var(--ok-divider)` | `--ok-border-width` |
| 354 | focus ring | `outline: 2px solid var(--ok-palette-primary-main)` | `--ok-focus-ring-width` + `--ok-focus-ring-color-brand` |
| 355 | focus ring | `outline-offset: -2px` | `--ok-focus-ring-inset` (−2px) |
| 497 | focus ring | `outline: 2px solid var(--_ok-gantt-c)` | `--ok-focus-ring-width` |
| 498 | focus ring | `outline-offset: 1px` | `--ok-focus-ring-offset-tight` (1px) |
| 544 | focus ring | `outline: 2px dashed var(--_ok-gantt-c)` | `--ok-focus-ring-width` |
| 545 | focus ring | `outline-offset: 2px` | `--ok-focus-ring-offset` |

#### icon-button

| Line | Kind | Declaration | Proposed token |
|---|---|---|---|
| 105 | focus ring | `outline: 2px solid var(--_ok-main)` | `--ok-focus-ring-width` |
| 106 | focus ring | `outline-offset: 2px` | `--ok-focus-ring-offset` |

#### label

| Line | Kind | Declaration | Proposed token |
|---|---|---|---|
| 50 | border | `border: 2px solid var(--_ok-main)` | `--ok-border-width-strong` |

#### lightbox

| Line | Kind | Declaration | Proposed token |
|---|---|---|---|
| 59 | focus ring | `outline: 2px solid var(--ok-text-primary)` | `--ok-focus-ring-width` + `--ok-focus-ring-color` |
| 60 | focus ring | `outline-offset: 2px` | `--ok-focus-ring-offset` |
| 151 | focus ring | `outline-offset: -2px` | `--ok-focus-ring-inset` (−2px) |
| 564 | shadow | `filter: drop-shadow(0 0 2px rgb(var(--ok-palette-common-black-channel) / 0.48))` | keep (`shadow-literal` exception: play icon over photos) |

#### linear-progress

| Line | Kind | Declaration | Proposed token |
|---|---|---|---|
| 84 | timing | `animation: ok-linear-progress-dashed 3s linear infinite` | `--ok-duration-progress-buffer` (3s) |
| 112 | timing | `animation: ok-linear-progress-bar-1 2.1s cubic-bezier(0.65, 0.815, 0.735, 0.395) infinite` | `--ok-duration-progress-bar` (2.1s) + `--ok-easing-progress-1` |
| 119 | timing | `animation: ok-linear-progress-bar-2 2.1s cubic-bezier(0.165, 0.84, 0.44, 1) 1.15s infinite` | `--ok-duration-progress-bar` + `--ok-easing-progress-2` + delay `--ok-duration-progress-bar-delay` (1.15s) |
| 199 | timing | `animation-duration: 4.2s` | `--ok-duration-progress-bar-reduced` (4.2s) |
| 204 | timing | `animation-delay: 2.3s` | `--ok-duration-progress-bar-reduced-delay` (2.3s) |

#### link

| Line | Kind | Declaration | Proposed token |
|---|---|---|---|
| 70 | focus ring | `outline: 2px solid var(--ok-text-primary)` | `--ok-focus-ring-width` + `--ok-focus-ring-color` |
| 71 | focus ring | `outline-offset: 2px` | `--ok-focus-ring-offset` |

#### list

| Line | Kind | Declaration | Proposed token |
|---|---|---|---|
| 141 | border | `border-bottom: 1px solid var(--ok-divider)` | `--ok-border-width` |
| 167 | focus ring | `outline: 2px solid var(--ok-text-primary)` | `--ok-focus-ring-width` + `--ok-focus-ring-color` |
| 168 | focus ring | `outline-offset: -2px` | `--ok-focus-ring-inset` (−2px) |

#### map

| Line | Kind | Declaration | Proposed token |
|---|---|---|---|
| 73 | focus ring | `outline: 2px solid var(--ok-text-primary)` | `--ok-focus-ring-width` + `--ok-focus-ring-color` |
| 74 | focus ring | `outline-offset: -2px` | `--ok-focus-ring-inset` (−2px) |
| 119 | border | `border: 2px dashed var(--ok-palette-primary-main)` | `--ok-border-width-strong` |
| 274 | focus ring | `outline: 2px solid var(--ok-text-primary)` | `--ok-focus-ring-width` + `--ok-focus-ring-color` |
| 275 | focus ring | `outline-offset: 2px` | `--ok-focus-ring-offset` |
| 372 | focus ring | `outline: 2px solid var(--ok-text-primary)` | `--ok-focus-ring-width` + `--ok-focus-ring-color` |
| 471 | focus ring | `outline: 2px solid var(--ok-text-primary)` | `--ok-focus-ring-width` + `--ok-focus-ring-color` |
| 472 | focus ring | `outline-offset: -2px` | `--ok-focus-ring-inset` (−2px) |
| 588 | border | `border-top: 1px solid var(--ok-divider)` | `--ok-border-width` |
| 604 | focus ring | `outline: 2px solid var(--ok-text-primary)` | `--ok-focus-ring-width` + `--ok-focus-ring-color` |
| 605 | focus ring | `outline-offset: -2px` | `--ok-focus-ring-inset` (−2px) |
| 677 | border | `border: 3px solid var(--ok-palette-common-white)` | `--ok-border-width-heavy` (3px user-location ring) |
| 691 | border | `border: 1px solid rgb(var(--ok-palette-info-main-channel) / 0.4)` | `--ok-border-width` |
| 776 | focus ring | `outline: 2px solid var(--ok-palette-grey-800)` | `--ok-focus-ring-width` |
| 777 | focus ring | `outline-offset: -2px` | `--ok-focus-ring-inset` (−2px) |
| 859 | focus ring | `outline: 2px solid var(--ok-text-primary)` | `--ok-focus-ring-width` + `--ok-focus-ring-color` |
| 860 | focus ring | `outline-offset: -2px` | `--ok-focus-ring-inset` (−2px) |
| 987 | border | `border: 1px solid var(--ok-text-secondary)` | `--ok-border-width` |
| 1042 | focus ring | `outline: 2px solid var(--ok-text-primary)` | `--ok-focus-ring-width` + `--ok-focus-ring-color` |
| 1043 | focus ring | `outline-offset: 2px` | `--ok-focus-ring-offset` |
| 1103 | border | `border-bottom: 1px solid var(--ok-divider)` | `--ok-border-width` |
| 1131 | border | `border: 2px dashed var(--ok-text-primary)` | `--ok-border-width-strong` |
| 884 | shadow | `box-shadow: inset 0 0 0 1px var(--ok-divider)` | ring `--ok-border-width` |
| 137 | timing | `transition: opacity var(--ok-duration-standard) var(--ok-easing-standard) 1s` | delay `--ok-duration-hint-delay` (1s) |
| 645 | timing | `animation: ok-map-spin 1.2s linear infinite` | `--ok-duration-spin-slow` (1.2s) |

#### markdown

| Line | Kind | Declaration | Proposed token |
|---|---|---|---|
| 216 | border | `border-top: 1px solid var(--ok-divider)` | `--ok-border-width` |
| 323 | border | `border: 1px solid var(--ok-divider)` | `--ok-border-width` |
| 331 | border | `border: 1px solid var(--ok-divider)` | `--ok-border-width` |
| 348 | border | `border-top: 1px solid var(--ok-divider)` | `--ok-border-width` |
| 194 | font-size | `font-size: calc(var(--ok-spacing) * 6)` | `--ok-font-size-quote` (new, 1.5rem) |
| 204 | font-size | `font-size: calc(var(--ok-spacing) * 18)` | `--ok-typography-quote-mark-size` (72px here, 64px in Editor: unify or two tokens) |
| 240 | font-size | `font-size: 0.875em` | `--ok-font-size-code` |

#### menu

| Line | Kind | Declaration | Proposed token |
|---|---|---|---|
| 80 | border | `border-bottom: 1px solid var(--ok-divider)` | `--ok-border-width` |
| 101 | focus ring | `outline: 2px solid var(--ok-text-primary)` | `--ok-focus-ring-width` + `--ok-focus-ring-color` |
| 102 | focus ring | `outline-offset: -2px` | `--ok-focus-ring-inset` (−2px) |

#### motion-border

| Line | Kind | Declaration | Proposed token |
|---|---|---|---|
| 55 | radius | `border-radius: 50%` | `--ok-radius-full` |

#### motion

| Line | Kind | Declaration | Proposed token |
|---|---|---|---|
| 270 | timing | `--_ok-motion-loop-easing: linear` | keep (`linear` is the loop's geometry, not a style value) |
| 294 | timing | `--_ok-motion-loop-easing: linear` | keep |
| 572 | timing | `animation-duration: 1ms` | keep (1ms = reduced-motion instant) |

#### organization-chart

| Line | Kind | Declaration | Proposed token |
|---|---|---|---|
| 40 | radius | `--_ok-org-line-radius: calc(var(--ok-spacing) * 6)` | `--ok-radius-2xl` (24px); the rest of the org chart radii derive from this option default |
| 892 | radius | `border-start-start-radius: calc(var(--_ok-org-path-r) * var(--_ok-org-path-fwd))` | keep (derived from the line radius option) |
| 893 | radius | `border-start-end-radius: calc(var(--_ok-org-path-r) * (1 - var(--_ok-org-path-fwd)))` | keep (derived from the line radius option) |
| 909 | radius | `border-end-start-radius: calc(var(--_ok-org-path-r) * var(--_ok-org-path-fwd))` | keep (derived from the line radius option) |
| 910 | radius | `border-end-end-radius: calc(var(--_ok-org-path-r) * (1 - var(--_ok-org-path-fwd)))` | keep (derived from the line radius option) |
| 929 | radius | `border-end-start-radius: calc(var(--_ok-org-path-r) * (1 - var(--_ok-org-path-fwd)))` | keep (derived from the line radius option) |
| 944 | radius | `border-start-end-radius: calc(var(--_ok-org-path-r) * var(--_ok-org-path-fwd))` | keep (derived from the line radius option) |
| 945 | radius | `border-end-end-radius: calc(var(--_ok-org-path-r) * (1 - var(--_ok-org-path-fwd)))` | keep (derived from the line radius option) |
| 1241 | radius | `border-end-start-radius: calc(var(--_ok-org-leaf-radius) * var(--_ok-org-path-round, 0))` | keep (derived from the line radius option) |
| 1468 | radius | `border-start-start-radius: calc(var(--_ok-org-leaf-radius) * var(--_ok-org-path-round, 0))` | keep (derived from the line radius option) |
| 1696 | radius | `border-start-end-radius: calc(var(--_ok-org-leaf-radius) * var(--_ok-org-path-round, 0))` | keep (derived from the line radius option) |
| 1924 | radius | `border-start-start-radius: calc(var(--_ok-org-leaf-radius) * var(--_ok-org-path-round, 0))` | keep (derived from the line radius option) |
| 39 | border | `--_ok-org-line-width: 1px` | `--ok-border-width` |
| 323 | focus ring | `outline: 2px solid var(--ok-palette-primary-main)` | `--ok-focus-ring-width` + `--ok-focus-ring-color-brand` |
| 324 | focus ring | `outline-offset: 2px` | `--ok-focus-ring-offset` |
| 953 | focus ring | `outline: 2px solid var(--_ok-org-highlight-color)` | `--ok-focus-ring-width` |
| 969 | focus ring | `outline: 2px solid var(--ok-text-primary)` | `--ok-focus-ring-width` + `--ok-focus-ring-color` |
| 975 | shadow | `box-shadow: 0 0 0 2px var(--ok-palette-primary-main)` | ring `--ok-border-width-strong` |

#### pagination

| Line | Kind | Declaration | Proposed token |
|---|---|---|---|
| 43 | border | `border: 1px solid transparent` | `--ok-border-width` |
| 209 | focus ring | `outline: 2px solid var(--ok-text-primary)` | `--ok-focus-ring-width` + `--ok-focus-ring-color` |
| 210 | focus ring | `outline-offset: 2px` | `--ok-focus-ring-offset` |

#### paper

| Line | Kind | Declaration | Proposed token |
|---|---|---|---|
| 123 | border | `border: 1px solid rgb(var(--ok-palette-grey-500-channel) / 0.16)` | `--ok-border-width` |

#### phone-input

| Line | Kind | Declaration | Proposed token |
|---|---|---|---|
| 30 | border | `border-inline-end: 1px solid var(--ok-divider)` | `--ok-border-width` |
| 53 | focus ring | `outline: 2px solid var(--ok-text-primary)` | `--ok-focus-ring-width` + `--ok-focus-ring-color` |

#### popover

| Line | Kind | Declaration | Proposed token |
|---|---|---|---|
| 56 | radius | `border-radius: calc(var(--ok-radius-md) * 1.25)` | `--ok-radius-surface-sm` (10px today) |

#### radio

| Line | Kind | Declaration | Proposed token |
|---|---|---|---|
| 115 | focus ring | `outline: 2px solid currentColor` | `--ok-focus-ring-width` |
| 116 | focus ring | `outline-offset: -2px` | `--ok-focus-ring-inset` (−2px) |
| 199 | focus ring | `outline: 2px solid CanvasText` | `--ok-focus-ring-width` (forced-colors fallback) |
| 200 | focus ring | `outline-offset: 2px` | `--ok-focus-ring-offset` |
| 167 | shadow | `box-shadow: inset 0 0 0 1px rgb(var(--ok-palette-grey-500-channel) / 0.16)` | ring `--ok-border-width` |
| 184 | shadow | `box-shadow: inset 0 0 0 1px rgb(var(--ok-palette-grey-500-channel) / 0.16), var(--ok-sh...` | ring `--ok-border-width` + `--ok-shadow-z8` |

#### rating

| Line | Kind | Declaration | Proposed token |
|---|---|---|---|
| 168 | focus ring | `outline: 2px solid var(--ok-text-primary)` | `--ok-focus-ring-width` + `--ok-focus-ring-color` |
| 169 | focus ring | `outline-offset: 1px` | `--ok-focus-ring-offset-tight` |

#### scrollbar

| Line | Kind | Declaration | Proposed token |
|---|---|---|---|
| 23 | focus ring | `outline: 2px solid var(--ok-text-primary)` | `--ok-focus-ring-width` + `--ok-focus-ring-color` |
| 24 | focus ring | `outline-offset: -2px` | `--ok-focus-ring-inset` (−2px) |

#### select

| Line | Kind | Declaration | Proposed token |
|---|---|---|---|
| 118 | border | `--_ok-border-width: 1px` | `--ok-border-width` |
| 353 | border | `border-bottom: 1px solid var(--_ok-line)` | `--ok-border-width` |
| 363 | border | `border-bottom: 2px solid var(--_ok-accent)` | `--ok-border-width-strong` |
| 386 | border | `border-bottom-width: 2px` | `--ok-border-width-strong` |
| 393 | border | `--_ok-border-width: 2px` | `--ok-border-width-strong` |
| 399 | shadow | `box-shadow: inset 0 0 0 2px var(--_ok-accent)` | ring `--ok-border-width-strong` |

#### slider

| Line | Kind | Declaration | Proposed token |
|---|---|---|---|
| 140 | border | `border: 1px solid rgb(var(--ok-palette-grey-500-channel) / 0.08)` | `--ok-border-width` |
| 182 | focus ring | `outline: 2px solid var(--_ok-slider-main)` | `--ok-focus-ring-width` |
| 183 | focus ring | `outline-offset: 2px` | `--ok-focus-ring-offset` |

#### snackbar

| Line | Kind | Declaration | Proposed token |
|---|---|---|---|
| 106 | focus ring | `outline: 2px solid var(--ok-text-primary)` | `--ok-focus-ring-width` + `--ok-focus-ring-color` |
| 107 | focus ring | `outline-offset: 2px` | `--ok-focus-ring-offset` |
| 273 | border | `border: 1px solid rgb(var(--ok-palette-grey-500-channel) / 0.32)` | `--ok-border-width` |
| 300 | border | `border: 1px solid var(--ok-divider)` | `--ok-border-width` |
| 328 | focus ring | `outline: 2px solid currentColor` | `--ok-focus-ring-width` |
| 329 | focus ring | `outline-offset: 2px` | `--ok-focus-ring-offset` |
| 333 | focus ring | `outline: 2px solid var(--ok-text-primary)` | `--ok-focus-ring-width` + `--ok-focus-ring-color` |
| 334 | focus ring | `outline-offset: 2px` | `--ok-focus-ring-offset` |

#### sortable

| Line | Kind | Declaration | Proposed token |
|---|---|---|---|
| 69 | border | `border: 1px dashed rgb(var(--ok-palette-grey-500-channel) / 0.16)` | `--ok-border-width` |
| 74 | border | `border: 1px dashed rgb(var(--ok-palette-grey-500-channel) / 0.16)` | `--ok-border-width` |
| 101 | border | `border: 1px solid rgb(var(--ok-palette-grey-500-channel) / 0.16)` | `--ok-border-width` |
| 154 | focus ring | `outline: 2px dashed var(--ok-text-secondary)` | `--ok-focus-ring-width` |
| 155 | focus ring | `outline-offset: 2px` | `--ok-focus-ring-offset` |
| 179 | focus ring | `outline: 2px solid var(--ok-text-secondary)` | `--ok-focus-ring-width` |
| 180 | focus ring | `outline-offset: 2px` | `--ok-focus-ring-offset` |

#### stepper

| Line | Kind | Declaration | Proposed token |
|---|---|---|---|
| 68 | radius | `border-radius: 1px` | `--ok-radius-2xs` / 2 (rounded 2px line; or drop) |
| 29 | border | `--_ok-step-line: 1px` | `--ok-border-width` |
| 109 | focus ring | `outline: 2px solid var(--ok-text-primary)` | `--ok-focus-ring-width` + `--ok-focus-ring-color` |
| 110 | focus ring | `outline-offset: -2px` | `--ok-focus-ring-inset` (−2px) |
| 313 | border | `--_ok-step-line: 3px` | `--ok-border-width-heavy` |
| 357 | border | `--_ok-step-line: 3px` | `--ok-border-width-heavy` |

#### switch

| Line | Kind | Declaration | Proposed token |
|---|---|---|---|
| 165 | focus ring | `outline: 2px solid var(--ok-text-primary)` | `--ok-focus-ring-width` + `--ok-focus-ring-color` |
| 166 | focus ring | `outline-offset: 2px` | `--ok-focus-ring-offset` |

#### table

| Line | Kind | Declaration | Proposed token |
|---|---|---|---|
| 38 | focus ring | `outline: 2px solid var(--ok-text-primary)` | `--ok-focus-ring-width` + `--ok-focus-ring-color` |
| 39 | focus ring | `outline-offset: -2px` | `--ok-focus-ring-inset` (−2px) |
| 64 | border | `border-bottom: 1px dashed var(--ok-divider)` | `--ok-border-width` |
| 229 | focus ring | `outline: 2px solid var(--ok-text-primary)` | `--ok-focus-ring-width` + `--ok-focus-ring-color` |
| 230 | focus ring | `outline-offset: 2px` | `--ok-focus-ring-offset` |
| 289 | focus ring | `outline: 2px solid var(--ok-text-primary)` | `--ok-focus-ring-width` + `--ok-focus-ring-color` |
| 314 | focus ring | `outline: 2px solid var(--ok-text-primary)` | `--ok-focus-ring-width` + `--ok-focus-ring-color` |

#### tabs

| Line | Kind | Declaration | Proposed token |
|---|---|---|---|
| 216 | focus ring | `outline: 2px solid var(--ok-text-primary)` | `--ok-focus-ring-width` + `--ok-focus-ring-color` |
| 217 | focus ring | `outline-offset: -2px` | `--ok-focus-ring-inset` (−2px) |
| 370 | focus ring | `outline: 2px solid var(--ok-text-primary)` | `--ok-focus-ring-width` + `--ok-focus-ring-color` |
| 371 | focus ring | `outline-offset: 2px` | `--ok-focus-ring-offset` |
| 232 | height | `height: 2px` | `--ok-border-width-strong` (indicator thickness) |

#### text-field

| Line | Kind | Declaration | Proposed token |
|---|---|---|---|
| 55 | border | `--_ok-border-width: 1px` | `--ok-border-width` |
| 481 | border | `border-bottom: 1px solid var(--_ok-line)` | `--ok-border-width` |
| 491 | border | `border-bottom: 2px solid var(--_ok-accent)` | `--ok-border-width-strong` |
| 536 | border | `border-bottom-width: 2px` | `--ok-border-width-strong` |
| 543 | border | `--_ok-border-width: 2px` | `--ok-border-width-strong` |
| 556 | shadow | `box-shadow: inset 0 0 0 2px var(--_ok-accent)` | ring `--ok-border-width-strong` |

#### time-clock

| Line | Kind | Declaration | Proposed token |
|---|---|---|---|
| 25 | radius | `--_ok-clock-radius: calc((var(--_ok-clock-size) - var(--_ok-clock-number) - 2px) / 2)` | keep (geometry: the face's radius) |
| 109 | border | `border: 2px solid var(--ok-palette-primary-main)` | `--ok-border-width-strong` |
| 129 | focus ring | `outline: 2px solid var(--ok-palette-primary-main)` | `--ok-focus-ring-width` + `--ok-focus-ring-color-brand` |
| 130 | focus ring | `outline-offset: 2px` | `--ok-focus-ring-offset` |
| 244 | focus ring | `outline: 2px solid var(--ok-palette-primary-main)` | `--ok-focus-ring-width` + `--ok-focus-ring-color-brand` |
| 245 | focus ring | `outline-offset: 1px` | `--ok-focus-ring-offset-tight` |

#### timeline

| Line | Kind | Declaration | Proposed token |
|---|---|---|---|
| 97 | border | `border: 2px solid transparent` | `--ok-border-width-strong` |

#### toggle-button

| Line | Kind | Declaration | Proposed token |
|---|---|---|---|
| 34 | border | `border: 1px solid rgb(var(--ok-palette-grey-500-channel) / 0.2)` | `--ok-border-width` |
| 81 | border | `border: 1px solid rgb(var(--ok-palette-grey-500-channel) / 0.16)` | `--ok-border-width` |
| 136 | focus ring | `outline: 2px solid var(--_ok-main)` | `--ok-focus-ring-width` |
| 137 | focus ring | `outline-offset: 2px` | `--ok-focus-ring-offset` |

#### tooltip

| Line | Kind | Declaration | Proposed token |
|---|---|---|---|
| 38 | font-size | `font-size: calc(var(--ok-font-size-xs) - 0.0625rem)` | `--ok-font-size-2xs` (11px, new) |

#### transfer-list

| Line | Kind | Declaration | Proposed token |
|---|---|---|---|
| 82 | border | `border-bottom: 1px solid var(--ok-divider)` | `--ok-border-width` |

#### tree-view

| Line | Kind | Declaration | Proposed token |
|---|---|---|---|
| 185 | focus ring | `outline: 2px solid var(--ok-text-primary)` | `--ok-focus-ring-width` + `--ok-focus-ring-color` |
| 186 | focus ring | `outline-offset: -2px` | `--ok-focus-ring-inset` (−2px) |
| 211 | border | `border-inline-start: 1px dashed rgb(var(--ok-palette-grey-500-channel) / 0.4)` | `--ok-border-width` |
| 256 | border | `border: 1px solid var(--ok-palette-primary-main)` | `--ok-border-width` |
| 266 | focus ring | `outline: 2px solid var(--ok-palette-primary-main)` | `--ok-focus-ring-width` + `--ok-focus-ring-color-brand` |
| 280 | shadow | `box-shadow: inset 0 2px 0 var(--ok-palette-primary-main)` | line `--ok-border-width-strong` |
| 284 | shadow | `box-shadow: inset 0 -2px 0 var(--ok-palette-primary-main)` | line `--ok-border-width-strong` |
| 289 | shadow | `box-shadow: inset 0 0 0 1px var(--ok-palette-primary-main)` | ring `--ok-border-width` |

#### upload

| Line | Kind | Declaration | Proposed token |
|---|---|---|---|
| 34 | radius | `--_ok-thumb-radius: calc(var(--ok-radius-md) * 1.25)` | `--ok-radius-surface-sm` (10px) |
| 55 | border | `border: 1px dashed var(--_ok-zone-border)` | `--ok-border-width` |
| 82 | focus ring | `outline: 2px solid var(--ok-text-primary)` | `--ok-focus-ring-width` + `--ok-focus-ring-color` |
| 83 | focus ring | `outline-offset: 2px` | `--ok-focus-ring-offset` |
| 220 | border | `border: 1px solid rgb(var(--ok-palette-error-main-channel) / 0.24)` | `--ok-border-width` |
| 274 | border | `border: 1px solid rgb(var(--ok-palette-grey-500-channel) / 0.16)` | `--ok-border-width` |
| 404 | font-size | `font-size: calc(var(--ok-spacing) * 2)` | keep (8px extension label inside the 32px file icon: icon geometry) |

#### walktour

| Line | Kind | Declaration | Proposed token |
|---|---|---|---|
| 167 | border | `border: 2px solid var(--ok-palette-primary-main)` | `--ok-border-width-strong` |
| 180 | focus ring | `outline: 2px solid var(--ok-palette-primary-main)` | `--ok-focus-ring-width` + `--ok-focus-ring-color-brand` |
| 181 | focus ring | `outline-offset: 2px` | `--ok-focus-ring-offset` |

## 4. Component icons → Solar
Every icon a component draws itself (React file; the HTML runtime or snippet draws the same
paths unless noted). Style: **s2** = stroke 2px, **s1.5** = stroke 1.5px, **fill** = filled
shape. Every proposed name was checked against `@iconify-json/solar@1.2.13` `icons.json`
(1,522 Linear icons). **approx.** = no Solar drawing with the same meaning; the closest one is
proposed (owner check in ST2). Solar has no Linear-only gaps among these: the Bold fallbacks
below are deliberate state glyphs (ADR-0070 § 9), and Line Duotone is never needed.

| Component | Icon (purpose) | Source | Today | Solar |
|---|---|---|---|---|
| Accordion | expand toggle (plus) | `react/src/accordion/accordion.tsx:122` | s2 | `add-linear` |
| Alert | success | `react/src/alert/alert.tsx:11` | s2 | `check-circle-linear` |
| Alert | info | `alert.tsx:12` | s2 | `info-circle-linear` |
| Alert | warning | `alert.tsx:13` | s2 | `danger-triangle-linear` |
| Alert | error | `alert.tsx:14` | s2 | `danger-circle-linear` |
| Alert | close | `alert.tsx:35` | s2 | `close-linear` |
| Autocomplete | clear | `react/src/autocomplete/autocomplete.tsx:54` | s2 | `close-linear` |
| Autocomplete | popup toggle | `autocomplete.tsx:63` | s2 | `alt-arrow-down-linear` |
| Avatar | fallback person | `react/src/avatar/avatar.tsx:30` | fill | `user-bold` (state glyph) |
| Breadcrumbs | collapsed items | `react/src/breadcrumbs/breadcrumbs.tsx:18` | fill dots | `menu-dots-linear` |
| Carousel | previous / next | `react/src/carousel/carousel.tsx:385` | s2 | `alt-arrow-left-linear` / `alt-arrow-right-linear` |
| Carousel | autoplay play / pause | `carousel.tsx:568` | fill disc | `play-circle-linear` / `pause-circle-linear` |
| Checkbox | unchecked | `react/src/checkbox/checkbox.tsx:22`, `html/src/components/data-grid/data-grid.ts:871` | s1.5 rect | `stop-linear` (see Q3) |
| Checkbox | checked | `checkbox.tsx:39`, `data-grid.ts:889` | fill rect + s2 mark | `check-square-bold` (state glyph) |
| Checkbox | indeterminate | `checkbox.tsx:54`, `data-grid.ts:891` | fill rect + s2 bar | `minus-square-bold` (state glyph) |
| Checkbox / Radio / Avatar | swatch check mark | `checkbox.tsx:64`, `react/src/radio/radio.tsx:46` | s2.5 | `check-linear` |
| Radio | unchecked | `radio.tsx:25` | s1.5 circle | `record-linear` |
| Radio | checked | `radio.tsx:33` | fill ring + dot | no Solar glyph: `record-linear` ring + a token-drawn dot (Q3) |
| Chip | delete | `react/src/chip/chip.tsx:20` | fill disc + cross | `close-circle-linear` |
| Data grid | sort arrow | `react/src/data-grid/data-grid.tsx:1196`, `data-grid.ts:751` | fill | `arrow-up-linear` |
| Data grid | column menu | `data-grid.tsx` `MoreIcon` | fill dots | `menu-dots-vertical-linear` |
| Data grid | columns panel | `ColumnsIcon` | fill | `columns-3-linear` |
| Data grid | filter | `FilterIcon` | fill | `filter-linear` |
| Data grid | density | `DensityIcon` | fill | `hamburger-menu-linear` (approx.) |
| Data grid | export | `ExportIcon` | fill | `download-minimalistic-linear` |
| Data grid | add (filter, group) | `PlusIcon` | fill | `add-linear` |
| Data grid | close / remove | `CloseIcon` | fill | `close-linear` |
| Data grid | quick filter | `SearchIcon` | fill | `magnifier-linear` |
| Data grid | group expand | `ChevronIcon`, `data-grid.ts:750` | fill | `alt-arrow-right-linear` |
| Data grid | detail panel | `ExpandIcon` | fill | `alt-arrow-down-linear` |
| Data grid | row reorder grip | `GripIcon` | fill dots | `reorder-linear` (approx.) |
| Data grid | pivot | `PivotIcon` | fill | `table-properties-linear` (approx.) |
| Data grid | move up / down | `MoveIcon` | fill | `arrow-up-linear` / `arrow-down-linear` |
| Data grid | charts | `ChartIcon` | fill | `chart-2-linear` |
| Data grid | undo / redo | `UndoIcon`, `RedoIcon` | fill | `undo-left-linear` / `undo-right-linear` |
| Data grid | select arrow (cell editor) | `data-grid.ts:956` | s2 | `alt-arrow-down-linear` |
| Date pickers | open (calendar) | `react/src/date-picker/date-picker.tsx:101`, `date-range-picker.tsx:93` | fill | `calendar-linear` |
| Date pickers | time view / toolbar | `react/src/date-picker/picker-toolbar.tsx:138` | fill | `clock-circle-linear` |
| Date pickers | month arrows, view switch | `react/src/date-calendar/date-calendar.tsx:77`, `html/src/components/date-calendar/picker-dom.ts:170` | s2 | `alt-arrow-left-linear` / `alt-arrow-right-linear` / `alt-arrow-down-linear` |
| Date pickers | clear field | `react/src/date-field/date-field.tsx:183` | s2 | `close-linear` |
| Editor | bold | `core/src/editor/icons.ts` | s2 | `text-bold-linear` |
| Editor | italic | `icons.ts` | s2 | `text-italic-linear` |
| Editor | underline | `icons.ts` | s2 | `text-underline-linear` |
| Editor | strike | `icons.ts` | s2 | `text-cross-linear` |
| Editor | bullet list | `icons.ts` | s2 | `list-linear` |
| Editor | ordered list | `icons.ts` | s2 | `list-ordered-linear` |
| Editor | align left / center / right / justify | `icons.ts` | s2 | `align-left-linear` / `align-horizontal-center-linear` / `align-right-linear` / `hamburger-menu-linear` (all approx.: Solar has no text-align set; Q4) |
| Editor | inline code | `icons.ts` | s2 | `code-linear` |
| Editor | code block | `icons.ts` | s2 | `code-square-linear` |
| Editor | blockquote | `icons.ts` | s2 | `quote-linear` (check: name exists, drawing to review) |
| Editor | horizontal rule | `icons.ts` | s2 | `separator-horizontal-linear` |
| Editor | link / unlink | `icons.ts` | s2 | `link-linear` / `link-broken-linear` |
| Editor | image | `icons.ts` | s2 | `gallery-linear` |
| Editor | hard break | `icons.ts` | s2 | `paragraph-spacing-linear` (approx.) |
| Editor | clear format | `icons.ts` | s2 | `eraser-linear` |
| Editor | undo / redo | `icons.ts` | s2 | `undo-left-linear` / `undo-right-linear` |
| Editor | fullscreen / exit | `icons.ts` | s2 | `full-screen-linear` / `quit-full-screen-linear` |
| Editor | block menu chevron | `icons.ts` | s2 | `alt-arrow-down-linear` |
| Editor | table | `icons.ts` | s2 | `table-linear` |
| Chart | toolbar zoom in / out | `core/src/chart/chart-toolbar.ts:96` | s2 | `magnifier-zoom-in-linear` / `magnifier-zoom-out-linear` |
| Chart | toolbar reset | `chart-toolbar.ts:100` | s2 | `restart-linear` |
| Chart | toolbar pan | `chart-toolbar.ts:101` | s2 | `move-linear` |
| Chart | toolbar measure / clear | `chart-toolbar.ts:102–103` | s2 | `ruler-linear` / `close-linear` |
| Gantt | row expand | `core/src/gantt/gantt-render.ts:214` | s2 | `alt-arrow-right-linear` |
| Gantt | zoom in / out | `gantt-render.ts:215 / 217` | s2 | `magnifier-zoom-in-linear` / `magnifier-zoom-out-linear` |
| Gantt | download | `gantt-render.ts:216` | s2 | `download-minimalistic-linear` |
| Image | load error | `react/src/image/image.tsx:31`, `html/src/components/image/image.ts:10` | s1.5 | `gallery-remove-linear` |
| Lightbox | zoom in / out | `react/src/lightbox/lightbox-icons.tsx:24–31` | s1.8 | `magnifier-zoom-in-linear` / `magnifier-zoom-out-linear` |
| Lightbox | rotate clockwise / counterclockwise | `lightbox-icons.tsx:38–44` | s1.8 | `undo-right-round-linear` / `undo-left-round-linear` (approx.) |
| Lightbox | slideshow play / pause | `lightbox-icons.tsx:50–56` | fill / s2.6 | `play-linear` / `pause-linear` |
| Lightbox | fullscreen / exit | `lightbox-icons.tsx:62–68` | s1.8 | `full-screen-linear` / `quit-full-screen-linear` |
| Lightbox | download | `lightbox-icons.tsx:74` | s1.8 | `download-minimalistic-linear` |
| Lightbox | share | `lightbox-icons.tsx:80` | s1.8 | `share-linear` |
| Lightbox | captions | `lightbox-icons.tsx:89` | s1.8 | `subtitles-linear` |
| Lightbox | thumbnails | `lightbox-icons.tsx:96` | s1.8 | `gallery-wide-linear` (approx.) |
| Lightbox | close, previous / next | `lightbox-icons.tsx:103–115` | s1.8 | `close-linear`, `alt-arrow-left-linear` / `alt-arrow-right-linear` |
| Lightbox | video badge | `lightbox-icons.tsx:122` | fill disc 32 % + triangle | `play-circle-linear` |
| List | nested list toggle | `react/src/list/list.tsx:225` | s2 | `alt-arrow-down-linear` |
| Map | zoom in / out | `core/src/map/icons.ts:7–8` | s2 | `add-linear` / `minus-linear` |
| Map | compass | `icons.ts:9–10` (two halves, rotated by the bearing) | fill | `compass-linear` (Q5: the needle is a live graphic) |
| Map | geolocate | `icons.ts:11` | s2 | `gps-linear` |
| Map | fullscreen / exit | `icons.ts:13–14` | s2 | `full-screen-linear` / `quit-full-screen-linear` |
| Map | projection (globe) | `icons.ts:15` | s2 | `global-linear` |
| Map | terrain | `icons.ts:17` | s2 | `panorama-linear` (approx.: no mountain icon) |
| Map | attribution | `icons.ts:18` | s2 | `info-circle-linear` |
| Map | popup close | `icons.ts:19` | s2 | `close-linear` |
| Map | marker pin | `icons.ts:20` | fill | `map-point-bold` (state glyph: a filled marker) |
| Menu | submenu arrow | `react/src/menu/menu.tsx:434` | s2 | `alt-arrow-right-linear` |
| Number field | increment / decrement | `react/src/text-field/number-field.tsx:17` | s2 | `add-linear` / `minus-linear` |
| Organization chart | branch toggle | `react/src/organization-chart/organization-chart.tsx:76` | s2 (Lucide `chevron-down` copy) | `alt-arrow-down-linear` |
| Organization chart | zoom out / in | `organization-chart.tsx:795` | s2 (Lucide `zoom-out` / `zoom-in`) | `magnifier-zoom-out-linear` / `magnifier-zoom-in-linear` |
| Organization chart | fit | `organization-chart.tsx:811` | s2 (Lucide `scan`) | `maximize-square-minimalistic-linear` (approx.) |
| Organization chart | reset | `organization-chart.tsx:819` | s2 (Lucide `rotate-ccw`) | `restart-linear` |
| Pagination | first / previous / next / last | `react/src/pagination/pagination.tsx:28` | s2 | `double-alt-arrow-left-linear` / `alt-arrow-left-linear` / `alt-arrow-right-linear` / `double-alt-arrow-right-linear` |
| Phone input | no country (globe) | `react/src/phone-input/phone-input.tsx:32`, `html/src/components/phone-input/phone-input.ts:77` | s1.5 | `global-linear` |
| Rating | star | `react/src/rating/rating.tsx:24` | fill | `star-bold` (state glyph; empty stars are the same shape dimmed) |
| Select / Text field | select arrow | `react/src/select/select.tsx:54`, `text-field/text-field.tsx:30` | s2 | `alt-arrow-down-linear` |
| Snackbar (toaster) | info / success / warning / error | `react/src/snackbar/snackbar.tsx:52–70`, `html/src/components/toaster/toaster.ts:81` | fill (Material-like) | `info-circle-linear` / `check-circle-linear` / `danger-triangle-linear` / `danger-circle-linear` |
| Snackbar (toaster) | close | `snackbar.tsx:74`, `toaster.ts:138` | s2 | `close-linear` |
| Sortable | remove | `react/src/sortable/sortable.tsx:31` | s2 | `close-linear` |
| Sortable | drag handle | `sortable.tsx:44` | s3 dots | `reorder-linear` (approx.) |
| Stepper | completed | `react/src/stepper/stepper.tsx:156` | s3 | `check-linear` |
| Stepper | error | `stepper.tsx:173` | s3 | `danger-linear` |
| Table | sort arrow | `react/src/table/table.tsx:190` | s2 | `arrow-down-linear` |
| Table | row expand, pagination arrows | `table.tsx:236`, `CHEVRONS` `table.tsx:250` | s2 | `alt-arrow-down-linear`; pagination as Pagination |
| Tabs | scroll buttons | `react/src/tabs/tabs.tsx:74` | s2 | `alt-arrow-left-linear` / `alt-arrow-right-linear` |
| Transfer list | move all right / right / left / all left | `react/src/transfer-list/transfer-list.tsx:27` | s2 | `double-alt-arrow-right-linear` / `alt-arrow-right-linear` / `alt-arrow-left-linear` / `double-alt-arrow-left-linear` |
| Tree view | expand | `react/src/tree-view/tree-view.tsx:69`, `html/src/components/tree-view/tree-view.ts:101` | s2 | `alt-arrow-right-linear` |
| Tree view | lazy load error | `tree-view.tsx:87`, `tree-view.ts:149` | fill (Material-like) | `danger-circle-linear` |
| Upload | upload (cloud) | `react/src/upload/upload-icons.tsx:20` | fill | `cloud-upload-linear` |
| Upload | avatar placeholder (camera) | `upload-icons.tsx:35` | fill | `camera-linear` |
| Upload | remove | `upload-icons.tsx:51` | s2 | `close-linear` |
| Upload | file without thumbnail | `core/src/upload/upload-model.ts:12` (32px page, extension text on top) | fill | `file-linear` (extension label stays) |
| Walktour | close | `react/src/walktour/walktour.tsx:143` | fill (Material-like) | `close-linear` |

Not icons (stay): chart pattern cues (`chart-cues.ts`), progress spinners (Circular progress,
toaster and tree view loaders), the Walktour spotlight mask, chart and Gantt geometry,
illustrations (ADR-0041).

**Distinct Solar names used by components (82):** `add-linear`, `align-horizontal-center-linear`, `align-left-linear`, `align-right-linear`, `alt-arrow-down-linear`, `alt-arrow-left-linear`, `alt-arrow-right-linear`, `arrow-down-linear`, `arrow-up-linear`, `calendar-linear`, `camera-linear`, `chart-2-linear`, `check-circle-linear`, `check-linear`, `check-square-bold`, `clock-circle-linear`, `close-circle-linear`, `close-linear`, `cloud-upload-linear`, `code-linear`, `code-square-linear`, `columns-3-linear`, `compass-linear`, `danger-circle-linear`, `danger-linear`, `danger-triangle-linear`, `double-alt-arrow-left-linear`, `double-alt-arrow-right-linear`, `download-minimalistic-linear`, `eraser-linear`, `file-linear`, `filter-linear`, `full-screen-linear`, `gallery-linear`, `gallery-remove-linear`, `gallery-wide-linear`, `global-linear`, `gps-linear`, `hamburger-menu-linear`, `info-circle-linear`, `link-broken-linear`, `link-linear`, `list-linear`, `list-ordered-linear`, `magnifier-linear`, `magnifier-zoom-in-linear`, `magnifier-zoom-out-linear`, `map-point-bold`, `maximize-square-minimalistic-linear`, `menu-dots-linear`, `menu-dots-vertical-linear`, `minus-linear`, `minus-square-bold`, `move-linear`, `panorama-linear`, `paragraph-spacing-linear`, `pause-circle-linear`, `pause-linear`, `play-circle-linear`, `play-linear`, `quit-full-screen-linear`, `quote-linear`, `record-linear`, `reorder-linear`, `restart-linear`, `ruler-linear`, `separator-horizontal-linear`, `share-linear`, `star-bold`, `stop-linear`, `subtitles-linear`, `table-linear`, `table-properties-linear`, `text-bold-linear`, `text-cross-linear`, `text-italic-linear`, `text-underline-linear`, `undo-left-linear`, `undo-left-round-linear`, `undo-right-linear`, `undo-right-round-linear`, `user-bold`.

### Story and docs icons (ST2 / ST7)
| Set | Where | Count | Replacement |
|---|---|---|---|
| `demo-icons.json` (hand-drawn, s2; snippets embed the same paths) — ✅ ST7b, removed; names follow the docs examples where they differ below (`trash`→`trash-bin-trash`, `spam`→`danger-circle`, `comment`→`chat-round-line`, `wifi`→`wi-fi-router`, `person`→`user-rounded`, `home`→`home-angle`, `userPlus`→`user-plus-rounded`, `alignCenter/Right/Justify`→`align-horizontal-center` / `align-right` / `align-horizontal-spacing`) | `apps/storybook/src/components/shared/demo-icon.tsx`, 33 story files | 58 | Solar Linear: `check`→`check-linear`, `alignLeft…Justify`→ as Editor, `viewList`→`list-linear`, `viewModule`→`widget-linear`, `viewQuilt`→`widget-4-linear`, `bold/italic/underline`→`text-*-linear`, `inbox`→`inbox-linear`, `plus`→`add-linear`, `chevronDown/Left/Right`→`alt-arrow-*-linear`, `arrowLeft/Right`→`arrow-*-linear`, `send`→`plain-linear`, `mail`→`letter-linear`, `star`→`star-linear`, `trash`→`trash-bin-minimalistic-linear`, `spam`→`shield-warning-linear`, `image`→`gallery-linear`, `work`→`case-linear`, `sun`→`sun-linear`, `comment`→`chat-round-linear`, `wifi`→`wi-fi-linear`, `bluetooth`→`bluetooth-linear`, `moreHorizontal/Vertical`→`menu-dots(-vertical)-linear`, `close`→`close-linear`, `person`→`user-linear`, `phone`→`phone-linear`, `heart`→`heart-linear`, `headphones`→`headphones-round-linear`, `home`→`home-linear`, `cube`→`box-linear`, `settings`→`settings-linear`, `userPlus`→`user-plus-linear`, `monitor`→`monitor-linear`, `volumeDown/Up`→`volume-small-linear` / `volume-loud-linear`, `faceVeryBad…VeryGood`→`confounded-circle` / `sad-circle` / `expressionless-circle` / `smile-circle` / `emoji-funny-circle` (`-linear`), `calendar`→`calendar-linear`, `rocket`→`rocket-linear`, `plusSquare/minusSquare/xSquare`→`add-square` / `minus-square` / `close-square` (`-linear`), `pen`→`pen-linear`, `share`→`share-linear`, `play`→`play-linear`, `skipBack/Forward`→`skip-previous-linear` / `skip-next-linear` |
| `docs-icons.tsx` (hand-drawn) | `apps/storybook/src/helpers/docs-icons.tsx`; Fab, Icon button, Toggle button docs | 6 | `letter-linear`, `add-linear`, `trash-bin-minimalistic-linear`, `text-bold/italic/underline-linear` |
| Foundations › Icons "Local icons" (hand-drawn) | `apps/storybook/src/foundations/icons/icons.tsx` | 12 | story removed; the guide shows Solar |
| Other story SVGs | `avatar/display-icons.tsx` (5), `text-field-examples.tsx` (3), `checkbox-examples.tsx` (2), `copy-demo.tsx`, `table-api-demo.tsx`, `rating-examples.tsx`, `countdown-demo.tsx`, `divider-examples.tsx`, `carousel-examples.tsx`, `button-examples.tsx` | 17 paths | Solar Linear by meaning (ST2); `motion/owl-logo.tsx` and `chart-data.ts` are not icons |

## 5. Fonts
Checked on 2026-11-12 from `github.com/google/fonts` (`ofl/<family>/METADATA.pb` for license
folder, subsets and weights; the font file itself for the `name` table license, the GSUB
feature list and the advance widths of 0–9). "Tabular" = a `tnum` feature, or figures that
already share one width by default.

| Font | Style roles | License (folder · `name` 13) | Vietnamese | Weights | Tabular figures | Result |
|---|---|---|---|---|---|---|
| Nunito | Soft (all) | OFL · OFL 1.1 | yes | 200–1000 (variable) | default figures tabular (600 units each), no `tnum` | pass |
| Inter | Swiss, Minimal Mono | OFL · OFL 1.1 | yes | 100–900 (variable, `opsz`) | `tnum` | pass |
| Lexend | Bauhaus (all) | OFL · OFL 1.1 | yes | 100–900 | **none** (proportional, no `tnum`) | **fail** |
| IBM Plex Mono | Brutalism (all) | OFL · OFL 1.1 (RFN "Plex") | yes | 100–700 | monospaced | pass (headings max 700) |
| IBM Plex Sans | Corporate (all) | OFL · OFL 1.1 (RFN "Plex") | yes | 100–700 (variable, `wdth`) | default figures tabular, no `tnum` | pass |
| Space Grotesk | Neo-Brutalism (all) | OFL · OFL 1.1 | yes | 300–700 | `tnum` | pass (headings max 700) |
| Playfair Display | Editorial headings | OFL · OFL 1.1 (RFN) | yes | 400–900 | **none** (proportional; has `lnum`, `onum`) | **fail** (headings only) |
| Source Serif 4 | Editorial text | OFL · OFL 1.1 (RFN "Source") | yes | 200–900 (variable, `opsz`) | `tnum`, default tabular | pass |
| Be Vietnam Pro | Editorial labels | OFL · OFL 1.1 | yes | 100–900 (static files) | **none** (proportional) | **fail** (labels) |
| Manrope | Nordic (all) | OFL · OFL 1.1 | yes | 200–800 | `tnum` | pass |

Every font is SIL OFL 1.1 and covers the full Vietnamese set (all 134 precomposed letters checked
in `cmap`). Reserved Font Names only matter for modified copies; Owlky links fonts and bundles
none (D4).

**Failures and proposed replacements** (checked the same way; owner decision, Q1):
- **Lexend** (Bauhaus): numbers in tables, grids, pagination and clocks would not align.
  Proposed **Montserrat** (OFL, Vietnamese, `tnum`, 100–900, geometric). Alternative: Archivo
  (OFL, Vietnamese, `tnum`). Lexend Deca, League Spartan, Josefin Sans and Kumbh Sans also lack
  `tnum`; Jost and Sora lack Vietnamese.
- **Playfair Display** (Editorial headings): only headings with numbers (CountUp, stat cards) are
  affected. Proposed **Noto Serif Display** (OFL, Vietnamese, `tnum`, 100–900, high contrast
  serif), or keep Playfair and accept proportional figures in headings. Fraunces and Libre Bodoni
  lack `tnum`; Bodoni Moda and DM Serif Display lack Vietnamese.
- **Be Vietnam Pro** (Editorial labels): labels include Pagination, Badge and column headers.
  Proposed **Archivo** (OFL, Vietnamese, `tnum`, 100–900) or **Work Sans** (same checks), or
  keep Be Vietnam Pro for labels and set `--ok-font-family-label` back to the text font where
  numbers align.
- Plex Mono and Space Grotesk stop at 700: Brutalism and Neo-Brutalism headings use 700.

## 6. Removal list
For ST2 (code) and ST7 (docs). Generated files (`packages/mcp/manifest.json`,
`apps/docs-content/src/api/*.json`) follow by regeneration.

### `data-ok-preset`, `data-ok-font` and the preset APIs
| Area | Files |
|---|---|
| Tokens | `packages/tokens/src/presets.ts` (delete; keep `paletteTextFor` logic in the generator), `presets.test.ts` (delete), `css.ts` (preset scopes, `primaryPresetVariables`, `fontPresetVariables`, `presets` option, `--_ok-primary-text-*`), `index.ts` (exports), `types.ts` / `default-theme.ts` (`fontFamilySecondary` → `fontFamilyHeading`), `gradients.test.ts` and `tokens.test.ts` (preset and secondary-family cases), `README.md` |
| Styles | `packages/styles/src/theme.css` (`--font-display` → `--font-heading`), `components/illustration.css` (comment) |
| Core | `src/theme/theme-settings.ts` + `.test.ts` (`preset`, `font` → `style`, `density`, `surface`, `contrast`), `src/index.ts` (exports), `src/anatomy/parts.ts` (`data-ok-preset` entry → the four new attributes), `src/code-editor/theme.ts` + `.test.ts`, `src/map/map.ts`, `src/data-grid/grid-columns.ts` (observed attributes), `src/illustrations/illustrations.test.ts`, `README.md` |
| HTML / React | `packages/html/README.md`; React re-exports through core |
| Storybook | `.storybook/toolbar.tsx` and `preview.tsx` (Preset and Font menus → Style, Density, Surface, Contrast), `src/foundations/settings/settings.tsx` and `settings-docs.tsx`, `src/foundations/colors/palette.tsx` and `colors.stories.tsx`, `src/foundations/typography/typography.tsx` and `typography-docs.tsx`, `src/foundations/illustrations/illustrations-docs.tsx` |
| Docs content | `apps/docs-content/src/foundations/colors/colors-docs-examples.ts`, `colors-docs.tsx` |
| Website | `apps/website/src/app/layout.tsx`, `src/site/theme-settings.tsx`, `src/site/landing/theme-controls.tsx`, `src/content/sandbox.ts`, `src/content/get-started.ts`, `src/content/home.ts` (prose) |
| E2E | `e2e/tests/theme-settings.spec.ts`, `colors.spec.ts` (`preset:cyan`), `illustrations.responsive.spec.ts` (`preset:purple`), `helpers.ts` (globals example), `e2e/website/website.spec.ts` |
| Specs | `specs/components/code-editor.md`, `illustration.md`, `map.md` |
| Knowledge base | `CLAUDE.md`, `AGENTS.md` (preset gotchas: the `[data-ok-preset]` redeclaration rule becomes the resolver rule of ADR-0070 § 3), `.changeset/gradient-tokens.md` (unreleased: reword) |

### Lucide
| Where | What |
|---|---|
| `apps/storybook/scripts/check-docs-code.mjs` | the Lucide name list, the `declare module "lucide-react"` stub, the header comment; replace with a Solar name check against `@iconify-json/solar` |
| Docs pages (21 files) | `lucide-react` imports in `apps/docs-content/src/components/button/button-docs-examples.ts` and Storybook `badge`, `breadcrumbs`, `card`, `checkbox`, `fab`, `icon-button`, `label`, `lightbox`, `list`, `rating`, `snackbar`, `stepper`, `switch`, `tabs`, `text-field`, `toggle-button`, `tooltip`, `tree-view` docs, `foundations/icons/icons-docs.tsx`, `foundations/shadows/shadows-docs.tsx` |
| Library | `packages/react/src/organization-chart/organization-chart.tsx` (Lucide `chevron-down`, `zoom-in`, `zoom-out`, `scan`, `rotate-ccw` paths; HTML snippets carry them too) |
| Knowledge base | `AGENTS.md` › Writing documentation ("icons from `lucide-react`"), `docs/legal/inventory.md` and `assessment.md` (records: update, not delete) |

### Iconify sets other than Solar, and hand-drawn sets
| Where | What |
|---|---|
| `apps/storybook/package.json` | devDependencies `@iconify-json/eva`, `@iconify-json/logos`, `@iconify-json/vscode-icons` (remove); `@iconify-json/solar` moves to the root or `@owlky/core` devDependencies (icon generator); `@iconify-json/circle-flags` moves to the Phone input flags build (`@owlky/html`) |
| `apps/storybook/scripts/icons.mjs`, `src/foundations/icons/icon-data.json` | `eva`, `logos`, `vscode-icons`, `circle-flags` entries; `CURRENT_COLOR` (logos) |
| `src/foundations/icons/iconify.tsx` | `IconSetPrefix` keeps `solar` only |
| `src/foundations/icons/icon-demos.tsx`, `icons.stories.tsx` | stories **Material icons**, **Local icons**, **Social icons**, **File icons**, **Flag icons**; the Eva gallery in **Iconify icons** |
| `src/foundations/icons/icons.tsx` | local hand-drawn set (12) |
| `src/helpers/docs-icons.tsx` | hand-drawn docs icons (6) |
| `src/components/shared/demo-icon.tsx`, `demo-icons.json` | hand-drawn demo icons (58), and the snippets generated from them |
| Library | every hand-drawn component path of § 4 (`core/src/editor/icons.ts`, `core/src/map/icons.ts`, `core/src/chart/chart-toolbar.ts`, `core/src/gantt/gantt-render.ts`, `core/src/upload/upload-model.ts`, the React and HTML files listed there) |
| Notices | `packages/core/THIRD_PARTY_NOTICES.md` / `packages/html/THIRD_PARTY_NOTICES.md` gain Solar (CC BY 4.0) and, for the flags folder, Circle Flags (MIT); `docs/legal/*` records follow |

## 7. Owner's answers (2026-11-12, all approved as recommended)
1. Replace all three: Bauhaus → Montserrat, Editorial headings → Noto Serif Display, Editorial
   labels → Archivo.
2. Decorative dividers keep no minimum by default; 3:1 only in high contrast.
3. Checkbox box and radio ring come from tokens; Solar draws only the marks.
4. Approximate icons accepted (closest meaning, recorded in § 4).
5. The Map compass stays a component graphic.
6. The generator may round coordinates to 2 decimals if a budget breaks; the test compares
   rounded paths.
7. Minimal Mono keeps hues for status colors.

## 7a. Questions as asked
1. **Fonts without tabular figures:** replace Lexend (Bauhaus) with Montserrat, Playfair Display
   (Editorial headings) with Noto Serif Display, Be Vietnam Pro (Editorial labels) with Archivo,
   or keep any of them (§ 5)?
2. **Divider contrast:** decorative dividers have no minimum by default and reach 3:1 only in high
   contrast (ADR-0070 § 7). Should they reach 3:1 in every mode (Soft's soft dividers would get
   darker)?
3. **Selection controls:** Solar's `stop-linear` / `check-square-bold` / `minus-square-bold` are
   rounded squares with a fixed radius, and Solar has no "radio checked" glyph. Draw the
   checkbox box and radio ring from tokens (radius, border width: square in Swiss and Bauhaus)
   and use Solar only for the marks (`check-linear`, `minus-linear`)?
4. **Approximate icons:** text alignment (Solar has no text-align set), density, pivot, drag
   grip, terrain, thumbnails, rotate and fit (§ 4, "approx."). Accept, or allow Line Duotone or
   another Solar drawing per case?
5. **Map compass:** the needle rotates with the bearing and colors its north half. Keep it as a
   component graphic (not an icon), or use `compass-linear` and rotate the whole icon?
6. **Icon bytes:** Solar's paths are longer than today's drawings (about 80 icons). If a size
   budget breaks in ST2, may the generator round coordinates (the path test then compares rounded
   paths)?
7. **Minimal Mono status colors:** keep hues for success / warning / error / info (ADR-0070 § 1),
   or greys with icons only?
