# ADR-0063: Organization chart — an opt-in ARIA tree for selection and arrow-key navigation

**Status:** Accepted (2026-11-11, auto-approved under the owner's standing instruction).
Supersedes ADR-0036 decision 1 where it says the chart has no `tree` role ("nothing is
selectable") and the spec's "Keyboard: none of its own"; ADR-0051 (toggles), ADR-0052
(direction, reading order), ADR-0056 (zoom keys) stay.

## Context
Roadmap rows 4.18.83 and 4.18.84 (the 6.0 ApexTree audit, must) ask for ApexTree's node selection
(`enableSelection: 'single' | 'multi' | false`, `graph.getSelection()`, `setSelection(ids)`,
`clearSelection()`, `onSelectionChange(listener)`; a click selects, Space toggles) and its
accessibility mode (`a11y: { enabled, label }`, checked 2026-11-11 on
`apexcharts.com/apextree/docs` and the `selection` / `accessibility` samples): the SVG becomes
`role="tree"` with `treeitem`s carrying `aria-level`, `aria-posinset`, `aria-setsize`,
`aria-expanded`; Tab enters and leaves the tree, the arrows move between visible nodes and expand,
collapse, go to the parent or the first child, Home / End go to the first and last visible node,
Enter toggles, Space selects, a letter jumps to the next node starting with it. Row 4.18.85 adds a
lineage breadcrumb (`enableBreadcrumb`, `setBreadcrumbHandler`).

Our chart is nested lists (`ul › li › label + toggle? + ul`, ADR-0036): the right structure for a
static hierarchy *document*, whose cards may hold the app's own links, buttons and menus.
`aria-selected` is only allowed on `option`, `gridcell`, `row`, `tab` and `treeitem`, so a
selection that assistive technology announces can't live on plain list items; a `button` with
`aria-pressed` around a card would nest the card's controls in a button (axe
`nested-interactive`). Tree view (`role=tree`, roving focus on the `li`, `aria-selected`,
`aria-multiselectable`, typeahead) is the library's model of the APG tree pattern.

## Decision
1. **Lists stay the default; an ARIA tree is opt-in.** Two root options turn the chart into a
   tree: `enableKeyboardNavigation` (`data-ok-enable-keyboard-navigation`, ApexTree's
   `a11y.enabled`, renamed: what it adds is the keyboard model) and `enableSelection`
   (`data-ok-enable-selection` `single` · `multi`, optional, not written when off; selection
   needs the keyboard and the announced state, so it implies the tree). Charts without them keep
   their markup, pixels and snippets byte for byte.
2. **The tree is derived state written by core, in both implementations.**
   `createOrganizationChartTree(root, options)` writes `role="tree"` on the root,
   `role="treeitem"` on every node of this chart (nested charts left out), `role="group"` on
   children lists, `aria-multiselectable="true"` (multi), `aria-selected` on nodes with an id
   (`true` / `false`, selection only), `aria-expanded` on branches (mirrored from the toggle),
   `aria-labelledby` naming each item by its label (the label gets an `ok-org-label-<n>` id when
   it has none; a treeitem named from its content would read its whole subtree), and the roving
   `tabindex` (one `0`, the others `-1`); toggles leave the Tab order (`tabindex="-1"`: the keys
   do their job, the pointer still clicks them). It follows DOM changes (MutationObserver) and
   removes everything it wrote when the options turn off or on `destroy()`. React renders none of
   it (as Carousel, ADR-0033): without JavaScript the snippet is the plain lists, which is the
   right markup for a chart that can't be operated. `aria-level`, `aria-posinset` and
   `aria-setsize` aren't written: browsers compute them from the nested `treeitem` / `group`
   structure.
3. **Selection state is `data-ok-selected` on the node**, like `data-ok-highlighted`: React renders
   it from `selectedNodes` / `defaultSelectedNodes` / `onSelectionChange(ids)` (every change,
   methods included, as `onCollapsedNodesChange`); the HTML runtime writes it after a cancelable
   `ok:organization-chart:select` (`{ selectedNodes, nodeId, node, selected }`); the controller
   mirrors `aria-selected`. Only nodes with an id (`nodeId` / `data-ok-node-id`) are selectable.
   The controller reports intent (`onSelect(node)`) for Space and for a click on a label outside
   its interactive content; core `organizationChartSelect(current, id, mode)` gives the next ids:
   `single` selects the node or, when it is the selected one, clears; `multi` toggles it.
   Methods `setSelection(ids)` (single: the first id), `clearSelection()`, `getSelection()` (ids
   in selection order) emit no HTML events. Selected labels draw a 2px primary ring
   (`box-shadow`, so the focus ring keeps the outline); the state is announced, never color alone.
4. **Keyboard (roving focus on the `li`, one tab stop).** ↓ / ↑ next / previous visible node in
   tree order; → expands a collapsed branch (through the owner's `onToggle`, lazy children
   included), else moves to the first child; ← collapses an expanded branch, else moves to the
   parent; Home / End first / last visible node; Enter toggles a branch; Space selects; a
   printable character jumps to the next visible node whose label text starts with the typed
   letters (500 ms buffer). In right-to-left charts → and ← swap (APG). The keys follow the tree
   order, not the drawing, in every `direction` (ADR-0052 §5: reading and focus order are the
   tree's). The tab stop is the last focused node, else the first selected, else the root; when it
   is hidden by a collapse it moves to its nearest visible ancestor (and takes the focus if it had
   it).
5. **It coexists with the other features.** Collapse: → / ← / Enter call the same intent as the
   toggle. Zoom: the zoom controller's "widgets that keep their keys" list now skips the chart's
   own tree, so + / − / 0 still zoom from a focused node, and typeahead leaves those keys alone
   while zoom is on; the browser scrolls the focused node into view at every level. Lineage
   highlight: a keyboard-focused node (`li:focus-visible`) highlights its path like a focused
   label, and the highlight controller measures it. `expandCollapseOnNodeClick` and selection
   both act on the same label click.
6. **Lineage breadcrumb by composition (4.18.85).** Core `organizationChartNodePath(root, id)` and
   the method `getNodePath(id)` (ids from the root node to the node) give the trail; the app
   renders a `Breadcrumbs` next to the chart that follows the selected or highlighted node, and
   its items call `setSelection` / `centerOnNode`. The root is a list, so a `nav` inside it would
   be invalid, and the labels, separators and collapsing are the Breadcrumbs component's.

## Consequences
- Additive (minor): two options, one state attribute, one event, four methods; no default change.
- About 1.5 kB of JavaScript per implementation and a few CSS rules (focus and selected rings,
  highlight selectors for a focused node).
- Tree mode keeps the app's controls inside labels in the Tab order after their node (we never
  rewrite the app's `tabindex`): charts meant for keyboard navigation should keep cards free of
  controls, or accept the extra stops. Documented in the spec and the guide.
- Not offered: ApexTree's `a11y.label` (the root's `aria-label` / `aria-labelledby` already name
  it), `setBreadcrumbHandler` and a built-in breadcrumb `nav` (composition; the app listens to
  `select` or `onSelectionChange`), `locale.messages.breadcrumbAriaLabel` (the Breadcrumbs'
  `aria-label`), Shift + arrow range selection and `*` (ApexTree has neither).
