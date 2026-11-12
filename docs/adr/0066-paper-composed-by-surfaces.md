# ADR-0066: Paper composed by the library's own surfaces

**Status:** Accepted (2026-11-12, owner decision recorded in `docs/roadmap.md` → "Pending
integrations", approved 2026-11-12). Extends the composition contract of
`specs/components/paper.md`; nothing is superseded.

## Context
MUI builds its floating and modal surfaces on `Paper`: Popover's and Menu's paper, Dialog's
paper, Drawer's paper, Autocomplete's listbox paper; its table demos put the table on one
(`<TableContainer component={Paper}>`). Owlky's Paper (2026-11-09) arrived after those
components, so each paints the same tokens in its own CSS (paper background, a radius, a shadow
token). Map controls and popups are surfaces of our own that do the same.

Composing Paper there gives one surface contract (one `[data-ok-paper]` marker, MUI's
`elevation` on the surfaces that have it), but it adds an attribute to the root of every
overlay: every overlay snippet and every consumer's markup changes. That is an anatomy change,
not an additive integration, hence this ADR.

## Decision
1. **One element.** A surface gets `data-ok-paper` on its existing surface element, as Card does
   (`specs/components/paper.md` → "Composition contract"); no wrapper element. In React the
   attribute follows the surface's own marker (`data-ok-popover="" data-ok-paper=""`), so HTML
   snippets read `data-ok-popover data-ok-paper`.
2. **Surfaces and options.**

   | Surface | Element | Paper options | Default look |
   |---|---|---|---|
   | Popover, and every popover root: Menu's paper, Select's listbox, Autocomplete's listbox, picker papers, Walktour steps, Editor bubble menu and mention list, Data grid panels | `div[data-ok-popover]` | `elevation` (new Popover option, `data-ok-elevation` `0`–`24`, optional; React `Popover elevation`, `Menu elevation`) | `--ok-shadow-dropdown`, translucent paper with glows (unchanged) |
   | Dialog | `div[data-ok-dialog-paper]` | `elevation` (new Dialog option written on the paper, like `transition`; React `Dialog elevation`) | `--ok-shadow-dialog`, `--ok-radius-xl` (unchanged) |
   | Drawer | `div[data-ok-drawer-content]` | none new: `elevation` stays the Drawer's option (roadmap 4.9, `--_ok-drawer-shadow`) | square (MUI's Drawer passes `square`), each edge's shadow (unchanged) |
   | Table | `[data-ok-table-container]` | all of Paper's, opt-in: React `TableContainer component={Paper}` (new `component` prop, MUI); HTML `data-ok-paper` + Paper's attributes on the container | no paper unless asked (MUI's default, the reference's stories) |
   | Map | `div[data-ok-map-control]`, `div[data-ok-map-popup-content]` | none (Owlky surfaces, no upstream prop) | `--ok-shadow-z1` / `--ok-shadow-dropdown` (unchanged) |

3. **Look by source order.** `paper.css` loads first; each surface's CSS (loaded later) restates
   the radius, background and shadow it had. An explicit `elevation` wins: the surface's own
   shadow rule is guarded by `:not([data-ok-elevation])`, so Paper's `[data-ok-elevation="<n>"]`
   rules apply (`0` = none, `1` = Paper's base rule). Drawer content restates `border-radius: 0`
   (it set none before). Paper's `transition: box-shadow` now also applies to Popover, Dialog and
   the map surfaces (MUI's Paper has the same transition); Drawer content keeps its own
   `transition`. Paper's `color` is the `--ok-text-primary` these surfaces already used. No token
   changes: rendered visuals stay the same.
4. **Not composed, on purpose.**
   - Paper's `variant` and `square` on overlays: Dialog's paper uses `data-ok-variant` for its
     Motion entrance and the Map legend for its own `variant`; on Popover they would need
     restated outlined / square rules for a look no reference shows. Backlog.
   - Tooltip (MUI's Tooltip isn't a Paper), the Map legend (`variant` clash), the Map panel (a
     dark translucent demo panel, not a paper), Snackbar, Alert and Accordion (not in this
     decision; MUI composes Paper in some of them: a later decision).
   - Autocomplete `slotProps.paper` / `PaperComponent`: the listbox paper is a Popover the
     component owns; its attributes come from item 1. Backlog.
5. **Anatomy changes** (specs and `core/src/anatomy/parts.ts` comments updated):
   - `div[data-ok-popover]` → `div[data-ok-popover][data-ok-paper][data-ok-elevation]?`
   - `div[data-ok-dialog-paper]` → `div[data-ok-dialog-paper][data-ok-paper][data-ok-elevation]?`
   - `div[data-ok-drawer-content]` → `div[data-ok-drawer-content][data-ok-paper]`
   - `div[data-ok-map-control]` → `div[data-ok-map-control][data-ok-paper]`
   - `div[data-ok-map-popup-content]` → `div[data-ok-map-popup-content][data-ok-paper]`
   - `[data-ok-table-container]` may carry `[data-ok-paper]` and Paper's attributes (opt-in).

## Migration (pre-0.1.0: nothing is published yet, but the markup contract changes)
- **HTML authors:** add `data-ok-paper` right after `data-ok-popover`, `data-ok-dialog-paper`,
  `data-ok-drawer-content`, `data-ok-map-control` and `data-ok-map-popup-content`. Without it the
  surfaces still look the same (their own CSS restates the look), but `data-ok-elevation` on
  them needs it.
- **Global Paper styles:** CSS or scripts that target `[data-ok-paper]` (for example an unlayered
  `[data-ok-paper] { border-radius: 0 }` or `querySelectorAll("[data-ok-paper]")`) now also reach
  these overlays. Scope them (`[data-ok-paper]:not([data-ok-popover], [data-ok-dialog-paper],
  [data-ok-drawer-content])`) or use a class.
- **Styles of the surfaces:** selectors such as `[data-ok-popover]` keep matching; an unlayered
  override of `box-shadow` still wins over both Paper and the surface.

## Consequences
- Every snippet with one of these surfaces changes (one attribute), including the Data grid's
  and the pickers'; generators reproduce it, hand-written snippets get the same attribute.
- Major changesets for `@owlky/core`, `@owlky/styles`, `@owlky/react` and `@owlky/html`: the
  rendered markup changes.
- MUI's `elevation` exists on Popover, Menu and Dialog, and keeps working on Drawer.
- Follow-ups: Paper `variant` / `square` on overlays, Autocomplete `slotProps.paper`, Snackbar
  content, Alert and Accordion as Papers.
