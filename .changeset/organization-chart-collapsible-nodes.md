---
"@owlky/core": minor
"@owlky/styles": minor
"@owlky/react": minor
"@owlky/html": minor
---

Organization chart: collapsible nodes, after ApexTree (opt-in, existing charts are unchanged). `enableExpandCollapse` gives every branch a toggle button (`aria-expanded`, `aria-controls`) on the bottom edge of its label; its children list is a Collapse, and a collapsed node draws no lines below it. Collapsed toggles show the number of hidden nodes (`collapseBadgeEnabled`, `collapseBadgeThreshold`); `expandCollapseOnNodeClick` also toggles on label clicks. Methods `expand`, `collapse`, `isExpanded`, `expandAll`, `collapseAll`, `expandToDepth`, `expandSubtree`, `collapseSubtree` (React `apiRef` with `useOrganizationChartApiRef()`, HTML instance). Children can load on the first expand: React `hasChildren` + `loadChildren({ id })`, HTML `ok:organization-chart:loadchildren` with `respondWith()`. React adds `nodeId`, `toggleLabel`, `collapsedNodes` / `defaultCollapsedNodes` / `onCollapsedNodesChange`, `onExpand`, `onCollapse`; HTML adds the cancelable `ok:organization-chart:expand` and `collapse` events. `OrganizationChart` is now a client component (`"use client"`).
