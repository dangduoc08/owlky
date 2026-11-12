---
"@owlky/core": minor
"@owlky/react": minor
"@owlky/html": minor
---

Add one entry per component: `@owlky/core/<name>`, `@owlky/react/<name>` and `@owlky/html/<name>` (for example `@owlky/react/data-grid`, `@owlky/react/date-picker` for the whole picker family, `@owlky/html/dialog`). Each exports what the package's main entry exports for that component, so `import { Button } from "@owlky/react/button"` and `import { Button } from "@owlky/react"` give the same bundle in tree-shaking bundlers. The per-component entries help bundlers and dev servers that don't tree-shake. The main entries stay. The opt-in entries keep their names (`@owlky/core/editor`, `@owlky/html/map`…). HTML entries export the runtime definitions and register nothing. Stylesheets already have `@owlky/styles/components/<name>.css`.
