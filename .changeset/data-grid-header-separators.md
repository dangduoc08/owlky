---
"@owlky/styles": patch
---

Data grid: the separators between header cells now draw (their rule had the pseudo-element inside `:where()`, which made it invalid), hidden in header filter rows and with `showColumnVerticalBorder`.
