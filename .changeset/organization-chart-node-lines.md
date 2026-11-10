---
"@owlky/core": minor
"@owlky/styles": minor
"@owlky/react": minor
---

Organization chart: line options per node, after ApexTree's `edgeColorMode` (existing charts are unchanged). `lineColor` and `lineStyle` on a node (React `OrganizationChartNode` props, HTML `data-ok-line-color` / `data-ok-line-style` on the node's `li`, the chart's allowlists) style the lines from that node to its children and its toggle's border. The chart's new `edgeColorMode` (`data-ok-edge-color-mode`): `default` (not written) stops a node's lines at its children, `node` carries them through its whole branch, down to the nodes that set their own. CSS only. Core: `organizationChartNodeOptions`, `organizationChartNodeAttributes()`, `organizationChartEdgeColorModes`.
