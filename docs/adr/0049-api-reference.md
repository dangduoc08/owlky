# ADR-0049: API reference — generated from typed sources, shown on every docs page

**Status:** Accepted (2026-11-09; auto-approved under the owner's standing instruction to run the
approved plan)

## Context
Roadmap phase 3 (3.2–3.4): the owner wants every React prop and every HTML `data-ok-*` name
documented in the docs pages, as the base of the website (ADR-0040). The docs pages had an Options
table (schemas, ADR-0015) and hand-written "Content and behavior" rows that covered a fraction of
the props. Parts, triggers, events and instance methods lived in spec prose and code comments
only; nothing failed when one was missing. The Storybook Controls panel stays as `/component`
defines it (3.5).

## Decision
1. **Typed sources of truth, type-only, never in a bundle.**
   - React props: the components' TypeScript types, read with the TypeScript compiler API
     (`typescript/unstable/sync` of the pinned TypeScript 7). JSDoc is the description;
     `@default` or a "Default `x`." sentence is the default. Props a schema documents fall back to
     the schema's description and default. Props inherited from `@types/react` are summarized as
     "other props go to the native element" with the `ref`'s element.
   - HTML options: the option schemas (ADR-0015), unchanged.
   - Parts, states, values and triggers: `packages/core/src/anatomy/parts.ts`, one
     `<Spec>Parts` interface per spec (`CommonParts` for `data-ok-runtime`, `data-ok-theme`,
     `data-ok-preset`), members typed `Part<"div">`, `State`, `Value<"a" | "b">` or
     `Trigger<"id">`, each with a comment. A name may be declared by several components with its
     own meaning (`data-ok-ready`).
   - Events: each runtime declares an event map (`defineComponent<Instance, Events>`, members
     `EventSpec<Detail, Cancelable>` with a comment). `emit` then only accepts the map's names
     and detail types, so the compiler keeps the map true. Events dispatched by hand (Map popups
     and markers, the table's select) are typed through the same map.
   - Methods: the runtime's exported instance interface, with a comment per member.
   - CSS variables: the `--ok-*` variables each `styles/src/components/<folder>.css` reads, with
     their token values (light and dark) or, for the `--ok-c-*` color bindings, a description.
2. **One generator, deterministic, checked.** `scripts/api-reference.mjs` (`pnpm api`, after
   `pnpm build`) writes `apps/docs-content/src/api/<spec>.json` (and `common.json`), keys sorted.
   `pnpm check:api` (in `pnpm check` and the CI `check` job) fails when a file is out of date, a
   `data-ok-*` name of a snippet, a spec anatomy or a stylesheet is declared nowhere, a runtime
   emits without an event map, or a prop, part, event or method has no description. JSDoc written
   for maintainers is cleaned for readers (no "spec:" lead, no sentence about ADRs, snippets,
   parity or private variables). Source folders map to specs through
   `scripts/component-folders.mjs` (shared with the manifest).
3. **Shape: per React component and HTML part.** A reference has `entries` (one per React
   component and HTML root or part: Card, CardHeader, CardMedia…), each with `react` (props,
   native element) and `html` (attribute, element, options, parts, runtime name, events, methods);
   plus `types` (the definitions of the type names the tables use, per package when React and
   HTML define a name differently) and `css`.
4. **Docs pages.** Every component docs page (and Foundations › Illustrations) ends with
   `apiReferenceSection(data)`, a `GuideSection` with id `api` ("API reference"), so the manifest's
   guides keep it. The guide renders it with `ApiReference` (`apps/docs-content/src/guide/api.tsx`):
   one heading per entry, then React props, HTML attributes, parts, events, methods, types and
   CSS variables, each a horizontally scrolling, focusable table. It works in both hosts; the
   website gets it through the same docs-content sections. Pages that document a second spec
   (Checkbox, Radio and Switch with FormControlLabel) add a second section with its own id. The
   existing Options, Content and behavior and Keyboard sections stay as the curated usage
   reference.
5. **MCP (ADR-0046).** The manifest carries `api` per component and `commonParts`;
   `get_component` returns it as text and structured content, takes `part` for one entry, and lists
   the entries instead when the reference is longer than 60,000 characters (the date picker
   family). The manifest's gzip budget rises from 900 kB to 1 MB (about 145 kB of API data).
6. **Completeness tests.** A Node test (`packages/mcp/src/api-reference.test.ts`) checks that the
   reference lists every schema option, every `data-ok-*` name of every snippet, every literal
   event a runtime emits and every exported React component, each with a description; e2e
   (`foundations.spec.ts`, `API_PAGES`) checks that each docs page renders one row per generated
   item. `pnpm check:docs` (examples that work as written) joins `pnpm check` and CI.

## Consequences
- A new prop without JSDoc, a new `data-ok-*` name, a new event or a new instance member fails
  `pnpm check:api` until it is documented; adding a component means adding its `<Spec>Parts`, its
  event map and the `apiReferenceSection` of its page (AGENTS.md checklist).
- `pnpm api` runs before `pnpm manifest` (the manifest reads the reference files).
- The TypeScript API is TypeScript 7's unstable one: an upgrade of TypeScript may need the
  generator adjusted (it is pinned, and `check:api` shows any change).
- Docs pages import their reference JSON (the date picker's is about 380 kB raw); the website
  bundles only the reference of the page it shows.
