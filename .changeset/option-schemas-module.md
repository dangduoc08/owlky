---
"@owlky/core": patch
---

`optionSchemas` (every option schema by name) moves out of Link's anatomy module, so a bundle that uses Link no longer keeps every schema and the engines they import (about 70 kB gzip on the docs website's pages). It stays exported from `@owlky/core`; `@owlky/core/link` no longer re-exports it.
