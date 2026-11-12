---
"@owlky/tokens": minor
"@owlky/styles": minor
"@owlky/core": minor
"@owlky/react": minor
"@owlky/html": minor
---

Theme presets and font presets are removed (design styles replace them, ADR-0070): no more `data-ok-preset` or `data-ok-font` scopes in the stylesheet, and `@owlky/tokens` no longer exports `primaryPresets`, `primaryPresetNames`, `PrimaryPreset`, `fontFamilyPresets`, `fontFamilyPresetNames`, `FontFamilyPreset`, `primaryPresetVariables`, `fontPresetVariables`, `paletteTextFor` or the `presets` option of `themeToCss()`. `applyThemeSettings`, `readThemeSettings` and `normalizeThemeSettings` now take `{ mode, fontSize }` only; stored `preset` and `font` values are ignored. Code editor, Map and Data grid runtimes watch `data-ok-theme` only. A brand color or font stays possible: override the public tokens (`--ok-palette-primary-*`, `--ok-font-family`, `--ok-font-family-heading`) or build a theme with `createTheme()`.
