---
"@owlky/tokens": minor
"@owlky/styles": minor
---

Gradient tokens: `--ok-gradient-<color>` (a fill from the `light` to the `main` shade), `--ok-gradient-<color>-text` (from the theme's text tone to `darker` in light themes or `lighter` in dark themes, every stop AA on the theme's backgrounds) and `--ok-gradient-paper` (the theme's paper at 90 % with soft info and error glows, for glass surfaces with a `backdrop-filter`). They are `background-image` values built from the palette: the text and paper ones follow `data-ok-theme`, and `createTheme()` themes produce them too. Foundations › Colors adds a **Gradient** story and guide sections for gradient text, borders, backgrounds and paper.
