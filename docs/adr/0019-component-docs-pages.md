# ADR-0019: A usage guide page for every component

**Status:** Accepted (2026-11-05) — supersedes "components have no docs page" (ADR-0011's
Storybook layout, AGENTS.md checklist step 6)

## Context
Component stories show every variant, and their Code panel shows the source, but nothing explains
when to use a component, how its options map between frameworks, how it behaves with the keyboard
or what it needs for accessibility. That lived only in the maintainer specs. The Foundations pages
already prove a guide format (prose, live previews, HTML | React code tabs).

## Decision
1. Every component has a **Docs** page, first in its sidebar branch (`tags: ["autodocs"]`,
   `parameters.docs.page`), built with `helpers/guide.tsx` (`GuideDocs`) from
   `components/<name>/<name>-docs.tsx`. Components grouped in a folder get one page each.
2. Fixed section order: **Overview** (what, when, what instead) → usage sections (2–6 common tasks,
   each with a live preview and HTML | React tabs following the toolbar's Framework) → **Options**
   (`OptionsTable`, generated from the option schema) → **Content and behavior** (`PropsTable`:
   props that aren't options) → **Events and methods** (if any) → **Keyboard** (`KeyboardTable`) →
   **Accessibility**.
3. Content comes from the spec and the code, rewritten per AGENTS.md → "Writing documentation";
   the spec stays the terse maintainer contract. Examples use real props, attributes and snippet
   markup.
4. E2E: every page joins `GUIDES` (tokens and token utilities exist, axe in light and dark, phone
   width) and `OPTION_TABLES` (the Options table lists every schema option).
5. `/component` creates the page with the component; `/doc <component>` refreshes spec and page.

## Consequences
- One more file per component; the Options table can't drift from the schema.
- Usage sections repeat a few story examples on purpose: the guide explains, the stories show
  every variant.
