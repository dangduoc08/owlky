# ADR-0058: Chart: hierarchy charts (tree, sunburst, icicle)

**Status:** Accepted (2026-11-10, auto-approved under the owner's standing instruction). Extends
ADR-0024, ADR-0027, ADR-0029, ADR-0031 and ADR-0047; nothing earlier is superseded.

## Context
Roadmap 4.18.7 (must) asks for ApexTree's layouts in the Chart's SVG engine: tidy trees and
dendrograms (`layoutType`), drawn from any side or around a center (`direction: "radial"`).
Roadmap 4.18.21 (should) adds ApexCharts v8's `sunburst` and `icicle`, partition charts of the same
kind of data. The Organization chart (ADR-0036, 0051, 0052, 0056) already draws hierarchies, but as
nested HTML lists with cards and CSS connectors: it is a document, not a chart, and can't lay out a
radial tree or size nodes by value. The Chart contract stays: React and HTML draw the same node tree
from `renderChart`, the HTML data is a `<table>`, text widths are estimated, colors come from the
palette tokens, strict CSP, no `innerHTML`, no new runtime dependency, WCAG 2.2 AA.

## Decision
1. **One hierarchy model for three types.** `type` gains `tree`, `sunburst` and `icicle`. React
   passes `hierarchy`: one node or a list of roots, each `{ id?, name?, value?, color?, children? }`
   (ApexCharts' `x` / `y` are accepted for `name` / `value`, so its sunburst data works as is).
   Core `chartHierarchy` normalizes it into nodes in preorder with depth, parent, children and value:
   leaves keep their value, parents are the sum of their children (ApexCharts' `partition:
   "normalize"`), and without any value every leaf counts one. Ids default to the name; repeated
   names get `-2`, `-3`… Limits: 5000 nodes, 64 levels (untrusted input).
2. **The HTML table lists nodes with their parent**, like Sankey's link rows: one row per node in
   preorder, the name as the row header, then the parent's name (empty for roots) and an optional
   value (`th[data-ok-part="name|parent|y"]`). Ids that differ from names go in `data-ok-value`
   (on the node's cell and on parent cells), colors in `data-ok-color` where they start (own colors, and the palette colors of the roots or a single root's children, so the HTML table draws the same colors as React's `colors` prop). A parent must come
   before its children; an unknown parent makes a root, so a table can't express a cycle. The table
   is also the accessible view: the hierarchy reads as "node, parent, value".
3. **Colors** come from the palette: the roots — or the children of a single root — take `colors`
   in order, then the chart palette; descendants inherit; a node's own `color` applies to its
   subtree. Partitions tint deeper levels toward the paper (`tint`, ApexCharts' option, through a
   `fill-opacity` attribute that CSS never sets).
4. **Tree layouts are ours** (`chart-tree.ts`): `layoutType: "tree"` is the Buchheim–Jünger–Leipert
   version of the Reingold–Tilford tidy tree (linear time; separation 1 between siblings, 2 between
   cousins, divided by the depth in radial trees); `cluster` is a dendrogram (leaves in order, parents
   at their children's mean, every leaf on the last level, internal nodes at their own depth as
   ApexTree does). `direction` places the root `top`, `bottom`, `left`, `right` or in the center
   (`radial`: breadth becomes the angle over `startAngle` → `endAngle`, depth the radius). Links are
   `orthogonal` (ApexTree's default; radial: an elbow around the middle circle), `curved` or
   `straight` (`edgeStyle`). Nodes are circles (`markerSize`) with text labels: cards stay the
   Organization chart's.
5. **Partition layouts** (`chart-partition.ts`): the sunburst gives each node an arc of its parent's
   angle in proportion to its value, one ring per level after an `innerSize` hole (default 15%);
   the icicle does the same with bands along `direction`. `leaf: "extend"` (sunburst default)
   stretches shallow leaves to the edge, `stop` (icicle default) ends them at their level. Gaps
   between cells are a paper stroke (`spacing`, px). Labels are drawn only where the estimated text
   fits: radially along sunburst arcs of at least 8°, horizontally in icicle cells of at least 30px.
6. **Drill (zoom on click)**, as ApexCharts' `zoomOnClick` (on by default; `disableZoomOnClick`
   turns it off): a click, Enter or Space on a node with children makes it the visible root; on the
   drilled root (the sunburst's center disc, the icicle's top band) it goes one level up. Escape and
   a **Back** button (`[data-ok-chart-drill]`, a native button and a polite status with the path)
   also go up, so drilling never needs a pointer. The icicle's `zoomType: "value"` keeps the
   ancestors as full bands above the branch; `both` makes the branch the top level. The state is
   `data-ok-drill-node` on the root (React writes its state there; the runtime reads and writes it),
   so React and HTML render the same markup; events `ok:chart:drill` (cancelable) and React
   `drillNode` / `defaultDrillNode` / `onDrillNodeChange`.
7. **Trees collapse** with `enableExpandCollapse` (ApexTree's name): a click, Enter or Space on a
   node with children hides or shows them; a collapsed node is hollow and its tooltip says so. The
   state is `data-ok-collapsed-nodes` (`;`-separated ids) on the root; `ok:chart:expand`
   (cancelable) and React `collapsedNodes` / `defaultCollapsedNodes` / `onCollapsedNodesChange`.
8. **Keyboard over the hierarchy:** a new layout mode, `tree`. The arrow pointing toward the
   leaves (down in top trees and icicles, right in left trees, outward in radial trees and
   sunbursts) goes to the first child, the opposite one to the parent, the other two to the next or
   previous node drawn on the same level (crossing parents, so every node is reachable). Home and End
   go to the first and last node. The tooltip (a status region) announces the path (`Root › … ›
   Node`), the value, the level and the children. No legend (the drawing labels the branches and the
   table lists them), no zoom window, no data point selection: Enter belongs to the hierarchy.
9. **Relation to the Organization chart:** it stays the hierarchy *document* (focusable cards,
   links and buttons in nested lists, CSS connectors, zoom, search). Hierarchy charts are the SVG
   *visualization* (radial and dendrogram layouts, sizes by value, partitions), with the Chart's
   table, tooltip and keyboard. ApexTree options that only make sense for cards (node templates,
   box styles, spacing in px, leaf groups, search, the zoom toolbar) are not mapped to the chart.
10. **Not built:** ApexTree's toolbar zoom and `fitScreen` (the chart fits its SVG), `changeLayout`
    animations, `groupLeafNodes`, `edgeColorMode`, label `collisionStrategy` options (labels that
    don't fit are cut or left out); ApexCharts' `partition: "strict"`, `borderRadius`, icicle `sort`,
    `maxDepth`, `levelSize`, rotated icicle labels, the breadcrumb's `formatter` and position, and
    the other v8 types (`streamgraph`, `violin`, `beeswarm`, `waffle`, `unit`).

## Consequences
- Additive API (minor): three chart types, new props, options, parts and events; no default
  changes for existing types (their node trees and snippets are byte-identical).
- The core bundle grows by the layouts; budgets are raised in `scripts/check-size.mjs` only if the
  measured bundle needs it, with this ADR as the reason.
- Labels are estimated, never measured, so server, React and HTML agree; long names are cut with an
  ellipsis and kept whole in the tooltip and the table.
- Collapse and drill states are root attributes, so a page can set them before the runtime starts.
