# @owlky/core

Framework-free behavior and anatomy shared by `@owlky/react` and
`@owlky/html`: focus utilities, overlay layer stack, scroll lock,
feature detection and `data-ok-*` attribute maps. You normally don't install this directly.

Entry points: `@owlky/core` (everything above, side-effect free) and `@owlky/core/editor`
(`createEditorController`, the only path to Tiptap; not re-exported from `@owlky/core`, ADR-0023).

Theme settings (ADR-0017, re-exported by `@owlky/react` and `@owlky/html`):

```ts
import { applyThemeSettings, readThemeSettings } from "@owlky/core";

// Validated (unknown values → default); stored only because a storage is passed.
applyThemeSettings(readThemeSettings({ storage: localStorage }), { storage: localStorage });
applyThemeSettings({ preset: "cyan", font: "inter", fontSize: 14, mode: "dark" }, { storage: localStorage });
```

`resetThemeSettings(options)` restores the defaults; `normalizeThemeSettings(input)` validates
untrusted input; `target` applies the attributes to a nested scope (the font size is page-wide).
