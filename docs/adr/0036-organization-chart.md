# ADR-0036: Organization chart — nested lists with CSS connectors, lengths through private properties

**Status:** Accepted (2026-11-09)

## Context
The reference's "Organization chart" page (sections Simple, Standard, Group) is built on
`react-organizational-chart` (MIT, React only): `Tree` / `TreeNode` with a `label` each and
connector options `lineHeight`, `lineWidth`, `lineColor`, `lineStyle`, `lineBorderRadius`,
`nodePadding` (any CSS value). There is no framework-free version upstream, so the owner chose to
write the HTML side ourselves (2026-11-09). The roadmap listed the component under "Needs an ADR"
because its options are free CSS values and the reference's charts are wider than a phone.

## Decision
1. **Nested lists, CSS connectors, no layout engine.** The chart is `ul › li › (label div, ul of
   child li)`, the accessible structure for a hierarchy that isn't interactive (no `tree` role:
   nothing is selectable or expandable). Lines are borders on `::before` / `::after` of each
   children list and child node, written with logical properties (right-to-left mirrors). No
   measuring, no SVG, no JavaScript needed to draw a chart.
2. **Two names, the upstream's props.** `OrganizationChart` (root, upstream `Tree`) and
   `OrganizationChartNode` (upstream `TreeNode`): a generic `Tree` collides with Tree view.
   Defaults follow the reference's wrapper (40px lines, 24px corners, 4px node padding, divider
   color), not the upstream's.
3. **Free CSS values become an allowlist and validated lengths.** `lineColor` and `lineStyle` are
   `style` options (`divider` · `inherit` · palette light tones; `solid` · `dashed` · `dotted`):
   `inherit` plus the root's `color` covers any custom color without passing untrusted CSS. The
   four lengths are `number` options with units (`px`, `rem`, `em`; invalid → default). CSS can't
   read lengths from attributes in the Baseline (typed `attr()` isn't available), so the values
   reach the stylesheet as private custom properties: React through `style`, the HTML runtime
   `organization-chart` through CSSOM (core `organizationChartStyle`, shared by both). Without
   JavaScript the stylesheet's defaults apply.
4. **Wide charts scroll by composition.** The root is `max-content` wide with `min-inline-size:
   100%` (centered when it fits, starting at the inline start when it doesn't); `Scrollbar ›
   OrganizationChart` scrolls it. The reference centers with `justify-content: center` inside an
   overflow container, which cuts off the start of wide charts on phones; we don't copy that.
5. **Cards are content, not the library.** The reference's simple / standard / group cards are
   story markup composed of Avatar, IconButton, Menu and Label (until a Card / Paper and
   Typography exist: "Pending integrations").

## Consequences
- A chart costs no JavaScript in React; the HTML runtime and the stylesheet are each under 1 kB
  gzip (the CDN bundle grew by about 0.4 kB, all CSS by about 0.45 kB).
- Arbitrary line colors need `inherit` + `color`; arbitrary border styles (`double`, `groove`)
  aren't offered.
- Charts don't wrap or reflow on small screens (a tree keeps its shape): consumers wrap them in a
  Scrollbar, as the stories and docs do.
- Horizontal (left-to-right) trees and collapsible nodes are out of scope (the upstream has
  neither).
