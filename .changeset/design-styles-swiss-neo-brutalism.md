---
"@owlky/tokens": minor
"@owlky/styles": minor
"@owlky/html": minor
---

Design styles: the Swiss and Neo-Brutalism styles as opt-in sheets. Load `@owlky/styles/styles/swiss.css` (CDN `owlky-style-swiss.min.css`) or `neo-brutalism.css` after `owlky.css` and set `data-ok-style` on any element; each sheet holds tokens only (about 2.6 kB gzip) and nests with the other axes. Styles draw depth by treatment (`soft`, `subtle`, `flat`, `hard`): Swiss is flat (1px ink lines, no shadows), Neo-Brutalism hard (2px ink borders, offset shadows without blur). `--ok-elevation-<n>` now aliases the nearest named shadow (`--ok-shadow-z1` … `z24`), so elevations follow every style. Tokens: `Theme.shadowTreatment` is new, `Theme.elevation` is a list of shadow names, `elevationLayers()` and `StyleDefinition.shadowLayers` are removed, `StyleDefinition` gains `fontWeight` and `borderWidth`, and `swiss`, `neoBrutalism`, `treatmentShadows()`, `elevationShadows` and `defaultStyleName` are exported.
