---
"@owlky/core": minor
"@owlky/html": minor
"@owlky/react": minor
---

Option schemas no longer carry their descriptions at run time. The built schemas keep names, kinds, attributes, defaults and value lists, and every `description` is `""`. The descriptions ship in `@owlky/core/option-docs.json` (`{ "<schema>": { "<option>": { "description" } } }`): pass it to the new `describeOptions(schema, docs)` to get a documented schema. `OptionBase.description` is optional in the types.

Smaller downloads: `owlky.js` drops from 45.2 kB to 40.5 kB gzip, and the CDN files drop by about 23 kB gzip in all (lazy modules and their shared chunks included). A light HTML page drops from 107.9 kB to 103.2 kB, a page with a Data grid from 246.5 kB to 233.7 kB. A React Button-only build drops from 8.3 kB to 7.9 kB, and a DataGrid build from 206.3 kB to 193.3 kB. `motionVariants` is typed `readonly MotionVariant[]` instead of a tuple.
