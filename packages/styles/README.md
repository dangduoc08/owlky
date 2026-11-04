# @minimal-tailwind/styles

Prebuilt CSS for [Minimal Tailwind](../../README.md). No Tailwind needed to consume it.

| Import                                                       | Contents                                                 |
| ------------------------------------------------------------ | -------------------------------------------------------- |
| `@minimal-tailwind/styles/minimal-tailwind.css` (`.min.css`) | tokens + all components                                  |
| `@minimal-tailwind/styles/components/<name>.css`             | one component (also load `tokens.css`)                   |
| `@minimal-tailwind/styles/tokens.css`                        | `--mt-*` design tokens, light/dark                       |
| `@minimal-tailwind/styles/base.css`                          | optional page base (font, colors)                        |
| `@minimal-tailwind/styles/theme.css`                         | Tailwind v4 theme mapping (`bg-primary`, `shadow-z8`, …) |

All component rules are zero-specificity (`:where`) in `@layer components`, so your classes,
utilities and plain CSS always win.
