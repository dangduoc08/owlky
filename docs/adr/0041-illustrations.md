# ADR-0041: Illustrations — a theme-aware set as data in core, tones mapped to tokens

**Status:** Accepted (2026-11-09)

**Note (2026-11-13, ADR-0068 S6):** `owlky-illustrations.js` was removed before 0.1.0. On a CDN page, `owlky.js` loads this component from its lazy module (`modules/illustration.js`) when the page holds one; the text below keeps the original decision.

## Context
The reference dashboard uses flat illustrations on error pages (403, 404, 500), maintenance and
coming-soon pages, empty states, the upload zone, checkout, sign-in, verify / reset password and
the dashboard welcome card, plus a curved avatar shape on profile covers. Owlky had one picture
(Upload's drop zone, ADR-0037) with its own tone rules in `upload.css`. The owner approved a
foundation "Illustrations" (2026-11-09): a theme-aware set used across the project, drawn by us
plus people from Humaaans.

Licenses decide where the art can come from:
- **Minimals Pro** art is part of a paid template: no redistribution in a library. Minimal's free
  edition (MIT) has only a 404 and a dashboard picture.
- **unDraw** allows use in projects but forbids redistributing the illustrations in a competing
  library or illustration pack.
- **Humaaans** (Pablo Stanley) is CC0 1.0, checked on https://www.humaaans.com/ on 2026-11-09
  ("Free for commercial or personal use. CC0 Public Domain License"). Its only download is a
  Gumroad checkout (https://gum.co/humaaans, Sketch / Figma / Studio files) that asks for a
  purchase with an e-mail address; the other link is Blush, which the owner excluded. We could not
  download the files without that checkout, so no Humaaans parts are used: the people are drawn by
  us too, in the same flat style.

## Decision
1. **Illustrations are data in core.** An illustration is `{ name, viewBox, nodes }`, a tree of
   SVG nodes (`IllustrationNode`: `tag`, `tone`, `stroke`, `attrs`, `children`) like the Chart's
   `ChartNode` (ADR-0024). The set lives in the opt-in entry `@owlky/core/illustrations`, one
   export per picture (`error404`, `emptyContent`, …) plus `illustrations` (all), so bundlers keep
   only what an app imports (`check:size` bundles each export alone: 0.2–1.1 kB gzip). The node
   types, the allowlists and the helpers (`illustrationNodeAttributes`, `illustrationStyle`,
   `illustrationAria`) are in the main entry.
2. **Tones, not colors.** Every shape carries `data-ok-tone` from a closed list: brand tones
   (`lighter` … `darker`) from the `color` option's palette (primary by default), accent tones
   from the warning palette, scheme-aware neutrals (`paper`, `neutral`, `outline`, `line`,
   `shadow`, `shade`, `ink`), fixed greys and white, and three skin tones. `illustration.css` maps
   them to `--ok-*` tokens with zero-specificity `:where()` rules (ADR-0003); brand tones read
   private variables declared on the root, so a root inside a `data-ok-preset` / `data-ok-theme`
   scope takes that scope's colors (ADR-0017). `data-ok-stroke` paints a tone as an outline.
   The data holds no colors, ids, references, styles or scripts (tested).
3. **New tokens: skin tones.** `Theme.illustration.skin` (`light`, `medium`, `deep`) →
   `--ok-illustration-skin-*`, customizable with `createTheme`. Decorative only, never text.
4. **One component, two owners.** React `Illustration` takes the data (`illustration={error404}`)
   rather than a name, so it tree-shakes and accepts custom art; `color`, `size`, `title` (a
   name: `role="img"`), decorative by default (`aria-hidden`, `focusable="false"`). Per-picture
   components were rejected: 16 more exports that only wrap the data. HTML snippets are the full
   inline SVG, generated from React (`apps/storybook/scripts/illustration-snippets.mjs`) and
   working without JavaScript. The HTML runtime `illustration` (`createIllustration(set)`) builds
   named placeholders (`<svg data-ok-illustration="error-404">`) with `createElementNS` and turns
   `data-ok-size` into `--_ok-illustration-size` through CSSOM (strict CSP).
5. **Opt-in bundles.** The runtime with every picture is about 10.3 kB gzip as an IIFE, too much
   for `owlky.js` (155 kB budget at 160): it ships as `owlky-illustrations.js` /
   `@owlky/html/illustrations`, like the Editor (ADR-0023), budgeted at 12 kB. `createIllustration`
   is exported from `@owlky/html` for smaller sets.
6. **Composition.** Upload's drop zone renders the `upload` illustration with its own part
   attribute (`data-ok-upload-illustration`, sized by `upload.css`); its tone rules moved to
   `illustration.css`. New decorative art goes into the set, never an `<img>` of a themed picture.

## Consequences
- Every picture follows light / dark mode, nested themes, presets and six palettes with no
  JavaScript (snippets) and no network requests.
- Without the runtime, `data-ok-size` does nothing in HTML: authors set a `width` attribute or CSS
  width (documented). `ink` uses `light-dark()` (grey 800 on browsers without it).
- `owlky.css` grows by about 0.5 kB gzip (budget 48 kB).
- Adding a picture: a data file in `packages/core/src/illustrations/data/`, its export and list
  entry, a story group, then regenerate the snippets; the core test validates elements,
  attributes and tones.
- Replacing the art later (for example with licensed people) changes only the data files.

## Amendment (2026-11-09): style guide and parts
Additive, approved by the owner: the set's visual grammar is written down in
`docs/illustrations-style.md` (measured on the 16 pictures). The repeated details are pure
functions in `packages/core/src/illustrations/parts.ts`, exported from `@owlky/core/illustrations`
for custom art (`backdrop`, `groundShadow`, `sparkle`, `dot`, `cloud`, `plant`, `lines`, `paper`,
`screen`, `person`), and every picture composes them (the rendered markup did not change). A part
marks its first node with `IllustrationNode.part`, which renderers ignore; `style.test.ts` counts
parts to enforce the guide. Tree shaking: one picture bundles only itself and the parts it uses
(0.7–1.6 kB gzip); `check:size` now checks that a picture's bundle holds no other picture instead
of comparing it with a quarter of the set. New pictures go through `/illustration`; the **All**
story is the contact sheet.
