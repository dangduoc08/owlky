---
"@owlky/tokens": minor
"@owlky/styles": minor
---

Design styles replace the old color and font presets: nine styles (Soft by default, Swiss, Bauhaus, Brutalism, Neo-Brutalism, Editorial, Minimal Mono, Corporate, Nordic) set the palette, fonts, shapes, lines, shadows and label case together, and brand colors go through `createTheme({ style, brand })` or `applyThemeBrand()`. Storybook has a Foundations › Styles guide, and the Icons guide covers Solar, the component icon set. Editorial now draws a top rule on in-flow surfaces (Paper, Card) instead of a full frame: Paper writes its edge with longhands, so `--ok-surface-border-style` may name each side (`solid none none`), while dialogs, drawers and map controls keep the whole edge. `StyleDefinition.surfaceBorder` takes `sides: "top"`. Walktour step titles follow the style's heading case and tracking (`--ok-heading-text-transform`, `--ok-heading-letter-spacing`), like Dialog titles.
