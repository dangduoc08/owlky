---
"@owlky/tokens": minor
"@owlky/styles": minor
"@owlky/html": minor
---

Design styles: the Editorial and Minimal Mono styles as opt-in sheets. Load `@owlky/styles/styles/editorial.css` (CDN `owlky-style-editorial.min.css`) or `minimal-mono.css` after `owlky.css` and set `data-ok-style` on any element. Editorial is flat and square: Noto Serif Display 900 headings, Source Serif 4 text, Archivo labels in capitals, 1px ink edges on surfaces, a rose accent on warm greys (about 2.7 kB gzip). Minimal Mono uses greys for the primary and secondary colors, with a near-black primary in light mode and a near-white one in dark mode, radius 8 / 14px, soft grey shadows and Inter (about 2.3 kB gzip). Tokens export `editorial` and `minimalMono`; a style definition can list `ink` colors (`Theme.darkPalette`), and `themeToCss()` takes a `base` theme for their sheets. Dialog titles now follow the style's heading case and letter spacing.
