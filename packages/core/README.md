# @owlky/core

Framework-free behavior and anatomy shared by `@owlky/react` and
`@owlky/html`: focus utilities, overlay layer stack, scroll lock,
feature detection and `data-ok-*` attribute maps. You normally don't install this directly.

Entry points: `@owlky/core` (everything above, side-effect free), `@owlky/core/editor`
(`createEditorController`, the only path to Tiptap; not re-exported from `@owlky/core`, ADR-0023)
and `@owlky/core/code-editor` (`createCodeEditorController`, `createDiffEditorController`, the
Owlky Monaco themes and `loader`, the only path to Monaco; it imports `monaco-editor` on demand,
ADR-0034).

Date library adapters for the pickers (ADR-0030) are opt-in entry points that take your own copy
of the library, so Owlky adds no dependency (the libraries are optional peer dependencies):

| Entry point | Factory |
|---|---|
| `@owlky/core/adapters/dayjs` | `createDayjsAdapter(dayjs)` (zones with Day.js's `utc` and `timezone` plugins) |
| `@owlky/core/adapters/date-fns` | `createDateFnsAdapter({ TZDate })` (`TZDate` from `@date-fns/tz` for zones) |
| `@owlky/core/adapters/luxon` | `createLuxonAdapter(DateTime)` |
| `@owlky/core/adapters/moment` | `createMomentAdapter(moment)` (zones with `moment-timezone`) |

Each factory takes `{ calendar }` for Jalali or Hijri builds (`"persian"`, `"islamic-umalqura"`).
Picker locale packs (`pickersFrFR`, `pickersDeDE`, `pickersEsES`, `pickersJaJP`, `pickersZhCN`,
`pickersFaIR`, `pickersArSD`) are exported from `@owlky/core`.

Theme settings (ADR-0017, re-exported by `@owlky/react` and `@owlky/html`):

```ts
import { applyThemeSettings, readThemeSettings } from "@owlky/core";

// Validated (unknown values → default); stored only because a storage is passed.
applyThemeSettings(readThemeSettings({ storage: localStorage }), { storage: localStorage });
applyThemeSettings({ preset: "cyan", font: "inter", fontSize: 14, mode: "dark" }, { storage: localStorage });
```

`resetThemeSettings(options)` restores the defaults; `normalizeThemeSettings(input)` validates
untrusted input; `target` applies the attributes to a nested scope (the font size is page-wide).
