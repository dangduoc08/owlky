---
"@owlky/core": minor
"@owlky/styles": minor
"@owlky/react": minor
"@owlky/html": minor
"@owlky/mcp": minor
---

Image `ratio` takes any `width/height` (`"16/10"`, `"4/1"`) or a number (`1.6`) besides its 11 named ratios. The value is written as given in `data-ok-ratio`; React writes `--_ok-image-ratio` in `style` and the HTML runtime through CSSOM, so without JavaScript such a picture keeps its own ratio. Core adds `imageRatio()`, `imageStyle()` and `isStyleValue()`; style options may declare a `pattern` of further valid values, which `validate_markup` accepts.
