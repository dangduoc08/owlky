# Icon button

Reference: Minimal UI kit "Buttons" page, section "Icon button" (content only). Created with `/component`.

## Purpose
An action shown only as an icon (toolbar, card actions). For text actions use Button.

## Anatomy
```
button[type="button"][data-mt-icon-button][data-mt-color][data-mt-size][data-mt-animate]?[aria-label]
  svg[aria-hidden="true"]            (any decorative SVG or img)
```

## Options
| HTML | React | Values | Default |
|---|---|---|---|
| `data-mt-color` | `color` | `default` `inherit` `primary` `secondary` `info` `success` `warning` `error` `black` `white` | `default` |
| `data-mt-size` | `size` | `sm` 28px (icon 18) · `md` 36px (icon 20) · `lg` 48px (icon 24) | `md` |
| `data-mt-animate` | `animate` | boolean: scale 1.09 on hover, 0.97 while pressed | off |
| `aria-label` | `aria-label` | required accessible name | — |

`default` = secondary text color, `inherit` = primary text color, palette colors = `main`.
Unknown values fall back to the defaults (`iconButtonAttributes()` and CSS).

## States
`:hover` (hover-capable devices: background `channel` 8 %, `--mt-action-hover` for default /
inherit), `:focus-visible` (2px outline), `:disabled` (`--mt-action-disabled`), `:active` (animate).

## Behavior
Native `<button>` — CSS only, no runtime. Circular (`--mt-radius-full`), transparent background.
`data-mt-animate` transitions `transform`; `prefers-reduced-motion` disables the scale.

## Keyboard
Native: `Enter` / `Space` activate.

## Accessibility
Name from `aria-label` (or `aria-labelledby`); the icon is `aria-hidden`. Every size is
≥ 24×24 CSS px (WCAG 2.5.8).

## Responsive
Same size at every breakpoint.

## Parity notes
Visible focus outline (the reference has none). The reference's "With animate" uses an
animation library; here it is plain CSS.
