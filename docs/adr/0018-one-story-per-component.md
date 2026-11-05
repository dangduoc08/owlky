# ADR-0018: One story per component, framework chosen in the toolbar

**Status:** Accepted (2026-11-05) — supersedes the "two story files with the same story names"
convention (AGENTS.md checklist step 6, ADR-0011's Storybook layout)

## Context
Every component had two Storybook trees, `React/<Name>` and `HTML/<Name>`, with identical stories:
the only visible difference was the Code panel. The sidebar doubled with every component, and more
frameworks (Angular, Svelte, Vue) would multiply it again. Both implementations must still be
rendered and tested separately (parity, a11y, interactions).

## Decision
1. **One tree:** `Components/<Name>` (and `Components/<Folder>/<Name>` for grouped components),
   framework-agnostic.
2. **Global `framework`** (`react` default, `html`), set by a **Framework** tool in the toolbar
   (`.storybook/toolbar.tsx`); it persists across stories like the theme.
3. **One `<name>.stories.tsx` per component.** Each story is
   `frameworkStory({ html: snippetStory(…), react: reactGroupsStory(…) })` (`helpers/groups.tsx`):
   it renders the chosen implementation, shares the schema Controls, and shows that
   implementation's source in the Code panel through `docs.source.transform` (no static `code`:
   Storybook only transforms a derived source).
4. **E2E:** a component story id carries the framework, `components-<…>--<story>@<impl>`
   (`storyId()`); `openStory()` turns the suffix into `globals=framework:<impl>`, and `storyIds()`
   lists every component story once per framework, so a11y, visual and small-screen checks still
   cover both implementations.
5. **Docs pages:** the HTML | React tabs of the usage guides start from, and follow, the toolbar's
   Framework (`helpers/framework-global.ts`, fed by the preview channel's globals events).
6. No change to `packages/*` (APIs, DOM, CSS): no changeset.

## Consequences
- Half the sidebar; a new framework adds a toolbar entry and a key in `frameworkStory`, not a tree.
- Visual baselines are renamed (`…@react-…png`): regenerate them in Docker after approval.
- Story names must be identical in both implementations by construction (one export).
