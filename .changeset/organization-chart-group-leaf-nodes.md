---
"@owlky/core": minor
"@owlky/styles": minor
"@owlky/react": minor
"@owlky/html": minor
---

Organization chart: grouped leaves, after ApexTree's `groupLeafNodes` (opt-in, existing charts are unchanged). With `groupLeafNodes` (`data-ok-group-leaf-nodes`), a node with two or more children that have no children of their own stacks them in one column under it, joined by a line along their side with a stub to each; `groupLeafNodesSpacing` (`data-ok-group-leaf-nodes-spacing`, default 8px) sets the space between them. CSS only (the spacing goes through the runtime like the other lengths). It follows every `direction` (upward in `bottom` charts, a row after the node in `left` / `right` charts), works with collapsible nodes, and the lineage highlight runs along the column. A level that mixes leaves with branches, collapsible or lazy ones included, keeps its row. Core: `ORGANIZATION_CHART_GROUPED`, `organizationChartGrouped(node)`.
