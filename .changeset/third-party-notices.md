---
"@owlky/core": patch
"@owlky/html": patch
"@owlky/react": patch
"@owlky/styles": patch
"@owlky/tokens": patch
---

Add `THIRD_PARTY_NOTICES.md` to `@owlky/html` and `@owlky/core` with the license and copyright notices of the third-party code their `dist` folders bundle (Tiptap and ProseMirror, the unified ecosystem, libphonenumber-js, MapLibre GL JS, Monaco Editor and the code it bundles). The self-hosted `dist/monaco/` folder now also carries Monaco's `LICENSE` and `ThirdPartyNotices.txt`. Package descriptions, keywords and READMEs no longer name the design reference, and the MCP manifest drops links to it.
