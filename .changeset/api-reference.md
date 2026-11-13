---
"@owlky/core": minor
"@owlky/react": patch
"@owlky/html": minor
---

Add a complete API reference. Every docs page ends with an "API reference" section that lists every React prop, `data-ok-*` attribute (options, parts, states, values and triggers), event with its `detail`, instance method, type and CSS variable, for the component and each of its parts. In HTML, each runtime now declares its events (`EventSpec`, exported as `EventMap`, `EventSpec` and `AnyEvents` types; `defineComponent<Instance, Events>` types `emit`), and every instance member is documented. The MCP server's `get_component` returns the reference too, and takes `part` to return one React component or HTML part.
