---
"@owlky/core": minor
"@owlky/styles": minor
"@owlky/react": minor
"@owlky/html": minor
---

Organization chart: node selection, arrow-key navigation and a lineage breadcrumb, after ApexTree (opt-in, existing charts are unchanged). `enableKeyboardNavigation` (`data-ok-enable-keyboard-navigation`) turns the nested lists into an ARIA tree with one tab stop: ↓ / ↑ move between visible nodes, → expands or goes to the first child, ← collapses or goes to the parent, Home / End, Enter toggles, letters jump to a node (→ and ← swap in right-to-left pages); the zoom keys keep working. `enableSelection` (`single` · `multi`, `data-ok-enable-selection`) also turns it on: a click on a card or Space selects nodes with an id (`aria-selected`, a primary ring). React: `selectedNodes` / `defaultSelectedNodes` / `onSelectionChange`; HTML: `data-ok-selected` on the node and the cancelable `ok:organization-chart:select` event. Methods `setSelection(ids)`, `clearSelection()`, `getSelection()` and `getNodePath(id)` (the ids from the top node down, for a composed Breadcrumbs). Core: `createOrganizationChartTree`, `organizationChartSelect`, `organizationChartSelection`, `organizationChartSelected`, `organizationChartVisible`, `organizationChartNodePath`.
