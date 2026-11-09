---
"@owlky/tokens": minor
"@owlky/core": minor
"@owlky/styles": minor
"@owlky/react": minor
"@owlky/html": minor
---

Add Illustrations (ADR-0040): 16 original, theme-aware illustrations (error 404, 403 and 500, no connection, empty content, no results, maintenance, coming soon, sign in, email sent, reset password, welcome, upgrade, order complete, upload and an avatar shape). Each one is data in the new `@owlky/core/illustrations` entry, one export per picture, whose shapes name a tone that `illustration.css` maps to theme tokens, so pictures follow light and dark mode, nested themes, presets and the `color` option. React: `Illustration` (`illustration`, `color`, `size`, `title`). HTML: inline SVG snippets, and the opt-in `owlky-illustrations.js` / `@owlky/html/illustrations` runtime (or `createIllustration([…])`) that draws named placeholders and applies `data-ok-size`. New tokens `--ok-illustration-skin-light`, `--ok-illustration-skin-medium` and `--ok-illustration-skin-deep` (`Theme.illustration.skin`). The Upload's drop zone now shows the set's `upload` illustration (same parts and API).
