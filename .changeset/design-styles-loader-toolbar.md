---
"@owlky/tokens": minor
"@owlky/styles": minor
"@owlky/core": minor
"@owlky/html": minor
---

Design styles on the CDN and in Tailwind. `owlky.js` and `owlky.mjs` add a style's sheet when the page uses it: an element with `data-ok-style="nordic"`, in the markup or set later (such as by `applyThemeSettings({ style })`), loads `owlky-style-nordic.css` from the folder of `owlky.css`, once, right after it. A sheet the page links itself is not added again. `data-ok-styles` on the script serves the sheets from another folder, and `data-ok-styles="none"` turns this off. `Owlky.load("style:nordic")` and `data-ok-preload="style:nordic"` load a sheet ahead of use. Tokens: `styleSheetCss(createTheme({ style, brand, fonts }))` writes a style's opt-in sheet, such as a branded Nordic, and `themeToCss()` no longer needs `base` for Minimal Mono. Tailwind: `contrast-high:` also matches `data-ok-contrast="system"` while the user asks for more contrast, the new `surface-contrast:` variant matches `data-ok-surface="contrast"`, and `tracking-heading` / `tracking-label` read the style's tracking.
