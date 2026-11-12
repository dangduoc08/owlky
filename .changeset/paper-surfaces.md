---
"@owlky/core": minor
"@owlky/styles": minor
"@owlky/react": minor
"@owlky/html": minor
---

The library's own surfaces are Papers (ADR-0066). Every popover root (Popover, Menu, Select, Autocomplete, the pickers, Walktour steps, the Editor's bubble menu and mentions, Data grid panels), the Dialog paper (`[data-ok-dialog-paper]`), the Drawer content (`[data-ok-drawer-content]`) and the Map controls and popup contents now carry `data-ok-paper` right after their own marker; their look doesn't change. Popover, Menu and Dialog take `elevation` (0–24, `data-ok-elevation` on the popover or the dialog paper) to use one of Paper's shadows instead of the dropdown or dialog shadow, and `TableContainer` takes `component` (`component={Paper}` puts a table on a paper). Core adds `surfacePaperAttributes()`.

Migration (pre-0.1.0: nothing is published yet, but the markup changes): in HTML, add `data-ok-paper` right after `data-ok-popover`, `data-ok-dialog-paper`, `data-ok-drawer-content`, `data-ok-map-control` and `data-ok-map-popup-content` (without it they look the same, but `data-ok-elevation` needs it). CSS or scripts that target `[data-ok-paper]` now reach these overlays too: scope them, for example with `:not([data-ok-popover], [data-ok-dialog-paper], [data-ok-drawer-content])`. Paper's `box-shadow` transition now also runs on these surfaces. Owlky is before 0.1.0, so it is versioned as a minor change and ships with the first release.
