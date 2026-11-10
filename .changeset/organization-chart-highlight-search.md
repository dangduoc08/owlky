---
"@owlky/core": minor
"@owlky/styles": minor
"@owlky/react": minor
"@owlky/html": minor
---

Organization chart: lineage highlight and search. `highlightOnHover` (`data-ok-highlight-on-hover`) highlights the path from a hovered or focused node to the root in the primary color and fades the other nodes by `dimOpacity` (`data-ok-dim-opacity`, default 0.7). `highlightNode(id)` (React `apiRef`, HTML instance) opens the collapsed nodes above a node, scrolls it into view and highlights it with a ring and its path, without fading; `clearHighlight()` and `getHighlightedNode()` go with it, and React adds `highlightedNode`, `defaultHighlightedNode` and `onHighlightedNodeChange`. Compose an Autocomplete and a `role="status"` line to search a chart.
