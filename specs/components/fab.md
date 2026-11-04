# Fab

Reference: Minimal UI kit "Buttons" page, section "Fab button" (content only). Created with `/component`.

## Purpose
A floating action button: the primary action of a screen, round (icon) or extended (icon + label).

## Anatomy
```
button[type="button"][data-mt-fab][data-mt-variant][data-mt-color][data-mt-size]
    [data-mt-extended]? [data-mt-animate]? [aria-label (round)]
  svg[aria-hidden="true"]
  text (extended only)
```

## Options
| HTML | React | Values | Default |
|---|---|---|---|
| `data-mt-variant` | `variant` | `contained` `outlined` `soft` | `contained` |
| `data-mt-color` | `color` | `default` `inherit` `primary` `secondary` `info` `success` `warning` `error` `black` `white` | `default` |
| `data-mt-size` | `size` | round `sm` 40 · `md` 48 · `lg` 56; extended `sm` 36 · `md` 40 · `lg` 48 | `md` |
| `data-mt-extended` | `extended` | boolean: pill with icon + label | off |
| `data-mt-animate` | `animate` | boolean: scale on hover / press | off |

| Variant | Rest | Hover (`hover: hover`) |
|---|---|---|
| contained | bg `main` (default: grey-300, inherit: `--mt-inherit-main`), text `contrast`, shadow `--mt-c-shadow` (z8 for default / inherit / black / white) | bg `hover`, no shadow |
| outlined | border `channel` 48 % (default / inherit 32 %), text `main` (default: secondary text) | bg 8 % |
| soft | bg `channel` 16 %, text `text` | bg 32 % |
| disabled | `--mt-action-disabled` text, `--mt-action-disabled-bg` fill or border, no shadow | — |

## Behavior
Native `<button>` — CSS only, no runtime. Positioning (fixed / absolute) is up to the page.

## Keyboard
Native: `Enter` / `Space` activate.

## Accessibility
Round fabs need `aria-label`; extended fabs are named by their label. Icons are `aria-hidden`.
Colors follow the reference (ADR-0014); fabs are exempt from axe `color-contrast` except soft.

## Responsive
Same size at every breakpoint; labels don't wrap.

## Parity notes
Visible focus outline; CSS-only animate (see Icon button).
