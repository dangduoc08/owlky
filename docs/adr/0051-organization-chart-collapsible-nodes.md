# ADR-0051: Organization chart — collapsible nodes, a toggle per branch, lazy children

**Status:** Accepted (2026-11-10). Supersedes ADR-0036 where it says the chart isn't interactive
(decision 1: "nothing is expandable") and that collapsible nodes are out of scope.

## Context
Roadmap row 4.18.1 (audit 2.4) asks for ApexTree's expand / collapse on the Organization chart.
ApexTree (`apexcharts.com/apextree/docs`, checked 2026-11-10) offers `enableExpandCollapse`
(default `true`), `expandCollapseOnNodeClick`, a collapse badge with the hidden-descendant count
(`collapseBadgeEnabled`, `collapseBadgeThreshold`, colors and font size), graph methods
`expand(id)` / `collapse(id)` / `expandAll()` / `collapseAll()` / `expandToDepth(depth)` (root
depth 0) / `expandSubtree(id)` / `collapseSubtree(id)`, and lazy children: a node with
`hasChildren: true` and no `children` calls `loadChildren({ id, name, data })` on its first
expand (an empty array makes it a leaf, a rejection keeps it collapsed and retryable, batch verbs
never fetch). ApexTree draws on a canvas with its own buttons and has no events for expand or
collapse. Our chart is nested lists with CSS connectors (ADR-0036); Collapse (ADR-0044) is the
library's size animation, with `hidden` as its state.

## Decision
1. **Off by default.** `enableExpandCollapse` is `false` (ApexTree: `true`) so every existing
   chart keeps its markup and pixels. It is a flag on the root (`data-ok-enable-expand-collapse`);
   `expandCollapseOnNodeClick` (`data-ok-expand-collapse-on-node-click`) and
   `collapseBadgeThreshold` (`data-ok-collapse-badge-threshold`, default 1) are options too.
2. **State lives with the owner; a core controller reports intent.**
   `createOrganizationChartController(root, options)` listens for clicks on the toggles (and, with
   `expandCollapseOnNodeClick`, on labels outside their interactive content) and calls
   `onToggle(node, expanded)`. It owns no state. React keeps the collapsed node ids
   (`collapsedNodes` / `defaultCollapsedNodes` / `onCollapsedNodesChange`); the HTML runtime's
   state is the children list's `hidden`, which it writes with the toggle's `aria-expanded` after a
   cancelable `ok:organization-chart:expand` / `collapse` event. Core
   `organizationChartPlan(root, action)` turns `expandAll`, `collapseAll`, `expandToDepth`,
   `expandSubtree` and `collapseSubtree` into a node → expanded map that both owners apply (loaded
   nodes only, as ApexTree). Methods emit no events (like the Editor's `setValue`); React exposes
   them on `apiRef` (`useOrganizationChartApiRef()`, as Tree view), HTML on the instance.
3. **Markup of a branch.** `li[data-ok-organization-chart-node][data-ok-node-id]? ›
   div[label] + button[data-ok-organization-chart-toggle][type=button][aria-expanded][aria-controls]
   + ul[data-ok-organization-chart-children][data-ok-collapse][id][hidden]?`. The toggle holds a
   visually hidden label (`span[data-ok-organization-chart-toggle-label]`, React `toggleLabel`,
   default "Child nodes"), a chevron (`svg[data-ok-organization-chart-toggle-icon]`), a
   `CircularProgress` (`data-ok-organization-chart-spinner`, lazy nodes only, shown while
   `aria-busy`) and the badge span (`data-ok-organization-chart-badge`, left out with
   `collapseBadgeEnabled={false}`). The name comes from the content, so the visible count is part
   of it ("Priya Raman's reports 4": WCAG 2.5.3 label in name; an `aria-label` without the count
   fails axe `label-content-name-mismatch`); `aria-expanded` says the state. The badge's text is
   the hidden descendant count; the
   controller writes it in both implementations (React renders the span empty), so the count
   follows lazy loads and nested collapses without React walking its children. It is empty below
   the threshold and while expanded (CSS hides an empty badge). Node ids are `data-ok-node-id`
   (React `nodeId`); React nodes without one get an internal id.
4. **Connectors follow `hidden`.** A closed children list is `hidden`, so it and its connectors
   aren't drawn: the node looks like a leaf with the toggle on its bottom edge. The toggle
   straddles the label's bottom edge (`margin-block-start: -½ size`, above the label), and the
   list's line starts below it, so a collapsible chart is half a toggle taller per level than the
   same chart without toggles. Refines ADR-0036's rule "a node without children renders no
   children list": a lazy node renders an **empty, hidden** list (the toggle's `aria-controls`
   target); a node whose load returned nothing renders neither toggle nor list.
5. **The children list composes Collapse.** React renders `<Collapse component="ul">`, HTML
   markup carries `data-ok-collapse` (the `collapse` runtime animates it). The list's top padding
   (the line from the parent) stays visible during the animation (ADR-0044 consequence: padding
   on the collapsing element), so the children fold up to the line, which then goes.
6. **Lazy children in both implementations.** React: `hasChildren` on a node without children
   and `loadChildren({ id }) => Promise<ReactNode>` on the chart: the resolved nodes are kept in
   the chart's state and rendered as that node's children (first expand only); an empty result
   makes it a leaf; a rejection leaves it collapsed and retryable. HTML: a lazy node is a toggle
   whose list is empty; expanding it emits `ok:organization-chart:loadchildren` with
   `respondWith(nodes | Promise<nodes>)` (the Editor's `mentionsearch` pattern, ADR-0050). Nodes
   are elements (`li[data-ok-organization-chart-node]`, cloned from a `template` or built with
   DOM methods, never HTML strings); the runtime appends them. No response means no children.
   While loading, the toggle has `aria-busy="true"` and shows its spinner; repeated clicks wait.

## Consequences
- ApexTree's styling options of the button and badge (`expandCollapseButton*Color`, `Size`,
  `collapseBadge*Color`, `FontSize`) aren't offered: tokens and the stylesheet draw them (24px
  target, paper background, line-colored border).
- Not offered: always-on count badges (`countBadge*`), `enableExpandCollapseZoom` /
  `maxZoomNodeSpan` (zoom is row 4.18.5), `enableAnimation` / `motion.*` (Collapse's timing
  tokens and reduced-motion rule apply), `onNodeClick` (labels hold the app's own content and
  handlers), `locale.messages.loadingNodeLabel` (`aria-busy` on the toggle), card
  expansion (`cardExpansion`, `expandCard`…: content is the app's).
- The toggle's name changes while collapsed (the count joins it); the label part stays the same.
- Without JavaScript the toggles do nothing and the markup's initial state stays.
- The HTML runtime and the stylesheet grow (about 1 kB gzip each, measured in the roadmap row).
