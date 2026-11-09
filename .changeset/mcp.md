---
"@owlky/mcp": minor
---

New package `@owlky/mcp` (ADR-0046): a Model Context Protocol server over stdio (`npx -y @owlky/mcp`) that answers coding agents from a generated manifest shipped in the package: `list_components`, `get_component` (options table, anatomy, states, keyboard, accessibility, events, required parts), `get_examples` (HTML and React code of every story), `search_tokens` (`--ok-*` variables and Tailwind utilities), `get_guide` and `validate_markup`, plus `owlky://` resources and prompts for building pages in HTML or React. No network, no file access outside the package.
