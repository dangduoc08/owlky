---
"@owlky/core": minor
"@owlky/react": minor
"@owlky/styles": minor
"@owlky/html": minor
---

Phone input image flags (ADR-0070 section 9). The new option `flags="image"` / `data-ok-flags="image"` (default `emoji`, no bytes) draws a round Circle Flags picture (MIT) instead of the emoji, which Windows shows as two letters. Each flag is a decorative lazy `<img data-ok-phone-input-flag-image alt="">` in the country select and in every option. The pictures are separate files, one per lowercase country code, in the new `@owlky/html/dist/flags/` folder (with the set's license) that you can host yourself. `flagsPath` / `data-ok-flags-path` names the folder; pages that load the CDN bundle find it next to `owlky.js`, and without a folder the flags stay emoji. Core: `phoneFlagFolder` and `phoneFlagSource` (only `<folder><code>.svg` with a two-letter code, other URL schemes are refused) in `@owlky/core`, also from `@owlky/core/phone`. `owlky.js` and `owlky-phone.js` don't contain the flags.
