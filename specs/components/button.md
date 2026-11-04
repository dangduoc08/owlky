# Button

Reference: Minimal UI kit "Buttons" page (content only). Created with `/component`.

## Purpose
Trigger an action (`<button>`) or navigate (`<a href>`) with the button styling.

## Anatomy
```
(button[type="button"] | a[href])[data-mt-button][data-mt-variant][data-mt-color][data-mt-size]
    [data-mt-full-width]? [data-mt-loading][data-mt-loading-position][aria-busy="true"][disabled]?
  span[data-mt-button-icon="start"][aria-hidden="true"]?  › svg[aria-hidden="true"]
  span[data-mt-button-loader][aria-hidden="true"]?        › span[data-mt-button-spinner] | text
  span[data-mt-button-label]                              (always; carries the accessible name)
  span[data-mt-button-icon="end"][aria-hidden="true"]?    › svg[aria-hidden="true"]
```
Visual order is set by CSS `order`: start icon, loader (start), label, loader (end), end icon.

## Options
| HTML | React | Values | Default |
|---|---|---|---|
| `data-mt-variant` | `variant` | `contained` `outlined` `text` `soft` | `text` |
| `data-mt-color` | `color` | `inherit` `primary` `secondary` `info` `success` `warning` `error` `black` `white` | `inherit` |
| `data-mt-size` | `size` | `sm` 30px · `md` 36px · `lg` 48px · `xl` 56px | `md` |
| `data-mt-full-width` | `fullWidth` | boolean | off |
| `data-mt-loading` + `aria-busy="true"` + `disabled` | `loading` | boolean | off |
| `data-mt-loading-position` | `loadingPosition` | `center` `start` `end` | `center` |
| loader content | `loadingIndicator` | spinner or text (e.g. `Loading…`) | spinner |
| `<a href>` | `href` | URL, passed through untouched | — |
| icon wrappers | `startIcon` / `endIcon` | ReactNode | — |

React renders all modifiers explicitly (`buttonAttributes()`); unknown values fall back to the
defaults in both `buttonAttributes()` and CSS. `disabled` (or `loading`) on a link removes `href`
and sets `aria-disabled="true"`.

## Tokens
Radius `--mt-radius-md`; heights and paddings are multiples of `--mt-spacing`; font
`--mt-font-size-sm|md|lg` + `--mt-typography-button-*`; colors through the `--mt-c-*` bindings,
with `--mt-c-channel` for translucent fills (`rgb(var(--…-channel) / α)` — never `color-mix()` in
component CSS); hover shadow `--mt-c-shadow` (`--mt-shadow-z8` for inherit / black / white).

| Variant | Rest | Hover (`hover: hover` only) |
|---|---|---|
| contained | bg `main`, text `contrast` | bg `hover` (`dark`; 72 % for black/white) + `--mt-c-shadow` |
| outlined | border `channel` 48 % (inherit: grey-500 32 %), text `main` | bg 8 %, border `currentColor` + 0.75px ring |
| text | text `main` | bg 8 % |
| soft | bg `channel` 16 %, text `text` | bg 32 % |
| disabled | text `--mt-action-disabled`; bg `--mt-action-disabled-bg` (contained / soft) or border (outlined) | — |

## Responsive
Same size per `data-mt-size` at every breakpoint; labels don't wrap (`nowrap`); rows of buttons
wrap. Use `fullWidth` for full-width mobile actions. Every size is ≥ 24×24 CSS px (WCAG 2.5.8).

## Behavior
Native element only — **CSS only, no runtime**. Loading uses native `disabled` (approved
decision): the button leaves the tab order while loading.

## Keyboard
Native: `Enter` / `Space` activate a button; `Enter` follows a link.

## Accessibility
- Name = label text. Icons and the loader are `aria-hidden`; while loading in the center the
  label is made transparent, never hidden, so the name stays. Icon-only buttons need `aria-label`.
- `aria-busy="true"` while loading; 2px focus outline (`:focus-visible`), offset 2px.
- Colors follow the reference (ADR-0014): white on `main` fills (dark on warning), `main` text
  for outlined / text; soft uses the AA `-text` tone. `black` / `white` are for light / dark
  surfaces.

## Differences from the reference (intentional)
Visible focus outline (the reference has none); loader `aria-hidden` + `aria-busy` (the reference
nests a `progressbar` inside the button, where it is presentational); "Link" is a real `<a href>`;
consistent sizes across variants (the reference's soft `sm` / `lg` differ slightly); black / white
shown on matching surfaces. Colors match the reference (ADR-0014); strict AA is an opt-in override.

## Not included (separate components)
Icon button, Fab, Button group, Toggle button — follow-up `/component` runs.
