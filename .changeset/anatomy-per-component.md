---
"@owlky/core": minor
---

Option schemas are one module per component (`anatomy/<name>.js`), re-exported from `@owlky/core` as before. An app that imports one component now bundles only the schemas it uses: a React Button-only build drops from 10.2 kB to 8.3 kB gzip (it kept parts of every schema before), and each opt-in CDN script (`owlky-phone.js`, `owlky-map.js`…) is about 2 kB smaller. No API change.
