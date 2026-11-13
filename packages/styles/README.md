# @owlky/styles

Prebuilt CSS for [Owlky](../../README.md). No Tailwind needed to consume it.

| Import                                                       | Contents                                                 |
| ------------------------------------------------------------ | -------------------------------------------------------- |
| `@owlky/styles/owlky.css` (`.min.css`) | tokens + the light components (core, about 29 kB gzip) |
| `@owlky/styles/owlky-all.css` (`.min.css`) | tokens + every component (about 63 kB gzip)          |
| `@owlky/styles/components/<name>.css` | one component (also load `tokens.css`, and `icon.css` when it draws icons), e.g. `button.css` |
| `@owlky/styles/styles/<style>.css` (`.min.css`) | a design style other than the default Soft, such as `swiss.css` or `neo-brutalism.css` (tokens only, about 2.6 kB gzip); load it after `owlky.css` and set `data-ok-style="<style>"` on any element |
| `@owlky/styles/tokens.css`                        | `--ok-*` design tokens, light/dark                       |
| `@owlky/styles/base.css`                          | optional page base (font, colors)                        |
| `@owlky/styles/theme.css`                         | Tailwind v4 theme mapping (`bg-primary`, `text-h1`, `font-heading`, `shadow-z8`, `shadow-elevation-<n>`, …) |

All component rules are zero-specificity (`:where`) in `@layer components`, so your classes,
utilities and plain CSS always win.
