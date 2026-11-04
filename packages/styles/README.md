# @minimal-tailwind/styles

Prebuilt CSS for [Minimal Tailwind](../../README.md). No Tailwind needed to consume it.

| Import                                                       | Contents                                                 |
| ------------------------------------------------------------ | -------------------------------------------------------- |
| `@minimal-tailwind/styles/minimal-tailwind.css` (`.min.css`) | tokens + all components                                  |
| `@minimal-tailwind/styles/tokens.css`                        | `--mt-*` design tokens, light/dark                       |
| `@minimal-tailwind/styles/base.css`                          | optional page base (font, colors)                        |
| `@minimal-tailwind/styles/theme.css`                         | Tailwind v4 theme mapping (`bg-primary`, `text-h1`, `font-display`, `shadow-z8`, `shadow-elevation-<n>`, …) |

`components/<name>.css` (one component, plus `tokens.css`) is published once components exist.

All component rules are zero-specificity (`:where`) in `@layer components`, so your classes,
utilities and plain CSS always win.
