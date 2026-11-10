# ADR-0056: Organization chart — zoom, fit and center through CSS `zoom` inside the Scrollbar

**Status:** Accepted (2026-11-10). Extends ADR-0036 (decision 4, "wide charts scroll by
composition") and ADR-0051; supersedes nothing.

## Context
Roadmap row 4.18.5 (owner, 2026-11-10: ApexTree must be complete) asks for ApexTree's zoom and
pan (`apexcharts.com/apextree/docs`: options, methods and "Zoom, Pan and Export", checked
2026-11-10): `enableZoomPan` (default `true`: Ctrl / ⌘ + wheel or a trackpad pinch zooms, a drag
pans, a plain wheel still scrolls the page), `enableToolbar` (zoom in / out / fit / export
buttons), graph methods `zoom(zoomFactor)`, `fitScreen()`, `centerOnNode(nodeId)`, and
`enableExpandCollapseZoom` / `maxZoomNodeSpan` (refit after a toggle). ApexTree draws an SVG and
moves a camera (its `viewBox`). Our chart is nested lists in the page's layout (ADR-0036), and
wide charts already scroll inside a composed Scrollbar (`Scrollbar › OrganizationChart`), which
the keyboard can scroll and which a native `<dialog>` or Tab can focus.

## Decision
1. **The zoom is CSS `zoom` on the chart's root, not a transform.** `zoom` scales layout, so the
   zoomed chart's real size is what the Scrollbar scrolls: scroll extents, `scrollIntoView`, the
   browser's own "scroll the focused element into view", and the centering of a chart narrower
   than its container (`min-inline-size: 100%` resolves against the unzoomed container) keep
   working without measuring. A `transform: scale()` on an inner wrapper keeps the unscaled
   layout box: zooming out leaves the old scroll area, zooming in overflows toward the inline
   start, which can't be scrolled to, and both need a sizer measured by script. Checked in
   Chromium, Firefox and WebKit (Playwright 1.64): `getBoundingClientRect()` is zoomed,
   `offsetWidth` / `offsetHeight` aren't, and `px` lengths in custom properties set inside the
   chart are zoomed. Core measures that write lengths back (the highlight path,
   `organizationChartPathStyle`) already convert with the box / offset ratio; Collapse
   (ADR-0044) now does too, so a branch opening in a zoomed chart animates to its real size
   (it used to measure a scaled box and animate to that size in layout px, twice the size at
   200%). Baseline: `zoom` is standardized in Chrome 128 and Firefox 126; Safari and older
   Chrome versions have the long-standing implementation, which scales layout the same way.
2. **The zoom level is state, like the collapsed nodes.** `zoom` is a `number` option
   (`data-ok-zoom`, default 1), clamped to `minZoom` (0.25) and `maxZoom` (2). The stylesheet reads
   `--_ok-org-zoom`, written next to the lengths (React `style`, the HTML runtime through CSSOM:
   `organizationChartStyle`), and applies `zoom` only to roots with `data-ok-zoom`, so charts
   without it keep their pixels. React: controlled `zoom` / `defaultZoom` / `onZoomChange` (every
   change, methods included, as `onCollapsedNodesChange`); it writes `data-ok-zoom` while
   `enableZoomPan` is on or the level isn't 1. HTML: the attribute is the state; the runtime
   writes it after a cancelable `ok:organization-chart:zoom` (`{ zoom, previous }`, user intent
   only).
3. **A core controller reports intent and keeps the view steady.**
   `createOrganizationChartZoom(root, options)` (both owners) finds the viewport (the nearest
   scrolling ancestor: the Scrollbar) and, with `enableZoomPan`, reports
   `onZoom(level)` for: Ctrl / ⌘ + wheel and trackpad pinches (`wheel` with `ctrlKey`, WebKit's
   `gesturechange`), always `preventDefault()`ed so the page doesn't zoom; **+** / **=**, **−**,
   **0** (reset) on a key press inside the viewport or the chart, unless the target is editable
   or a menu, listbox, grid or tree, and never with Ctrl / ⌘ / Alt (the browser's own zoom); and
   the toolbar. A plain wheel scrolls; touch pinches stay the page's zoom (no gesture of ours).
   The owner writes the level and calls `update({ zoom })`; the controller then scrolls the
   viewport so the content point under the pointer (wheel, pinch) or at the viewport's center
   (keys, toolbar, methods) stays where it was. Drag to pan: a mouse press outside interactive
   content that moves more than 4px scrolls the viewport (`data-ok-panning` while it lasts: a
   grabbing cursor, no text selection) and the click that ends it is `preventDefault()`ed, so
   `expandCollapseOnNodeClick` ignores it. Touch and pen keep native scrolling.
4. **Fit and center are scroll operations.** `fitScreen()` sets the largest level ≤ 1 (and ≥
   `minZoom`) at which the root node's box fits the viewport's content box: its width always, its
   height when the viewport doesn't grow with its content (checked by measuring the viewport at
   the minimum level), then scrolls to the start. Fit never enlarges a chart past 100%: text
   would grow past the page's size for a small chart. `centerOnNode(id)` expands the node's
   collapsed ancestors (no events), waits for their Collapse animations, then scrolls the
   viewport (only the viewport, not the page) so the node's label is centered, smoothly unless
   reduced motion. `zoom(factor)` multiplies the level by `1 + factor` (ApexTree's sign: positive
   zooms in); `zoomIn()` / `zoomOut()` multiply or divide by 1.25, so they undo each other.
   Methods emit no HTML events.
5. **The toolbar is a composed part outside the chart.** The root is a `ul` and the toolbar must
   not scroll away, so it is a sibling the app places (above the Scrollbar in the stories):
   `div[data-ok-organization-chart-toolbar="<chart id>"][role=group][aria-label]` with
   IconButtons `data-ok-organization-chart-zoom-in` / `-zoom-out` / `-fit` / `-reset` (names
   "Zoom in", "Zoom out", "Fit to screen", "Reset zoom") and an
   `output[data-ok-organization-chart-zoom-value]` (implicit `status`: the level is announced
   politely). React: `OrganizationChartToolbar` with `chartId` and the four label props. The
   chart's controller handles the toolbar's clicks through one document listener (toolbars
   mounted later work) and writes the derived state in both implementations: the value text and
   `aria-disabled` on zoom in / out at the limits (not `disabled`, which would drop the focus).
   React renders neither, as with the Carousel's arrows (ADR-0033).
6. **Focus stays visible under zoom.** Tab into a zoomed-in chart scrolls the focused control
   into view natively (layout zoom). Reduced motion turns the smooth scroll of `centerOnNode` and
   `highlightNode` into a jump; zoom changes are never animated.

## Consequences
- No new dependencies; about 1.5 kB of JavaScript per implementation and a few CSS rules.
- Zoom needs a scroll container to pan and to keep the anchor: without a Scrollbar the chart
  still zooms (the page scrolls) but drag-to-pan does nothing.
- Not offered: `enableExpandCollapseZoom` / `maxZoomNodeSpan` (refitting after every toggle moves
  the view under the pointer, against WCAG 3.2.2's spirit; apps call `fitScreen()` from
  `onExpand` if they want it), `exportToSvg()` and the toolbar's export button (the chart is HTML,
  not SVG: printing or a screenshot covers it), `viewPortWidth` / `viewPortHeight` / `paddingX` /
  `paddingY` (an SVG coordinate space; the Scrollbar's padding frames the chart), semantic zoom.
- Below 100% the toggles and the controls in labels are smaller than the 24px target size
  (WCAG 2.5.8): the user chose that view, as with the browser's zoom, and **0** or **Reset zoom**
  returns to full size. Tests scan with axe at 100%.
- Pixel parity is unchanged: `zoom` lives in `style` (ignored by parity) and the attribute is
  written by both owners.
