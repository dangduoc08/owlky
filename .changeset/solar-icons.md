---
"@owlky/core": minor
"@owlky/react": minor
"@owlky/html": minor
"@owlky/styles": minor
---

Component icons are Solar Linear icons by 480 Design (CC BY 4.0, credited in `THIRD_PARTY_NOTICES.md`), with Bold for filled state glyphs (rating star, avatar placeholder, map pin). `@owlky/core` exports them as data (one export per icon, such as `closeLinear`, generated from `@iconify-json/solar`) with `createIcon`, `iconAttributes` and `iconTree`; every component icon renders as `svg[data-ok-icon="<name>"]` with no `stroke-width` attribute, and the new `icon.css` sets its stroke from `--ok-icon-stroke` (1.5). Checkbox boxes and radio rings are now drawn by the stylesheet (`data-ok-checkbox-box`, `data-ok-radio-ring`; the checkbox mark is an `svg[data-ok-checkbox-mark]`), so their radius and stroke follow the tokens. Removed: the hand-drawn and Lucide-copied icon paths, `UPLOAD_FILE_ICON` (files without a thumbnail use `fileLinear`), the Map compass halves in `mapIcons` (now `mapCompass`), and the path strings of `editorIcons` and `mapIcons` (now icon data).
