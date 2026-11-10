# ADR-0052: Organization chart — direction (top, bottom, left, right) in CSS only

**Status:** Accepted (2026-11-10). Supersedes ADR-0036 where it says horizontal (left-to-right)
trees are out of scope; ADR-0036's connector model (borders on `::before` / `::after`, logical
properties, no measuring) and ADR-0051's toggle markup stay.

## Context
Roadmap row 4.18.2 (audit 2.4) asks for ApexTree's `direction` (`apexcharts.com/apextree/docs`
options, checked 2026-11-10): `top` (default, children below), `bottom` (children above), `left`
(root on the left, children to the right), `right`, plus `radial`. ApexTree has a separate
`locale.direction: "rtl"` that mirrors the tree horizontally. Our chart is nested lists with CSS
connectors (ADR-0036) and collapsible branches with a toggle per node (ADR-0051). Its connectors
are written with logical properties, so right-to-left pages already mirror the top-down chart.

## Decision
1. **A `style` option, optional.** `direction` (`data-ok-direction`) takes `top` · `bottom` ·
   `left` · `right`; the default is `top` and is **not written** (`optional: true`), so every
   existing chart keeps its markup and pixels and no snippet changes. Unknown values fall back to
   `top`. `radial` isn't offered: a ring layout needs measured positions, which nested lists with
   borders can't give (a radial or dendrogram layout is row 4.18.7, in the Chart's SVG engine).
2. **CSS only, the same markup.** No runtime, no measuring, the same DOM in every direction:
   - `bottom` reverses the block axis: nodes are `column-reverse` flex boxes, children lists pad
     their block end, and every connector border moves from the block start to the block end
     (radii `start-*` → `end-*`).
   - `left` and `right` swap the axes: a node is a flex row (label, toggle, children list), a
     children list is a flex column, the line from the parent runs along the inline axis at the
     list's block center, and each child's two halves of the bar run along the block axis on
     its inline start, the line to its label along its block center. Labels don't shrink.
   - `right` also reverses the inline axis (`row-reverse`, borders and radii on the inline end).
   The first / last / only child rules of ADR-0036 apply with their sides moved; the last child's
   turn is still shifted by the line width so every line to a label uses the same pixels.
3. **`left` and `right` are logical.** `left` means "root at the inline start": in a
   right-to-left scope it grows toward the left, like ApexTree's `locale.direction: "rtl"`
   mirroring a `left` tree. No separate locale option: the page's `dir` decides.
4. **Toggles and badges follow.** ADR-0051's toggle straddles the label's edge that faces the
   children (block end for `top`, block start for `bottom`, inline end for `left`, inline start
   for `right`) through its negative margin, so the children list's line still starts past it.
   The chevron points at the children while collapsed and away while expanded: the root
   declares `--_ok-org-chevron` (0, 180deg, -90deg, 90deg; horizontal values swapped under
   `[dir="rtl"]`) and the expanded icon adds 180deg. The badge stays inside the toggle.
5. **Reading and focus order stay the tree order.** Only flex directions change; the DOM is a
   node, then its toggle, then its children in every direction, so screen readers, Tab and the
   reading order follow the hierarchy even where children are drawn above or before their parent
   (`bottom`, `right`). Siblings keep their visual order in every direction.
6. **Collapse stays vertical.** The children list is a Collapse that animates its block size in
   every direction (ADR-0044). In `left` / `right` charts the column of children folds toward its
   center instead of sideways; a horizontal Collapse would need `data-ok-orientation` on every
   list, written by both owners and followed on direction changes.
7. **Responsive: the direction is fixed.** The chart keeps its direction at every width (a tree
   keeps its shape, ADR-0036). Horizontal charts trade width per level for height per sibling, so
   deep trees with short labels fit phones better sideways; apps that want that switch the prop
   or attribute themselves (a `matchMedia` listener). Wide or tall charts still scroll by
   composition (`Scrollbar › OrganizationChart`).

## Consequences
- About 1 kB of CSS (gzip) for the three directions; no JavaScript in either implementation.
- The direction rules are descendant selectors of the root: a chart nested in a label of a chart
  with another direction picks up the outer direction's rules (nested charts should use the same
  direction). Private properties are still redeclared per root, so lengths and colors don't leak.
- The chevron's RTL variant reads a `dir="rtl"` attribute on the chart or an ancestor (`:dir()`
  isn't in the Baseline); a `direction: rtl` set only through CSS keeps the LTR chevrons.
- Not offered: `radial` (4.18.7), a per-breakpoint direction (app code), ApexTree's
  `locale.direction` (the page's `dir`).
