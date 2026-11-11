/*
 * Parts of each component's anatomy (ADR-0049): every `data-ok-*` name that isn't an option or a
 * root, with what it is and a description. Type only: nothing here reaches a bundle. The API
 * reference (`scripts/api-reference.mjs`) reads these interfaces (one per spec, named
 * `<Spec>Parts`) and their comments; `pnpm check:api` fails when a name in a snippet, a spec's
 * anatomy or a stylesheet is declared nowhere.
 *
 * - `Part<"div">`         an element of the component (the tags it may be);
 * - `State`               a presence attribute for a state, written by the runtime or React;
 * - `Value<"a" | "b">`    an attribute with a value (`Value<string>`: free text, JSON, a URL…);
 * - `Trigger<"id">`       an element anywhere on the page that acts on the component named by
 *                         its value (`""`: the closest one).
 */

/** An element of the component; `Tag` lists the elements it may be. */
export type Part<Tag extends string = string> = { readonly part: Tag };
/** A presence attribute for a state. */
export type State = { readonly state: true };
/** An attribute that takes `V`. */
export type Value<V extends string = string> = { readonly value: V };
/** An element that acts on the component its value names. */
export type Trigger<V extends string = "id"> = { readonly trigger: V };

/** Attributes any component may carry. */
export interface CommonParts {
  /** Applies a color preset to this element and everything inside it, such as `purple`. */
  "data-ok-preset": Value<string>;
  /** `off` keeps the HTML runtime away from this element and everything inside it. React writes it on interactive roots. */
  "data-ok-runtime": Value<"off">;
  /** Applies a color scheme to this element and everything inside it. */
  "data-ok-theme": Value<"light" | "dark">;
}

/** Accordion: parts, states, values and triggers. */
export interface AccordionParts {
  /** A row of actions under the details. */
  "data-ok-accordion-actions": Part<"div">;
  /** The content shown while the accordion is open. */
  "data-ok-accordion-details": Part<"div">;
  /** The expand icon at the end of the summary. */
  "data-ok-accordion-icon": Part<"span">;
  /** The plus icon variant of the expand icon. */
  "data-ok-accordion-plus": Part<"svg">;
  /** The heading that opens and closes the accordion. Disabled accordions mark it with `aria-disabled`. */
  "data-ok-accordion-summary": Part<"summary">;
}

/** Alert: parts, states, values and triggers. */
export interface AlertParts {
  /** Actions at the end, such as a close button. */
  "data-ok-alert-action": Part<"div">;
  /** A button inside the alert that closes it. */
  "data-ok-alert-close": Trigger<"">;
  /** The severity icon at the start. Leave it out for no icon. */
  "data-ok-alert-icon": Part<"div">;
  /** The message, after the title. */
  "data-ok-alert-message": Part<"div">;
  /** The bold title above the message. */
  "data-ok-alert-title": Part<"div">;
}

/** Autocomplete: parts, states, values and triggers. */
export interface AutocompleteParts {
  /** The button that clears the value. */
  "data-ok-autocomplete-clear": Trigger<"">;
  /** The "+n" text after the visible chips when `limitTags` hides some. */
  "data-ok-autocomplete-more": Part<"span">;
  /** The text shown while options load (`loading`). */
  "data-ok-autocomplete-loading": Part<"div">;
  /** The text shown when no option matches. */
  "data-ok-autocomplete-no-options": Part<"div">;
  /** The popover surface that holds the listbox. */
  "data-ok-autocomplete-paper": Part;
  /** HTML only: the template of the chip each value of a multiple autocomplete shows. */
  "data-ok-autocomplete-tag": Part<"template">;
  /** The button that opens and closes the listbox. */
  "data-ok-autocomplete-toggle": Trigger<"">;
  /** The accessible name of the toggle button while the listbox is open. Default "Close". */
  "data-ok-label-close": Value<string>;
  /** The accessible name of the toggle button while the listbox is closed. Default "Open". */
  "data-ok-label-open": Value<string>;
  /** The index of a chip in the value, from `getItemProps` (`renderValue`). */
  "data-ok-item-index": Value<string>;
}

/** Avatar: parts, states, values and triggers. */
export interface AvatarParts {
  /** The fallback icon, shown when the picture fails or there is none. */
  "data-ok-avatar-fallback": Part<"span">;
  /** The "+n" avatar of a group that shows more avatars than `max`. */
  "data-ok-avatar-surplus": Part;
}

/** Backdrop: parts, states, values and triggers. */
export interface BackdropParts {
  /** Closes the backdrop whose `id` it names, or, without a value, the backdrop it sits in. */
  "data-ok-backdrop-close": Trigger<"id" | "">;
  /** Opens the backdrop whose `id` it names. */
  "data-ok-backdrop-open": Trigger<"id">;
}

/** Badge: parts, states, values and triggers. */
export interface BadgeParts {
  /** The badge itself: the count, dot or status on the child's corner. */
  "data-ok-badge-badge": Part<"span">;
}

/** Breadcrumbs: parts, states, values and triggers. */
export interface BreadcrumbsParts {
  /** The item that stands for the hidden middle of a long trail. */
  "data-ok-breadcrumbs-collapsed": Part<"li">;
  /** A dot of the collapsed item's button. */
  "data-ok-breadcrumbs-dot": Part<"span">;
  /** The button that shows the hidden items. */
  "data-ok-breadcrumbs-expand": Part<"button">;
  /** One crumb: a link, or the text of the current page. */
  "data-ok-breadcrumbs-item": Part<"li">;
  /** The ordered list of crumbs. */
  "data-ok-breadcrumbs-list": Part<"ol">;
  /** The separator between two crumbs. Hidden from assistive technology. */
  "data-ok-breadcrumbs-separator": Part<"li">;
  /** Set once the hidden items are shown. */
  "data-ok-expanded": State;
}

/** Button: parts, states, values and triggers. */
export interface ButtonParts {
  /** The decorative icon before (`start`) or after (`end`) the label. */
  "data-ok-button-icon": Value<"start" | "end">;
  /** The label: the button's accessible name. */
  "data-ok-button-label": Part<"span">;
  /** Holds the loading indicator while `data-ok-loading` is set. */
  "data-ok-button-loader": Part<"span">;
  /** The default loading indicator: a circular progress. */
  "data-ok-button-spinner": Part<"span">;
}

/** Card: parts, states, values and triggers. */
export interface CardParts {
  /** Makes the media and content one action: a button, or a link with `href`. */
  "data-ok-card-action-area": Part<"button" | "a">;
  /** The padded content. */
  "data-ok-card-content": Part<"div">;
  /** The header: avatar, title, subheader and action. */
  "data-ok-card-header": Part<"div">;
  /** The action at the end of the header, such as an icon button. */
  "data-ok-card-header-action": Part<"div">;
  /** The avatar at the start of the header. */
  "data-ok-card-header-avatar": Part<"div">;
  /** Holds the title and the subheader. */
  "data-ok-card-header-content": Part<"div">;
  /** The second line of the header, in the secondary text color. */
  "data-ok-card-header-subheader": Part<"span">;
  /** The main line of the header. */
  "data-ok-card-header-title": Part<"span">;
  /** Media at the card's edge: an `img`, `video`, `picture`, `iframe` or `audio`, or an element that holds a cover image. */
  "data-ok-card-media": Part;
  /** The decorative cover image inside a media element that isn't media itself. */
  "data-ok-card-media-image": Part<"img">;
}

/** Carousel: parts, states, values and triggers. */
export interface CarouselParts {
  /** Set by the runtime while auto scroll plays. */
  "data-ok-auto-scrolling": State;
  /** Options per breakpoint, as JSON, such as `{"md": {"slidesToShow": 2}}`. */
  "data-ok-breakpoints": Value<string>;
  /** The row of slides inside the viewport. */
  "data-ok-carousel-container": Part<"div">;
  /** The "1/8" counter of the current slide. */
  "data-ok-carousel-counter": Part<"span">;
  /** One dot: a button that shows its slide. */
  "data-ok-carousel-dot": Part<"button">;
  /** A visually hidden live region that announces the current slide. */
  "data-ok-carousel-live": Part<"span">;
  /** The button to the next slide. */
  "data-ok-carousel-next": Part;
  /** The layer that moves more slowly than its slide, with the `parallax` effect. */
  "data-ok-carousel-parallax": Part;
  /** The button that plays and pauses autoplay. */
  "data-ok-carousel-play": Part<"button">;
  /** One of the play button's two labels; the runtime shows the one that fits. */
  "data-ok-carousel-play-label": Value<"play" | "pause">;
  /** The button to the previous slide. */
  "data-ok-carousel-prev": Part<"button">;
  /** One slide. */
  "data-ok-carousel-slide": Part<"div">;
  /** Positions the overlay controls over the slides. */
  "data-ok-carousel-stage": Part<"div">;
  /** One thumbnail: a button that shows its slide. */
  "data-ok-carousel-thumb": Part<"button">;
  /** The scroll container. Arrow keys, Home and End move between slides. */
  "data-ok-carousel-viewport": Part<"div">;
  /** Set by the runtime while a pointer drags the slides. */
  "data-ok-dragging": State;
  /** Set by the runtime on each slide that is in view. */
  "data-ok-in-view": State;
  /** Set by the runtime while `loop` is on and the slides can loop. */
  "data-ok-looping": State;
  /** Set by the runtime while autoplay plays. */
  "data-ok-playing": State;
  /** Set by the runtime while a pointer presses the viewport. */
  "data-ok-pointer-down": State;
  /** Set by the runtime once the carousel is set up. */
  "data-ok-ready": State;
  /** Set by the runtime while the slides scroll. */
  "data-ok-scrolling": State;
  /** Slides in view from the `md` breakpoint up. */
  "data-ok-slides-to-show-md": Value<string>;
  /** Slides in view from the `sm` breakpoint up. */
  "data-ok-slides-to-show-sm": Value<string>;
}

/** Chart: parts, states, values and triggers. */
export interface ChartParts {
  /** On an annotation list item: a vertical line (`x`), a horizontal line (`y`) or a point. */
  "data-ok-annotation": Value<"x" | "y" | "point">;
  /** Shows the axis titles of a radar chart. */
  "data-ok-axis-titles": State;
  /** Marks a Sankey link that loops back to an earlier node. */
  "data-ok-back": State;
  /** Track colors behind the bars, palette names separated by spaces, such as `info-lighter warning-lighter`. */
  "data-ok-background-bar-colors": Value<string>;
  /** The `id` of the chart this brush chart controls. */
  "data-ok-brush-target": Value<string>;
  /** The highlight of the active point or category. */
  "data-ok-chart-active": Part<"g">;
  /** The highlight of the active heatmap or treemap cell. */
  "data-ok-chart-active-cell": Part<"rect">;
  /** The highlight of the active Sankey link. */
  "data-ok-chart-active-link": Part<"path">;
  /** The marker of the active point: a circle, or a path for other shapes. */
  "data-ok-chart-active-marker": Part<"circle" | "path">;
  /** The highlight of the active slice. */
  "data-ok-chart-active-slice": Part<"path">;
  /** A tree chart: the ring around the active node; sunburst charts: the active arc's outline. */
  "data-ok-chart-active-node": Part<"circle" | "path" | "rect">;
  /** One arc of a sunburst chart (the drilled node: the center disc). */
  "data-ok-chart-arc": Part<"path">;
  /** Geo charts: the colors of the value classes, separated by spaces. */
  "data-ok-colors": Part<"figure">;
  /** Geo charts: the feature property that holds the region id. */
  "data-ok-join-by": Part<"figure">;
  /** Geo charts, `threshold` method: the class breaks, separated by semicolons. */
  "data-ok-scale-thresholds": Part<"figure">;
  /** Geo charts: on a region without a value; drawn in the neutral background. */
  "data-ok-no-data": Part<"path">;
  /** Geo charts: one region's shape or hex tile. The value is the region's id; `data-ok-no-data` when it has no value. */
  "data-ok-chart-region": Part<"path">;
  /** Geo charts: the group behind the regions that holds the sphere and the graticule. */
  "data-ok-chart-geo-background": Part<"g">;
  /** Geo charts: the outline of the globe behind the regions (`sphere`). */
  "data-ok-chart-sphere": Part<"path">;
  /** Geo charts: lines of longitude and latitude (`graticule`). */
  "data-ok-chart-graticule": Part<"path">;
  /** Geo charts: the id of the JSON `<script>` element with the GeoJSON (HTML only). */
  "data-ok-geometry": Part<"figure">;
  /** Geo charts: the cell of a region in a hex layout, `column,row` (on the table's row header). */
  "data-ok-cell": Part<"th">;
  /** Geo charts: the short text of a region's hex tile (on the table's row header). */
  "data-ok-label": Part<"th">;
  /** One cell of an icicle chart. */
  "data-ok-chart-icicle-cell": Part<"rect">;
  /** Sunburst and icicle charts: the controls before the plot, a **Back** button and the drilled path (a status). */
  "data-ok-chart-drill": Part<"div">;
  /** Sunburst charts: the drilled path, a status region (empty when not drilled). */
  "data-ok-chart-drill-path": Part<"span">;
  /** Sunburst charts: zooms out one level. `hidden` while not drilled. */
  "data-ok-chart-drill-up": Part<"button">;
  /** The name of a sunburst arc or an icicle cell: white on strong shades (`inside`), primary text on pale ones (`plain`). */
  "data-ok-chart-partition-label": Value<"inside" | "plain">;
  /** Sunburst and icicle charts: the id of the node zoomed into. Written by the chart. */
  "data-ok-drill-node": Value<string>;
  /** A tree chart: one link of the path from the root to the active node. */
  "data-ok-chart-active-path": Part<"path">;
  /** A tree chart: the link from a node to its parent. */
  "data-ok-chart-tree-link": Part<"path">;
  /** A tree chart: one node. */
  "data-ok-chart-tree-node": Part<"circle">;
  /** On a tree node: its children are hidden. */
  "data-ok-collapsed": State;
  /** Tree charts: the ids of the collapsed nodes, separated by `;`. Written by the chart. */
  "data-ok-collapsed-nodes": Value<string>;
  /** One drawn annotation: a line, a band or a point. */
  "data-ok-chart-annotation": Value<"x" | "y" | "point">;
  /** The band of a range annotation. */
  "data-ok-chart-annotation-band": Part<"rect">;
  /** The text of an annotation. */
  "data-ok-chart-annotation-label": Part<"text">;
  /** The group that holds every drawn annotation. */
  "data-ok-chart-annotation-layer": Part<"g">;
  /** The line of an annotation. */
  "data-ok-chart-annotation-line": Part<"line">;
  /** The marker of a point annotation. */
  "data-ok-chart-annotation-marker": Part<"circle">;
  /** The background of an annotation's label. */
  "data-ok-chart-annotation-tag": Part<"rect">;
  /** The authored list of annotations, after the data table. Visually hidden once drawn. */
  "data-ok-chart-annotations": Part<"ul">;
  /** The filled area of an area series. */
  "data-ok-chart-area": Part<"path">;
  /** An axis. */
  "data-ok-chart-axis": Value<"x" | "y">;
  /** The title of an axis: the value axes' are rotated; `x` marks the x axis title. */
  "data-ok-chart-axis-title": Value<"" | "x">;
  /** A band of a range area or a range bar. */
  "data-ok-chart-band": Part<"rect">;
  /** One bar. */
  "data-ok-chart-bar": Part<"path">;
  /** One half of a box plot's box. */
  "data-ok-chart-box": Value<"upper" | "lower">;
  /** One track behind a bar (`backgroundBars`, `backgroundBarColors`). */
  "data-ok-chart-background-bar": Part<"rect">;
  /** The group of tracks behind the bars, before the crosshair. */
  "data-ok-chart-background-bars": Part<"g">;
  /** A grid stripe between two horizontal (\`row\`) or vertical (\`column\`) grid positions. */
  "data-ok-chart-stripe": Value<"row" | "column">;
  /** The selected window of a brush chart. */
  "data-ok-chart-brush": Part<"g">;
  /** One bubble. */
  "data-ok-chart-bubble": Part<"circle">;
  /** The body of a candlestick: rising or falling. */
  "data-ok-chart-candle": Value<"up" | "down">;
  /** One heatmap or treemap cell. */
  "data-ok-chart-cell": Part<"rect">;
  /** The text of a cell. */
  "data-ok-chart-cell-label": Part<"text">;
  /** The center text of a donut or a radial bar. */
  "data-ok-chart-center": Part<"g">;
  /** The label of the center text. */
  "data-ok-chart-center-label": Part<"text">;
  /** The value of the center text. */
  "data-ok-chart-center-value": Part<"text">;
  /** A waterfall connector: the dashed line from the end of a bar to the next bar. */
  "data-ok-chart-connector": Part<"line">;
  /** The crosshair that follows the pointer. */
  "data-ok-chart-crosshair": Part<"g">;
  /** One line of the crosshair. */
  "data-ok-chart-crosshair-line": Part<"line">;
  /** One end of a dumbbell: the `start` (a ring) or the `end` (a disc). */
  "data-ok-chart-dumbbell": Value<"start" | "end">;
  /** The line between the two ends of a dumbbell. */
  "data-ok-chart-dumbbell-line": Part<"line">;
  /** HTML: the data, as a table. Visually hidden once the chart is drawn; without JavaScript it shows. */
  "data-ok-chart-data": Part<"table">;
  /** One data label. */
  "data-ok-chart-data-label": Part<"text">;
  /** The background of a data label. */
  "data-ok-chart-data-label-badge": Part<"rect">;
  /** The group of data labels. Only labels that fit are drawn. */
  "data-ok-chart-data-labels": Part<"g">;
  /** Crossfilter: the controls after the plot, a **Clear filter** button and a status. */
  "data-ok-chart-filter": Part<"div">;
  /** Crossfilter: the tint behind a filtered category (a band, a slice halo or a cell frame). */
  "data-ok-chart-filter-band": Part<"rect" | "path">;
  /** Crossfilter: clears the group's filter. `hidden` while the group has none. */
  "data-ok-chart-filter-clear": Part<"button">;
  /** Crossfilter: the group of tints behind the filtered categories (`highlight`), under the series. */
  "data-ok-chart-filter-layer": Part<"g">;
  /** Crossfilter: a visually hidden live region that announces the filter this chart set or cleared. */
  "data-ok-chart-filter-status": Part<"span">;
  /** The grid. */
  "data-ok-chart-grid": Part<"g">;
  /** One grid line. */
  "data-ok-chart-grid-line": Part<"line">;
  /** A guide line of a slope or funnel chart. */
  "data-ok-chart-guide": Part<"line">;
  /** A handle of the brush window or the navigator. */
  "data-ok-chart-handle": Part<"rect">;
  /** The legend. Absent with one series or `legend="none"`. */
  "data-ok-chart-legend": Part<"div">;
  /** One legend item: a button that hides or shows its series, or a label with \`disableLegendToggle\`. */
  "data-ok-chart-legend-item": Part<"button" | "span">;
  /** The color marker of a legend item. */
  "data-ok-chart-legend-marker": Part<"span">;
  /** The value next to a legend item. */
  "data-ok-chart-legend-value": Part<"span">;
  /** The line of a series. */
  "data-ok-chart-line": Part<"path">;
  /** One Sankey link. */
  "data-ok-chart-link": Part<"path">;
  /** The marker of a point: a circle, or a path for other shapes. */
  "data-ok-chart-marker": Part<"circle" | "path">;
  /** On a data grid: the chart panel's model, as JSON. */
  "data-ok-chart-model": Value<string>;
  /** The navigator of a stock chart. */
  "data-ok-chart-navigator": Part<"g">;
  /** The frame of the navigator's window. */
  "data-ok-chart-navigator-frame": Part<"rect">;
  /** One Sankey node. */
  "data-ok-chart-node": Part<"rect">;
  /** The label of a Sankey node. */
  "data-ok-chart-node-label": Part<"text">;
  /** The pane a series is drawn in (stock charts), by index. */
  "data-ok-chart-pane": Value<string>;
  /** The line between two panes. */
  "data-ok-chart-pane-divider": Part<"line">;
  /** The title of a pane. */
  "data-ok-chart-pane-title": Part<"text">;
  /** The group of pane titles. */
  "data-ok-chart-pane-titles": Part<"g">;
  /** The plot area that holds the SVG. */
  "data-ok-chart-plot": Part<"div">;
  /** One ring of a radial bar. */
  "data-ok-chart-radial": Part<"path">;
  /** The outlines of the selected points, slices, blocks and cells. Absent without a selection. */
  "data-ok-chart-selected": Part<"g">;
  /** The outline of one selected point (a ring), block or cell (a frame), or slice. */
  "data-ok-chart-selected-mark": Part<"circle" | "rect" | "path">;
  /** The rectangle drawn while selecting a zoom window. */
  "data-ok-chart-selection": Part<"rect">;
  /** On a waterfall bar: a step that raises (`up`) or lowers (`down`) the total, a `total` or a `subtotal`. */
  "data-ok-chart-step": Value<"up" | "down" | "total" | "subtotal">;
  /** All the marks of one category of a waffle or unit chart. */
  "data-ok-chart-unit-group": Part<"g">;
  /** A mark of a waffle or unit chart. */
  "data-ok-chart-unit-cell": Part<"rect" | "circle" | "path">;
  /** An empty cell of a split waffle tile. */
  "data-ok-chart-unit-track": Part<"rect" | "circle" | "path">;
  /** A waffle tile's name, or a cluster's label. */
  "data-ok-chart-unit-title": Part<"text">;
  /** A dot of one observation in a beeswarm chart. */
  "data-ok-chart-bee": Part<"circle" | "path">;
  /** A violin's density outline. */
  "data-ok-chart-violin": Part<"path">;
  /** A violin's five-number box. */
  "data-ok-chart-violin-box": Part<"rect">;
  /** A violin's median line. */
  "data-ok-chart-violin-median": Part<"line">;
  /** A dot for one observation of a violin. */
  "data-ok-chart-violin-point": Part<"circle" | "path">;
  /** A violin's whisker. */
  "data-ok-chart-violin-whisker": Part<"line">;
  /** On a violin's data cell: its observations, separated by spaces. */
  "data-ok-samples": Value<string>;
  /** On a violin's data cell without observations: its curve as `value:weight` pairs. */
  "data-ok-density": Value<string>;
  /** A streamgraph band. */
  "data-ok-chart-stream-band": Part<"path">;
  /** The veil over a streamgraph while one band is active (with `tooltip="point"`). */
  "data-ok-chart-stream-veil": Part<"rect">;
  /** The group of one series. */
  "data-ok-chart-series": Part<"g">;
  /** The group of the series of one kind: areas, bars, lines, then points. */
  "data-ok-chart-series-group": Part<"g">;
  /** One pie or donut slice. */
  "data-ok-chart-slice": Part<"path">;
  /** A visually hidden live region that announces failed downloads. */
  "data-ok-chart-status": Part<"span">;
  /** A gradient stop of a gradient area. */
  "data-ok-chart-stop": Part<"stop">;
  /** The drawing. */
  "data-ok-chart-svg": Part<"svg">;
  /** The background of an axis tag. */
  "data-ok-chart-tag": Part<"rect">;
  /** The text of an axis tag. */
  "data-ok-chart-tag-label": Part<"text">;
  /** The group of axis tags. */
  "data-ok-chart-tags": Part<"g">;
  /** One axis label. */
  "data-ok-chart-tick": Part<"text">;
  /** A toolbar button and what it does: zoom, pan, or download the chart as SVG, PNG or CSV. */
  "data-ok-chart-tool": Value<"zoomIn" | "zoomOut" | "reset" | "pan" | "svg" | "png" | "csv">;
  /** The icon of a toolbar button. */
  "data-ok-chart-tool-icon": Part<"svg">;
  /** The toolbar. */
  "data-ok-chart-toolbar": Part<"div">;
  /** The tooltip; on a \`template\` child of the chart (HTML), its custom content. */
  "data-ok-chart-tooltip": Part<"div" | "template">;
  /** In a custom tooltip template: what the element receives, as text (\`row\` is repeated per value). */
  "data-ok-chart-tooltip-slot": Value<"title" | "state" | "row" | "name" | "value" | "marker">;
  /** The color marker of a tooltip row. */
  "data-ok-chart-tooltip-marker": Part<"span">;
  /** One row of the tooltip. */
  "data-ok-chart-tooltip-row": Part<"div">;
  /** The rows of the tooltip. */
  "data-ok-chart-tooltip-rows": Part<"div">;
  /** The tooltip's "Selected" line, when its item has a selected point. */
  "data-ok-chart-tooltip-state": Part<"div">;
  /** The title of the tooltip. */
  "data-ok-chart-tooltip-title": Part<"div">;
  /** One pattern definition (\`fill="pattern"\`, \`fillPattern\`, \`colorBlindMode\`): its style. */
  "data-ok-chart-pattern": Value<
    "slantedLines" | "squares" | "circles" | "horizontalLines" | "verticalLines"
  >;
  /** The lines, squares or dots of a pattern. */
  "data-ok-chart-pattern-mark": Part<"path" | "circle">;
  /** The faint tint under a pattern's marks. */
  "data-ok-chart-pattern-tint": Part<"rect">;
  /** The value of a tooltip row. */
  "data-ok-chart-tooltip-value": Part<"span">;
  /** The track behind a radial bar. */
  "data-ok-chart-track": Part<"path">;
  /** The web of a radar chart. */
  "data-ok-chart-web": Part<"path">;
  /** A whisker of a box plot. */
  "data-ok-chart-whisker": Part<"line">;
  /** A wick of a candlestick. */
  "data-ok-chart-wick": Part<"line">;
  /** Colors per value range, such as `0 30 error; 30 70 warning`. */
  "data-ok-color-ranges": Value<string>;
  /** Marks a dashed series. */
  "data-ok-dashed": State;
  /** The group of linked charts this chart belongs to: they share the hover and the zoom. */
  "data-ok-group": Value<string>;
  /** On a data cell or a legend item: its position. */
  "data-ok-index": Value<string>;
  /** On a data table column: the indicator it computes, such as `sma`. */
  "data-ok-indicator": Value<string>;
  /** The indicators of a stock chart. */
  "data-ok-indicators": Value<string>;
  /** The locale that formats numbers and dates, such as `en-US`. */
  "data-ok-locale": Value<string>;
  /** Marks a major tick of a date axis. */
  "data-ok-major": State;
  /** On a value axis group: the axis is on the right of the plot. */
  "data-ok-opposite": State;
  /** Legend names instead of the series' names, separated by \`;\`. */
  "data-ok-custom-legend-items": Value<string>;
  /** Row stripe colors separated by spaces: palette names, \`grey\` or \`transparent\`. */
  "data-ok-grid-row-colors": Value<string>;
  /** Column stripe colors separated by spaces: palette names, \`grey\` or \`transparent\`. */
  "data-ok-grid-column-colors": Value<string>;
  /** Dumbbell marker colors: a start and an end color per series, pairs separated by \`;\`, such as \`info success\`. */
  "data-ok-dumbbell-colors": Value<string>;
  /** Markers on single points, such as \`0 3 error star 8; 1 2\`. */
  "data-ok-discrete-markers": Value<string>;
  /** On a data table column header: the series' marker shape. */
  "data-ok-marker-shape": Value<
    "circle" | "square" | "triangle" | "diamond" | "cross" | "plus" | "star"
  >;
  /** On a data table column header: the series' pattern. */
  "data-ok-fill-pattern": Value<
    "slantedLines" | "squares" | "circles" | "horizontalLines" | "verticalLines"
  >;
  /** On a data table column header: the series' line width in px. */
  "data-ok-stroke-width": Value<string>;
  /** On a data table column header: the series' dash length in px. */
  "data-ok-dash-array": Value<string>;
  /** On a marker, a legend marker or a tooltip marker: the series' marker shape. */
  "data-ok-shape": Value<"square" | "triangle" | "diamond" | "cross" | "plus" | "star">;
  /** On a legend or tooltip marker: the series' pattern. */
  "data-ok-pattern": Value<
    "slantedLines" | "squares" | "circles" | "horizontalLines" | "verticalLines"
  >;
  /** On a data table header cell: which value of a point the column holds. */
  "data-ok-part": Value<
    | "count"
    | "min"
    | "q1"
    | "median"
    | "q3"
    | "max"
    | "low"
    | "high"
    | "y"
    | "z"
    | "source"
    | "target"
    | "name"
    | "parent"
  >;
  /** Set by the runtime once the chart is drawn: the data table hides. */
  "data-ok-ready": State;
  /** On a waterfall data cell: the bar shows the running total (`total` or `subtotal`); the cell's text is that total. */
  "data-ok-sum": Value<"total" | "subtotal">;
  /** The label of the total in a donut's or a radial bar's center. */
  "data-ok-total-label": Value<string>;
  /** Text before every value, such as `$`. */
  "data-ok-value-prefix": Value<string>;
  /** Text after every value, such as `%`. */
  "data-ok-value-suffix": Value<string>;
  /** On an annotation: the x value. */
  "data-ok-x": Value<string>;
  /** On an annotation: the end of an x range. */
  "data-ok-x2": Value<string>;
  /** On an annotation: the y value. */
  "data-ok-y": Value<string>;
  /** The title of the y axis. */
  "data-ok-y-title": Value<string>;
  /** On a data table column header: the index of the value axis its series is drawn on. */
  "data-ok-y-axis": Value<string>;
  /** The value axes, such as `min 0 title Sales; opposite logarithmic title Visits`. */
  "data-ok-yaxis": Value<string>;
  /** The title of the x axis, drawn under its labels. */
  "data-ok-x-title": Value<string>;
  /** On an annotation: the end of a y range. */
  "data-ok-y2": Value<string>;
}

/** Checkbox: parts, states, values and triggers. */
export interface CheckboxParts {
  /** The icon of one state. The checkbox shows the one that matches. */
  "data-ok-checkbox-icon": Value<"unchecked" | "checked" | "indeterminate">;
  /** The native checkbox. It covers the control, invisible, and takes `name`, `value`, `checked`, `disabled` and `required`. */
  "data-ok-checkbox-input": Part<"input">;
  /** The check mark inside the checked icon. */
  "data-ok-checkbox-mark": Part<"path">;
}

/** Chip: parts, states, values and triggers. */
export interface ChipParts {
  /** The chip's main element: a button when the chip is clickable, a link (`a` with `href`) for a link chip, else a `span`. */
  "data-ok-chip-action": Part<"button" | "a" | "span">;
  /** The delete button. */
  "data-ok-chip-delete": Part<"button">;
  /** The icon at the start. */
  "data-ok-chip-icon": Part<"span">;
  /** The label. */
  "data-ok-chip-label": Part<"span">;
}

/** Circular progress: parts, states, values and triggers. */
export interface CircularProgressParts {
  /** The circle that draws the progress. */
  "data-ok-circular-progress-circle": Part<"circle">;
  /** The drawing. */
  "data-ok-circular-progress-svg": Part<"svg">;
}

/** Code editor: parts, states, values and triggers. */
export interface CodeEditorParts {
  /** The element the editor mounts in. */
  "data-ok-code-editor-content": Part<"div">;
  /** Shown while the editor loads. */
  "data-ok-code-editor-loading": Part<"div">;
  /** HTML only: one file of a multi-model editor, with its path and language. */
  "data-ok-code-editor-model": Part;
  /** The element the diff editor mounts in. */
  "data-ok-diff-editor-content": Part<"div">;
  /** Shown while the diff editor loads. */
  "data-ok-diff-editor-loading": Part<"div">;
  /** Editor options, as JSON. */
  "data-ok-options": Value<string>;
  /** Set by the runtime: where loading the editor stands. */
  "data-ok-status": Value<"loading" | "ready" | "error">;
}

/** Collapse: parts, states, values and triggers. */
export interface CollapseParts {
  /** A button or a checkbox that opens and closes the collapses whose ids it names. */
  "data-ok-collapse-toggle": Trigger<"id">;
  /** The easing of the opening animation, such as `ease-in-out`. */
  "data-ok-easing": Value<string>;
  /** The easing of the closing animation. */
  "data-ok-easing-exit": Value<string>;
  /** The duration of the closing animation, in milliseconds. */
  "data-ok-timeout-exit": Value<string>;
}

/** Data grid: parts, states, values and triggers. */
export interface DataGridParts {
  /** On a header cell: `false` keeps the column out of the aggregation menu. */
  "data-ok-aggregable": Value<"false">;
  /** The aggregation (field to function), as JSON. */
  "data-ok-aggregation-model": Value<string>;
  /**
   * Where groups show their aggregated values, as JSON by level: `root` and each grouped field, to
   * `inline`, `footer` or `null`. React writes it from `getAggregationPosition`.
   */
  "data-ok-aggregation-position": Value<string>;
  /** Set by the runtime on the first cell after the hidden columns of the column window. */
  "data-ok-col-start": State;
  /** The total number of rows. HTML: written by the grid. */
  "data-ok-count": Value<string>;
  /** Set by the runtime on cells another cell spans over. */
  "data-ok-covered": State;
  /** On a column menu item: what it does. */
  "data-ok-data-grid-action": Value<"group" | "aggregate-none" | "aggregate-<fn>">;
  /** The function name in an aggregated column's header. */
  "data-ok-data-grid-aggregation-label": Part<"span">;
  /** The footer row with the aggregated values. */
  "data-ok-data-grid-aggregation-row": Part;
  /** HTML only: the template of the "is any of" filter input. */
  "data-ok-data-grid-any-of": Part<"template">;
  /** The rows. */
  "data-ok-data-grid-body": Part<"div">;
  /**
   * HTML only, with `data-ok-auto-generate`: the data the runtime builds the columns and rows from
   * (header cells name the fields, or carry `data-ok-field`); removed once read.
   */
  "data-ok-data-grid-data": Part<"table">;
  /** HTML only: the template of a column's custom cells, named by its field. */
  "data-ok-data-grid-cell": Part<"template">;
  /** Several charts: the chart the panel edits. */
  "data-ok-active-chart-id": Value<string>;
  /** Several charts: a chart's id, on its `data-ok-data-grid-chart` region. */
  "data-ok-chart-id": Value<string>;
  /** Several charts: every chart's model, by chart id, as JSON. */
  "data-ok-chart-models": Value<string>;
  /** The chart panel's chart. */
  "data-ok-data-grid-chart": Part<"div">;
  /** The chart panel's switch that lets a category selection filter the grid (`crossFilter`). */
  "data-ok-data-grid-chart-cross-filter": Part;
  /** With cell selection: the chart panel's button that charts the selected cells. */
  "data-ok-data-grid-chart-range": Part<"button">;
  /** The chart panel's switch for item labels. */
  "data-ok-data-grid-chart-item-label": Part;
  /** The chart panel's switch for stacked series. */
  "data-ok-data-grid-chart-stacked": Part;
  /** The chart panel's switch for a value field. */
  "data-ok-data-grid-chart-value": Part;
  /** The selection checkbox of a row or of the header. */
  "data-ok-data-grid-checkbox": Part<"div">;
  /** HTML only: the template of the date filter input. */
  "data-ok-data-grid-date": Part<"template">;
  /** HTML only: the template of the date and time filter input. */
  "data-ok-data-grid-date-time": Part<"template">;
  /** HTML only: the template of a row's detail panel, named by the row id. */
  "data-ok-data-grid-detail": Part<"template">;
  /** The content of an open detail panel. */
  "data-ok-data-grid-detail-content": Part<"div">;
  /** The button that opens and closes a row's detail panel. */
  "data-ok-data-grid-detail-toggle": Part;
  /** The error message of an invalid edited value. */
  "data-ok-data-grid-edit-error": Part<"span">;
  /** HTML only: a column's own editor (renderEditCell), named by its field; copied into the edited cell. */
  "data-ok-data-grid-edit-cell": Part<"template">;
  /** The input of an edited cell (in an editor template: the field that holds the value). */
  "data-ok-data-grid-edit-input": Part<"select">;
  /** An export button in the toolbar and its format. */
  "data-ok-data-grid-export": Value<"csv" | "print" | "excel">;
  /** The filter panel. */
  "data-ok-data-grid-filter": Part<"div">;
  /** The button that adds a filter. */
  "data-ok-data-grid-filter-add": Part;
  /** The button that removes a filter. */
  "data-ok-data-grid-filter-remove": Part;
  /** With `filterGroups`: the button that adds a group of filters (in the panel or in a group). */
  "data-ok-data-grid-filter-add-group": Part<"button">;
  /** A group of filters with its own And / Or: its filters, its groups and its buttons. */
  "data-ok-data-grid-filter-group": Part<"div">;
  /** A filter group's first line: its remove button and, after the first entry, the And / Or. */
  "data-ok-data-grid-filter-group-header": Part<"div">;
  /** The button that removes a filter group and everything in it. */
  "data-ok-data-grid-filter-group-remove": Part<"button">;
  /** A filter group's Add filter and Add group buttons. */
  "data-ok-data-grid-filter-group-actions": Part<"div">;
  /**
   * On a cell menu item: what it does (`copy`, `paste`, `export`, `export-csv`, `export-excel`,
   * `print`, `chart-range`, `pin`, `pin-left`, `pin-right`, `unpin`, or your own item's name).
   */
  "data-ok-data-grid-context-action": Value<string>;
  /** The footer: the selected rows and the pagination. */
  "data-ok-data-grid-footer": Part<"div">;
  /** A panel with a form, such as the columns or the filters. */
  "data-ok-data-grid-form-panel": Part<"div">;
  /** Fills the column group header above a column outside any group. */
  "data-ok-data-grid-group-filler": Part<"div">;
  /** A group row of row grouping. */
  "data-ok-data-grid-group-row": Part<"div">;
  /** The column headers. */
  "data-ok-data-grid-header": Part<"div">;
  /** The filter under a column header. */
  "data-ok-data-grid-header-filter": Part<"div">;
  /** The row of header filters. */
  "data-ok-data-grid-header-filters": Part<"div">;
  /** The title of a column header. */
  "data-ok-data-grid-header-title": Part<"span">;
  /** A toolbar button that undoes or redoes the last edit (disabled when there is none). */
  "data-ok-data-grid-history": Value<"undo" | "redo">;
  /** The single cell of a row in the list view. */
  "data-ok-data-grid-list-cell": Part<"div">;
  /** A visually hidden live region, such as "Row moved to position 2 of 8". */
  "data-ok-data-grid-live": Part<"div">;
  /** The loading layer. */
  "data-ok-data-grid-loading": Part<"div">;
  /** The grid itself (`role="grid"` or `role="treegrid"`). */
  "data-ok-data-grid-main": Part<"div">;
  /** The button that opens a column's menu. */
  "data-ok-data-grid-menu-button": Part;
  /** The text shown without rows, such as "No rows". */
  "data-ok-data-grid-overlay": Part<"div">;
  /** A popover panel of the toolbar or the column menu. */
  "data-ok-data-grid-panel": Part<"div">;
  /** The rows pinned to the top or the bottom. */
  "data-ok-data-grid-pinned-rows": Value<"top" | "bottom">;
  /** A pivot panel section's hint when it has no field, such as "Drag here to create rows". */
  "data-ok-data-grid-pivot-empty": Part<"span">;
  /** One field of the pivot panel. */
  "data-ok-data-grid-pivot-field": Part<"div">;
  /** The handle that drags a pivot field to another section or position (pointer only). */
  "data-ok-data-grid-pivot-handle": Part<"span">;
  /** The buttons that move a pivot field up or down in its section. */
  "data-ok-data-grid-pivot-move": Value<"up" | "down">;
  /** A section of the pivot panel: the fields not used, or the rows, columns or values. */
  "data-ok-data-grid-pivot-section": Value<"none" | "rows" | "columns" | "values">;
  /** The title of a pivot panel section. */
  "data-ok-data-grid-pivot-section-title": Part<"span">;
  /** The switch that turns pivot mode on. */
  "data-ok-data-grid-pivot-switch": Part;
  /** The quick filter search field of the toolbar. */
  "data-ok-data-grid-quick-filter": Part<"div">;
  /** The handle that drags a row to another position. */
  "data-ok-data-grid-reorder-handle": Part;
  /** The handle that resizes a column. */
  "data-ok-data-grid-resize": Part<"span">;
  /** The footer's row count without pagination, such as "Total Rows: 25". Written by the grid. */
  "data-ok-data-grid-row-count": Part<"span">;
  /** HTML only: the template of one row, copied by `setRows` and data sources. */
  "data-ok-data-grid-row": Part<"template">;
  /** A set filter: a search, "Select all" and a checkbox per value of the column. */
  "data-ok-data-grid-set-filter": Part<"div">;
  /** A set filter's "Select all" checkbox (mixed while some shown values are checked). */
  "data-ok-data-grid-set-all": Part<"input">;
  /** A header filter's button that opens its set filter, with a summary such as "2 selected". */
  "data-ok-data-grid-set-filter-button": Part<"button">;
  /** On a set filter's checkbox: the value it stands for. */
  "data-ok-data-grid-set-value": Value<string>;
  /** The group of a set filter's value checkboxes. */
  "data-ok-data-grid-set-values": Part<"div">;
  /** The footer's number of selected rows, such as "2 rows selected". Written by the grid. */
  "data-ok-data-grid-selected-row-count": Part<"span">;
  /** The placeholder of a cell that is still loading. */
  "data-ok-data-grid-skeleton": Part<"span">;
  /** The sort arrow of a column header. */
  "data-ok-data-grid-sort-icon": Part<"span">;
  /** The status bar (`statusBar` with cell selection): a polite live region of figures. */
  "data-ok-data-grid-status-bar": Part<"div">;
  /** One figure of the status bar, such as "Sum: 141". Written by the grid. */
  "data-ok-data-grid-status-item": Value<"count" | "sum" | "avg" | "min" | "max">;
  /** The toolbar. */
  "data-ok-data-grid-toolbar": Part<"div">;
  /** The grid's label at the start of the toolbar. */
  "data-ok-data-grid-toolbar-label": Part<"span">;
  /** The buttons at the end of the toolbar. */
  "data-ok-data-grid-toolbar-actions": Part<"div">;
  /** The number of children of a tree row. */
  "data-ok-data-grid-tree-count": Part<"span">;
  /** The label of a tree or group row. */
  "data-ok-data-grid-tree-label": Part<"span">;
  /** The indent of a tree row without children. */
  "data-ok-data-grid-tree-spacer": Part<"span">;
  /** The button that expands and collapses a tree row. */
  "data-ok-data-grid-tree-toggle": Part;
  /** HTML only: where a custom cell template shows the value. */
  "data-ok-data-grid-value": Part;
  /** On a detail panel: the id of its row. */
  "data-ok-detail-for": Value<string>;
  /** The height of a detail panel, in pixels, or `auto`. */
  "data-ok-detail-height": Value<string>;
  /** On a chart panel field: turns it off. */
  "data-ok-disable": Value<string>;
  /** On a header cell: the column stays out of exports (CSV, Excel, print). */
  "data-ok-disable-export": State;
  /** On a header cell: the column keeps its place (no drag, no moves that shift it). */
  "data-ok-disable-reorder": State;
  /** On a cell: `flex` lays its content out in a row, centered. */
  "data-ok-display": Value<"flex">;
  /** Set by the runtime on a pivot field while a pointer drags it. */
  "data-ok-dragging": State;
  /** Set by the runtime on the row or column a drag would drop next to. */
  "data-ok-drop": Value<"before" | "after">;
  /** Set by the runtime on the pivot panel section a dragged field would drop into. */
  "data-ok-drop-target": State;
  /** Set by the runtime on a cell or row being edited. */
  "data-ok-editing": State;
  /** Options of the Excel export, as JSON. */
  "data-ok-excel-options": Value<string>;
  /** In the cell at the selection's bottom end corner: the fill handle (`cellSelectionFillHandle`). */
  "data-ok-data-grid-fill-handle": Value<"">;
  /** While the fill handle is dragged: on the cells it would fill. */
  "data-ok-fill-target": Value<"">;
  /** On a row: `false` when it can't be moved (`isRowReorderable`). */
  "data-ok-reorderable": Value<"false">;
  /** With an unknown row count: `false` when no page follows the current one. */
  "data-ok-has-next-page": Value<"true" | "false">;
  /** On a header or a cell: the column's field. */
  "data-ok-field": Value<string>;
  /** On a header cell: `set` filters the column with a checklist of its values. */
  "data-ok-filter-variant": Value<"set">;
  /** On a filter row: the field it filters. */
  "data-ok-filter-field": Value<string>;
  /** On a custom header filter field (or its parent): the operator of its filter, such as `>=`. */
  "data-ok-filter-operator": Value<string>;
  /** On a header cell: `false` turns filtering off for the column. */
  "data-ok-filterable": Value<"false">;
  /** On a header cell: the column's share of the free width. */
  "data-ok-flex": Value<string>;
  /** On a header cell: how the column formats its values. */
  "data-ok-format": Value<"number" | "currency" | "percent" | "date" | "datetime">;
  /** On a header cell: `Intl` format options, as JSON. */
  "data-ok-format-options": Value<string>;
  /** Marks rows the grid generated, such as group rows. */
  "data-ok-generated": State;
  /** On a column group header: the group's id. */
  "data-ok-group-id": Value<string>;
  /** On a row: its path in tree data. */
  "data-ok-group-path": Value<string>;
  /** On a header cell: `false` keeps the column out of row grouping. */
  "data-ok-groupable": Value<"false">;
  /** On a cell: the value its row is grouped by (React writes it from `groupingValueGetter`). */
  "data-ok-grouping-value": Value<string>;
  /** Hides the number of children of tree rows. */
  "data-ok-hide-descendant-count": State;
  /** On a header cell: `false` keeps the column visible. */
  "data-ok-hideable": Value<"false">;
  /** Set by the runtime on a placeholder row of lazy loading. */
  "data-ok-loading-row": State;
  /** On a header cell: the column's smallest width, in pixels. */
  "data-ok-min-width": Value<string>;
  /** On a row: the id of its parent in tree data. */
  "data-ok-parent": Value<string>;
  /** On a pin menu item: the field it pins. */
  "data-ok-pin-field": Value<string>;
  /** On a header cell: `false` hides the pin items of the column menu. */
  "data-ok-pinnable": Value<"false">;
  /** On a cell: the side its column is pinned to. */
  "data-ok-pinned": Value<"left" | "right">;
  /** The pivot model, as JSON. */
  "data-ok-pivot-model": Value<string>;
  /** Set by the runtime on the edge cells of a selected range: `top`, `right`, `bottom` and `left`. */
  "data-ok-range-edge": Value<string>;
  /** On a header cell: `false` turns resizing off for the column. */
  "data-ok-resizable": Value<"false">;
  /** The fields the rows are grouped by. */
  "data-ok-row-grouping-model": Value<string>;
  /** On a row: its id. */
  "data-ok-row-id": Value<string>;
  /**
   * Tree data and row groups: which related rows a selection reaches, as JSON
   * (`{"parents":false,"descendants":true}`; default both). React writes it from
   * `rowSelectionPropagation`.
   */
  "data-ok-row-selection-propagation": Value<string>;
  /**
   * On a cell: the value row spanning compares, instead of the cell's text (React writes it from
   * `rowSpanValueGetter`).
   */
  "data-ok-row-span-value": Value<string>;
  /** On a header cell: `false` keeps the column out of the quick filter. */
  "data-ok-searchable": Value<"false">;
  /** On a row: `false` means the row can't be selected. */
  "data-ok-selectable": Value<"false">;
  /** On a row: extra space below it, in pixels. */
  "data-ok-spacing-bottom": Value<string>;
  /** On a row: extra space above it, in pixels. */
  "data-ok-spacing-top": Value<string>;
  /**
   * On the root or a header cell: the directions a header click goes through, as JSON (such as
   * `["desc","asc",null]`; `null` is "not sorted").
   */
  "data-ok-sorting-order": Value<string>;
  /** On a cell: the text the quick filter and the export use, when the cell shows something else. */
  "data-ok-text": Value<string>;
  /** On a header cell: the options of a single select column, as JSON. */
  "data-ok-value-options": Value<string>;
}

/** Date picker: parts, states, values and triggers. */
export interface DatePickerParts {
  /** The buttons of the action bar, such as `clear accept`. */
  "data-ok-actions": Value<string>;
  /** Set by the runtime while every section of the field is selected. */
  "data-ok-all-selected": State;
  /** Set on the clock pointer while it points between two numbers. */
  "data-ok-between": State;
  /** The calendar system. */
  "data-ok-calendar": Value<
    "gregory" | "persian" | "islamic-umalqura" | "islamic-civil" | "islamic-tbla" | "buddhist"
  >;
  /** On a day button: its date, `YYYY-MM-DD`. */
  "data-ok-date": Value<string>;
  /** The calendar's header: the month and the buttons. */
  "data-ok-date-calendar-header": Part<"div">;
  /** The month and year shown. */
  "data-ok-date-calendar-label": Part<"div">;
  /** Shown instead of the days while `loading` is set. */
  "data-ok-date-calendar-loading": Part<"div">;
  /** The previous and next month buttons. */
  "data-ok-date-calendar-nav": Part<"div">;
  /** The next month button. */
  "data-ok-date-calendar-next": Part;
  /** The previous month button. */
  "data-ok-date-calendar-prev": Part<"button">;
  /** The button that switches to the year view. */
  "data-ok-date-calendar-switch": Part<"button">;
  /** The button that clears the field. */
  "data-ok-date-field-clear": Part;
  /** The editable text of a section (`role="spinbutton"`). */
  "data-ok-date-field-content": Part<"span">;
  /** The hidden input that carries the ISO value in a form. */
  "data-ok-date-field-input": Part<"input">;
  /** One section of the field, such as the month. */
  "data-ok-date-field-section": Part<"span">;
  /** The group of sections: the field's input. */
  "data-ok-date-field-sections": Part<"div">;
  /** The text between two sections. */
  "data-ok-date-field-separator": Value<"start" | "end">;
  /** The dialog of the mobile picker. */
  "data-ok-date-picker-dialog": Part<"dialog">;
  /** The button that opens the picker. */
  "data-ok-date-picker-open": Part;
  /** The popover of the desktop picker. */
  "data-ok-date-picker-paper": Part;
  /** The header of a range calendar's month. */
  "data-ok-date-range-calendar-header": Part<"div">;
  /** One month of a range calendar (one to three). */
  "data-ok-date-range-calendar-month": Part<"div">;
  /** The days of a month (`role="grid"`). */
  "data-ok-day-calendar": Part;
  /** The weekday headings. */
  "data-ok-day-calendar-header": Part;
  /** An empty day before or after the month. */
  "data-ok-day-filler": Part;
  /** The media query that switches a responsive picker to its desktop form. */
  "data-ok-desktop-mode-media-query": Value<string>;
  /** One time of a digital clock. */
  "data-ok-digital-clock-item": Part<"li">;
  /** The list of times. */
  "data-ok-digital-clock-list": Part<"ul">;
  /** One column of a multi-section digital clock, such as the minutes. */
  "data-ok-digital-clock-section": Part<"ul">;
  /** The format of the field, such as `MM/DD/YYYY`. */
  "data-ok-format": Value<string>;
  /** Set on days inside the range previewed under the pointer. */
  "data-ok-in-preview": State;
  /** Set on days inside the selected range. */
  "data-ok-in-range": State;
  /** Set on the clock's inner ring of hours (24-hour clocks). */
  "data-ok-inner": State;
  /** The locale of month and weekday names, such as `fr`. */
  "data-ok-locale": Value<string>;
  /** The latest date that can be picked, `YYYY-MM-DD`. */
  "data-ok-max-date": Value<string>;
  /** The latest date and time that can be picked. */
  "data-ok-max-date-time": Value<string>;
  /** The latest time that can be picked, `HH:mm:ss`. */
  "data-ok-max-time": Value<string>;
  /** The earliest date that can be picked, `YYYY-MM-DD`. */
  "data-ok-min-date": Value<string>;
  /** The earliest date and time that can be picked. */
  "data-ok-min-date-time": Value<string>;
  /** The earliest time that can be picked, `HH:mm:ss`. */
  "data-ok-min-time": Value<string>;
  /** The month shown, `YYYY-MM`. */
  "data-ok-month": Value<string>;
  /** The months of a year (`role="radiogroup"`). */
  "data-ok-month-calendar": Part;
  /** Two fields for the start and the end of a range. */
  "data-ok-multi-input-range-field": Part;
  /** The helper text under the two fields. */
  "data-ok-multi-input-range-field-helper": Part;
  /** The text between the two fields. */
  "data-ok-multi-input-range-field-separator": Part;
  /** Set on days of the previous or next month. */
  "data-ok-outside": State;
  /** One button of the action bar. */
  "data-ok-picker-action": Part;
  /** The action bar. */
  "data-ok-picker-actions": Part;
  /** The view: a calendar or a clock. */
  "data-ok-picker-content": Part;
  /** One day button. */
  "data-ok-picker-day": Part;
  /** The picker's layout: toolbar, shortcuts, view and action bar. */
  "data-ok-picker-layout": Part;
  /** One month button. */
  "data-ok-picker-month": Part;
  /** The Start and End tabs of a time or date and time range. */
  "data-ok-picker-range-tabs": Part;
  /** One shortcut chip. */
  "data-ok-picker-shortcut": Part;
  /** The list of shortcuts. */
  "data-ok-picker-shortcuts": Part;
  /** The tabs that switch between the date and the time views. */
  "data-ok-picker-tabs": Part;
  /** The toolbar: the picked value above the view. */
  "data-ok-picker-toolbar": Part;
  /** The AM and PM buttons of the toolbar. */
  "data-ok-picker-toolbar-ampm": Part;
  /** A toolbar button that opens a view. */
  "data-ok-picker-toolbar-button": Part;
  /** The value in the toolbar. */
  "data-ok-picker-toolbar-content": Part;
  /** The date in the toolbar. */
  "data-ok-picker-toolbar-date": Part;
  /** An AM or PM button of the toolbar. */
  "data-ok-picker-toolbar-meridiem": Value<"am" | "pm">;
  /** The small heading of the toolbar, such as "Select date". */
  "data-ok-picker-toolbar-overline": Part;
  /** One part of the time in the toolbar, such as the hours. */
  "data-ok-picker-toolbar-part": Part;
  /** The separator between the parts of the time. */
  "data-ok-picker-toolbar-separator": Part;
  /** The time in the toolbar. */
  "data-ok-picker-toolbar-time": Part;
  /** The picked value in the toolbar. */
  "data-ok-picker-toolbar-title": Part;
  /** One view of the layout. */
  "data-ok-picker-view": Part;
  /** One year button. */
  "data-ok-picker-year": Part;
  /** Set on the last day of the previewed range. */
  "data-ok-preview-end": State;
  /** Set on the first day of the previewed range. */
  "data-ok-preview-start": State;
  /** Set on the last day of the selected range. */
  "data-ok-range-end": State;
  /** Set on the first day of the selected range. */
  "data-ok-range-start": State;
  /** The toolbar of a range picker: the start and the end. */
  "data-ok-range-toolbar": Part;
  /** On a field section: what it holds, such as `month`. */
  "data-ok-section": Value<string>;
  /** The dial of the clock. */
  "data-ok-time-clock-dial": Part<"div">;
  /** An AM or PM button on the clock. */
  "data-ok-time-clock-meridiem": Value<"am" | "pm">;
  /** The AM and PM buttons on the clock. */
  "data-ok-time-clock-meridiems": Part<"div">;
  /** The buttons to the previous and next view. */
  "data-ok-time-clock-nav": Part<"div">;
  /** The button to the next view. */
  "data-ok-time-clock-next": Part;
  /** One number of the dial. */
  "data-ok-time-clock-number": Part<"span">;
  /** The numbers of the dial (`role="listbox"`). */
  "data-ok-time-clock-options": Part<"div">;
  /** The center of the clock. */
  "data-ok-time-clock-pin": Part<"span">;
  /** The hand of the clock. */
  "data-ok-time-clock-pointer": Part<"span">;
  /** The button to the previous view. */
  "data-ok-time-clock-prev": Part<"button">;
  /** The steps of a multi-section digital clock: hours, minutes and seconds, such as `1 5 5`. */
  "data-ok-time-steps": Value<string>;
  /** The time zone of the value, such as `Europe/Paris`. */
  "data-ok-timezone": Value<string>;
  /** Set on today's day button. */
  "data-ok-today": State;
  /** The views, such as `year month day`. */
  "data-ok-views": Value<string>;
  /** The year shown. */
  "data-ok-year": Value<string>;
  /** The years (`role="radiogroup"`). */
  "data-ok-year-calendar": Part;
}

/** Dialog: parts, states, values and triggers. */
export interface DialogParts {
  /** The row of actions at the bottom. */
  "data-ok-dialog-actions": Part<"div">;
  /** Closes the dialog whose `id` it names, or, without a value, the dialog it sits in. */
  "data-ok-dialog-close": Trigger<"id" | "">;
  /** The content, which scrolls with `data-ok-scroll="paper"`. */
  "data-ok-dialog-content": Part<"div">;
  /** A paragraph of the content, in the secondary text color. */
  "data-ok-dialog-content-text": Part<"p">;
  /** Opens the dialog whose `id` it names. */
  "data-ok-dialog-open": Trigger<"id">;
  /** The dialog's surface. */
  "data-ok-dialog-paper": Part<"div">;
  /** The title. Name the dialog with it through `aria-labelledby`. */
  "data-ok-dialog-title": Part<"h2">;
  /** Draws lines above and below the content. */
  "data-ok-dividers": State;
}

/** Divider: parts, states, values and triggers. */
export interface DividerParts {
  /** The text in the middle of the divider. */
  "data-ok-divider-text": Part<"span">;
}

/** Drawer: parts, states, values and triggers. */
export interface DrawerParts {
  /** Closes the drawer whose `id` it names, or, without a value, the drawer it sits in. */
  "data-ok-drawer-close": Trigger<"id" | "">;
  /** The drawer's surface and its content. */
  "data-ok-drawer-content": Part<"div">;
  /** Opens the drawer whose `id` it names. */
  "data-ok-drawer-open": Trigger<"id">;
}

/** Editor: parts, states, values and triggers. */
export interface EditorParts {
  /** A toolbar button and the command it runs, such as `bold` (`table`: opens the table menu). */
  "data-ok-editor-action": Value<string>;
  /** On the mention list: its query may hold spaces. */
  "data-ok-allow-spaces": State;
  /** The toolbar over selected text: a Popover with `role="toolbar"` and `data-ok-runtime="off"`. */
  "data-ok-editor-bubble-menu": Part<"div">;
  /** On the mention list: the character that opens it, such as `@` (default). */
  "data-ok-char": Value<string>;
  /** A hidden input holding the HTML value, named for its form (`name`). */
  "data-ok-editor-input": Part<"input">;
  /** A mention in the content: `span[data-type="mention"][data-id][data-label]`. */
  "data-ok-editor-mention": Part<"span">;
  /** The people (or anything) mentions suggest: a template of `[data-ok-value]` items. */
  "data-ok-editor-mention-items": Part<"template">;
  /** An option of the mention list, written by the runtime. */
  "data-ok-editor-mention-option": Part<"li">;
  /** The mention list: a Popover with a `[role=listbox]` and `data-ok-runtime="off"`. */
  "data-ok-editor-mentions": Part<"div">;
  /** An item of the table menu and the table action it runs, such as `addRowAfter`. */
  "data-ok-editor-table-action": Value<
    | "insertTable"
    | "addColumnBefore"
    | "addColumnAfter"
    | "deleteColumn"
    | "addRowBefore"
    | "addRowAfter"
    | "deleteRow"
    | "toggleHeaderRow"
    | "toggleHeaderColumn"
    | "mergeCells"
    | "splitCell"
    | "deleteTable"
  >;
  /** On the bubble menu: how long it waits after the selection stops changing (ms; default 250). */
  "data-ok-update-delay": Value<string>;
  /** On a mention template item: the id the mention gets (`data-id`); its text is the label. */
  "data-ok-value": Value<string>;
  /** A menu item of the heading menu and the block it sets. */
  "data-ok-editor-block": Value<"paragraph" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6">;
  /** The scrolling area around the content. */
  "data-ok-editor-body": Part<"div">;
  /** A code block of the content, with its language menu. */
  "data-ok-editor-code-block": Part<"div">;
  /** A field of a toolbar form and what it sets, such as `href`. */
  "data-ok-editor-field": Value<string>;
  /** A toolbar form: the link or the image form. */
  "data-ok-editor-form": Value<"link" | "image">;
  /** A row of a toolbar form. */
  "data-ok-editor-form-row": Part<"div">;
  /** The title of a toolbar form. */
  "data-ok-editor-form-title": Part<"p">;
  /** A group of toolbar buttons. */
  "data-ok-editor-group": Part<"div">;
  /** The button that opens the heading menu. */
  "data-ok-editor-heading": Part<"button">;
  /** The current block's name in the heading button. */
  "data-ok-editor-heading-label": Part<"span">;
  /** The helper text under the editor. */
  "data-ok-editor-helper": Part<"p">;
  /** One of the full screen button's two icons. */
  "data-ok-editor-icon": Value<"enter" | "exit">;
  /** The language menu of a code block. */
  "data-ok-editor-language": Part<"select">;
  /** The toolbar. */
  "data-ok-editor-toolbar": Part<"div">;
  /** Marks a toolbar group that only the full toolbar shows. */
  "data-ok-full": State;
  /** The text shown while the editor is empty. */
  "data-ok-placeholder": Value<string>;
  /** The text transform of a span of content, or of the toolbar's input. */
  "data-ok-text-transform": Value<"uppercase" | "lowercase" | "capitalize">;
}

/** Form control: parts, states, values and triggers. */
export interface FormControlParts {
  /** The asterisk of a required field's label. */
  "data-ok-form-label-asterisk": Part<"span">;
}

/** Form control label: parts, states, values and triggers. */
export interface FormControlLabelParts {
  /** The asterisk of a required control's label. */
  "data-ok-form-control-label-asterisk": Part<"span">;
  /** The label text. */
  "data-ok-form-control-label-text": Part<"span">;
}

/** Gantt: parts, states, values and triggers. */
export interface GanttParts {
  /** The columns of the task list, such as `name startTime duration`. */
  "data-ok-columns": Value<string>;
  /** Marks a task on the critical path. */
  "data-ok-critical": State;
  /** Set while a bar is dragged. */
  "data-ok-dragging": State;
  /** Turns editing on: bars can be moved, resized and their progress set. */
  "data-ok-editable": State;
  /** Set on the row being edited with the keyboard. */
  "data-ok-editing": State;
  /** A task's bar. */
  "data-ok-gantt-bar": Part<"div">;
  /** The label of a bar. */
  "data-ok-gantt-bar-text": Part<"span">;
  /** The planned dates under a bar. */
  "data-ok-gantt-baseline": Part<"span">;
  /** The rows. */
  "data-ok-gantt-body": Part<"div">;
  /** The line between the task list and the timeline. */
  "data-ok-gantt-boundary": Part<"path">;
  /** The drawing under the bars: grid lines, non-working days and today. */
  "data-ok-gantt-canvas": Part<"svg">;
  /** A cell of the task list and its column, such as `name`. */
  "data-ok-gantt-cell": Value<string>;
  /** A column header of the task list. */
  "data-ok-gantt-column": Part<"div">;
  /** HTML: the tasks, as a table. What the Gantt shows without JavaScript. */
  "data-ok-gantt-data": Part<"table">;
  /** On a data table header cell: the task field the column holds. */
  "data-ok-gantt-field": Value<
    "name" | "startTime" | "endTime" | "progress" | "dependency" | "baselineStart" | "baselineEnd"
  >;
  /** The task list and the timeline. */
  "data-ok-gantt-grid": Part<"div">;
  /** The grid lines. */
  "data-ok-gantt-grid-lines": Part<"path">;
  /** A drag handle of a bar: its start, its end or its progress. */
  "data-ok-gantt-handle": Value<"start" | "end" | "progress">;
  /** The column headers and the time scale. */
  "data-ok-gantt-head": Part<"div">;
  /** Where a bar's label sits. */
  "data-ok-gantt-label": Value<"right" | "left" | "inside">;
  /** One dependency arrow. */
  "data-ok-gantt-link": Part<"g">;
  /** The head of a dependency arrow. */
  "data-ok-gantt-link-head": Part<"path">;
  /** The line of a dependency arrow. */
  "data-ok-gantt-link-line": Part<"path">;
  /** The dependency arrows. */
  "data-ok-gantt-links": Part<"g">;
  /** A task's name. */
  "data-ok-gantt-name": Part<"span">;
  /** The shading of non-working days. */
  "data-ok-gantt-non-working": Part<"path">;
  /** One task's row. */
  "data-ok-gantt-row": Part<"div">;
  /** The time scale. */
  "data-ok-gantt-scale": Part<"div">;
  /** The status region that announces each editing step. */
  "data-ok-gantt-status": Part<"div">;
  /** One label of the time scale. */
  "data-ok-gantt-tick": Part<"span">;
  /** One tier of the time scale. */
  "data-ok-gantt-tier": Value<"top" | "bottom">;
  /** The line at today. */
  "data-ok-gantt-today": Part<"path">;
  /** The button that expands and collapses a summary task. */
  "data-ok-gantt-toggle": Part;
  /** The space of the toggle in a row without one. */
  "data-ok-gantt-toggle-space": Part<"span">;
  /** The toolbar: the zoom buttons. */
  "data-ok-gantt-toolbar": Part<"div">;
  /** The tooltip of a bar. */
  "data-ok-gantt-tooltip": Part<"div">;
  /** One row of the tooltip. */
  "data-ok-gantt-tooltip-row": Part<"div">;
  /** The title of the tooltip. */
  "data-ok-gantt-tooltip-title": Part<"div">;
  /** The area that scrolls both ways. */
  "data-ok-gantt-viewport": Part<"div">;
  /** Text for assistive technology only. */
  "data-ok-gantt-visually-hidden": Part<"span">;
  /** A zoom button. */
  "data-ok-gantt-zoom": Value<"out" | "in">;
  /** Non-working dates, `YYYY-MM-DD` separated by spaces. */
  "data-ok-holidays": Value<string>;
  /** The locale that formats dates, such as `en-US`. */
  "data-ok-locale": Value<string>;
  /** On a task row: the id of its summary task. */
  "data-ok-parent-id": Value<string>;
  /** Set by the runtime once the Gantt is drawn: the data table hides. */
  "data-ok-ready": State;
  /** On a task row: its id. */
  "data-ok-task-id": Value<string>;
  /** The date treated as today, `YYYY-MM-DD`. */
  "data-ok-today": Value<string>;
  /** The working days, such as `1 2 3 4 5` (Monday to Friday). */
  "data-ok-working-weekdays": Value<string>;
}

/** Icon button: parts, states, values and triggers. */
export interface IconButtonParts {
  /** The loading indicator, while `data-ok-loading` is set. */
  "data-ok-icon-button-loader": Part<"span">;
}

/** Illustration: parts, states, values and triggers. */
export interface IllustrationParts {
  /** Marks a shape drawn as an outline. */
  "data-ok-stroke": State;
  /** The color tone of a shape, such as `primary` or `neutral`. */
  "data-ok-tone": Value<string>;
}

/** Image: parts, states, values and triggers. */
export interface ImageParts {
  /** The broken picture icon, shown after an error. */
  "data-ok-image-icon": Part<"svg">;
  /** The overlay over the picture. */
  "data-ok-image-overlay": Part<"span">;
  /** The placeholder shown while the picture loads. */
  "data-ok-image-placeholder": Part<"span">;
}

/** Label: parts, states, values and triggers. */
export interface LabelParts {
  /** An icon before or after the text. */
  "data-ok-label-icon": Value<"start" | "end">;
}

/** Lightbox: parts, states, values and triggers. */
export interface LightboxParts {
  /** On a slide: the file name of its download. */
  "data-ok-download-filename": Value<string>;
  /** On a trigger: the slide it opens at. */
  "data-ok-index": Value<string>;
  /** A caption of a slide: its title or its description. */
  "data-ok-lightbox-caption": Value<"title" | "description">;
  /** The button that shows and hides the captions. */
  "data-ok-lightbox-captions": Part<"button">;
  /** The carousel of slides. */
  "data-ok-lightbox-carousel": Part<"section">;
  /** The close button. */
  "data-ok-lightbox-close": Part;
  /** The "2 / 8" counter. */
  "data-ok-lightbox-counter": Part<"span">;
  /** The current slide's number. */
  "data-ok-lightbox-counter-current": Part<"span">;
  /** The number of slides. */
  "data-ok-lightbox-counter-total": Part<"span">;
  /** The text of a description caption. */
  "data-ok-lightbox-description-text": Part<"div">;
  /** The download button. */
  "data-ok-lightbox-download": Part<"button">;
  /** The full screen button. */
  "data-ok-lightbox-fullscreen": Part;
  /** The picture of a slide. */
  "data-ok-lightbox-image": Part<"img">;
  /** Optional: the icon shown over an image slide while its image loads. */
  "data-ok-lightbox-loading": Part<"span">;
  /** Optional: the icon shown over an image slide whose image failed to load. */
  "data-ok-lightbox-error": Part<"span">;
  /** HTML only: a template of the loading or error icon, copied into every image slide. */
  "data-ok-lightbox-icon": Value<"loading" | "error">;
  /** Set by the runtime on an image slide: whether its image is loading, complete or failed. */
  "data-ok-status": Value<"loading" | "complete" | "error">;
  /** One of the full screen button's two labels. */
  "data-ok-lightbox-label": Value<"enter" | "exit">;
  /** A visually hidden live region that announces the slide. */
  "data-ok-lightbox-live": Part<"span">;
  /** The content of a custom slide. */
  "data-ok-lightbox-media": Part<"div">;
  /** The previous and next buttons. */
  "data-ok-lightbox-nav": Part<"button">;
  /** Opens the lightbox whose `id` it names, at the slide `data-ok-index` gives. */
  "data-ok-lightbox-open": Trigger<"id">;
  /** The button that rotates the slide counterclockwise. */
  "data-ok-lightbox-rotate-ccw": Part<"button">;
  /** The button that rotates the slide clockwise. */
  "data-ok-lightbox-rotate-cw": Part<"button">;
  /** The share button. */
  "data-ok-lightbox-share": Part<"button">;
  /** One slide. */
  "data-ok-lightbox-slide": Part;
  /** The button that plays and pauses the slideshow. */
  "data-ok-lightbox-slideshow": Part<"button">;
  /** The play icon on a video's thumbnail. */
  "data-ok-lightbox-thumbnail-play": Part<"span">;
  /** The row of thumbnails. */
  "data-ok-lightbox-thumbnails": Part<"div">;
  /** The button that shows and hides the thumbnails. */
  "data-ok-lightbox-thumbnails-toggle": Part;
  /** The toolbar. */
  "data-ok-lightbox-toolbar": Part<"div">;
  /** A thumbnail on the page that opens the lightbox. */
  "data-ok-lightbox-trigger": Part<"button">;
  /** The video of a slide. */
  "data-ok-lightbox-video": Part<"video">;
  /** The frame that zooms and pans a slide. */
  "data-ok-lightbox-zoom": Part<"div">;
  /** The zoom in button. */
  "data-ok-lightbox-zoom-in": Part;
  /** The zoom out button. */
  "data-ok-lightbox-zoom-out": Part;
  /** Set by the runtime while a pull down gesture closes the lightbox. */
  "data-ok-pulling": State;
  /** Set by the runtime once the lightbox is set up. */
  "data-ok-ready": State;
  /** On a slide: the URL it shares. */
  "data-ok-share-url": Value<string>;
  /** Marks a custom slide that can zoom. */
  "data-ok-zoomable": State;
  /** Set by the runtime while the slide is zoomed in. */
  "data-ok-zoomed": State;
  /** Set by the runtime while the zoom animates. */
  "data-ok-zooming": State;
}

/** Linear progress: parts, states, values and triggers. */
export interface LinearProgressParts {
  /** One of the two bars. */
  "data-ok-linear-progress-bar": Value<"1" | "2">;
  /** The dashes after the buffer bar. */
  "data-ok-linear-progress-dashed": Part<"span">;
}

/** List: parts, states, values and triggers. */
export interface ListParts {
  /** An avatar at the start of an item. */
  "data-ok-list-item-avatar": Part<"span">;
  /** The expand icon of an item that opens a nested list. */
  "data-ok-list-item-expand-icon": Part<"span">;
  /** An icon at the start of an item. */
  "data-ok-list-item-icon": Part<"span">;
  /** An action at the end of an item, such as a checkbox. */
  "data-ok-list-item-secondary-action": Part<"span">;
  /** The first line of an item's text. */
  "data-ok-list-item-text-primary": Part<"span">;
  /** The second line, in the secondary text color. */
  "data-ok-list-item-text-secondary": Part<"span">;
}

/** Map: parts, states, values and triggers. */
export interface MapParts {
  /** On a source: its credit, shown in the attribution control. */
  "data-ok-attribution": Value<string>;
  /** On a layer: the id of the layer it is drawn under. */
  "data-ok-before-id": Value<string>;
  /** The area the map shows at first, `west,south,east,north`. On a source: the area its tiles cover. */
  "data-ok-bounds": Value<string>;
  /** On a GeoJSON source: the tile buffer. */
  "data-ok-buffer": Value<string>;
  /** On a GeoJSON source: groups nearby points into clusters. */
  "data-ok-cluster": State;
  /** On a clustered source: the highest zoom level with clusters. */
  "data-ok-cluster-max-zoom": Value<string>;
  /** On a clustered source: the fewest points that make a cluster. */
  "data-ok-cluster-min-points": Value<string>;
  /** On a clustered source: properties computed per cluster, as JSON. */
  "data-ok-cluster-properties": Value<string>;
  /** On a clustered source: the cluster radius, in pixels. */
  "data-ok-cluster-radius": Value<string>;
  /** On an image or video source: its corners, as JSON. */
  "data-ok-coordinates": Value<string>;
  /** Set by the runtime on a popup: the side it opened on. */
  "data-ok-current-anchor": Value<string>;
  /** On a GeoJSON source: the data, as a URL or inline JSON. */
  "data-ok-data": Value<string>;
  /** Set by the runtime on a marker while it is dragged. */
  "data-ok-dragging": State;
  /** On a raster DEM source: how heights are encoded. */
  "data-ok-encoding": Value<"mapbox" | "terrarium">;
  /** On the terrain control: how much heights are exaggerated. */
  "data-ok-exaggeration": Value<string>;
  /** Set by the runtime when the map shows its fallback content. */
  "data-ok-fallback": State;
  /** On a layer: the features it draws, as a MapLibre filter in JSON. */
  "data-ok-filter": Value<string>;
  /** On a GeoJSON source: gives every feature an id. */
  "data-ok-generate-id": State;
  /** On a source or a layer: its id. On a row of the regions table: the feature id it joins. */
  "data-ok-id": Value<string>;
  /** The ids of the layers whose features pointer events report, separated by spaces. */
  "data-ok-interactive-layer-ids": Value<string>;
  /** The light of 3D extrusions, as MapLibre light JSON (`anchor`, `color`, `intensity`, `position`). */
  "data-ok-light": Value<string>;
  /** On a GeoJSON source: computes line distances (for gradients). */
  "data-ok-line-metrics": State;
  /** Set by the runtime once the map has drawn fully. */
  "data-ok-loaded": State;
  /** A control's button and what it does. */
  "data-ok-map-action": Value<
    "zoom-in" | "zoom-out" | "compass" | "geolocate" | "fullscreen" | "globe" | "terrain"
  >;
  /** The text of the attribution control. */
  "data-ok-map-attribution-text": Part<"div">;
  /** The compass icon. */
  "data-ok-map-compass-icon": Part<"svg">;
  /** The north half of the compass needle. */
  "data-ok-map-compass-north": Part<"path">;
  /** The south half of the compass needle. */
  "data-ok-map-compass-south": Part;
  /** One control in a corner. */
  "data-ok-map-control": Part<"div">;
  /** A corner that holds controls. */
  "data-ok-map-corner": Value<"top-left" | "top-right" | "bottom-left" | "bottom-right">;
  /** The map's text alternative. Visually hidden, and shown with the fallback. */
  "data-ok-map-description": Part<"p">;
  /** What the map shows without WebGL or JavaScript. */
  "data-ok-map-fallback": Part<"div">;
  /** Flies the map whose `id` it names to the place in `data-ok-longitude`, `data-ok-latitude` and `data-ok-zoom`. */
  "data-ok-map-fly-to": Trigger<"id">;
  /** One of the full screen button's two icons. */
  "data-ok-map-icon": Value<"enter" | "exit">;
  /** HTML only: a layer that draws a source (hidden). */
  "data-ok-map-layer": Part<"div">;
  /** A panel over the map, such as a legend. */
  "data-ok-map-panel": Part<"div">;
  /** The default pin of a marker. */
  "data-ok-map-pin": Part<"svg">;
  /** The close button of a popup. */
  "data-ok-map-popup-close": Part;
  /** The content of a popup. */
  "data-ok-map-popup-content": Part<"div">;
  /** Opens the popup whose `id` it names. */
  "data-ok-map-popup-open": Trigger<"id">;
  /** The tip of a popup that points at its place. */
  "data-ok-map-popup-tip": Part<"span">;
  /** HTML only: a data source (hidden). */
  "data-ok-map-source": Part<"div">;
  /** A visually hidden live region that announces the location. */
  "data-ok-map-status": Part<"div">;
  /** The URL of the map style. */
  "data-ok-map-style": Value<string>;
  /** The URL of the map style in the dark scheme. */
  "data-ok-map-style-dark": Value<string>;
  /** The user's position, drawn by the geolocate control. */
  "data-ok-map-user-location": Part<"div">;
  /** The element MapLibre draws in. */
  "data-ok-map-view": Part<"div">;
  /** The area the map can't leave, `west,south,east,north`. */
  "data-ok-max-bounds": Value<string>;
  /** Set by the runtime on the attribution control on narrow maps. */
  "data-ok-narrow": State;
  /** On a marker or a popup: its offset, in pixels, such as `0 -12`. */
  "data-ok-offset": Value<string>;
  /** Camera padding in px, written like CSS `padding` (1 to 4 numbers: top, right, bottom, left). */
  "data-ok-padding": Value<string>;
  /** On a layer: its paint properties, as JSON. */
  "data-ok-paint": Value<string>;
  /** On a vector or GeoJSON source: the property used as feature id. */
  "data-ok-promote-id": Value<string>;
  /** Set by the runtime once the first style is in. */
  "data-ok-ready": State;
  /** On a tile source: its tile scheme. */
  "data-ok-scheme": Value<"xyz" | "tms">;
  /** Set by the runtime while the geolocate control shows the accuracy circle. */
  "data-ok-show-accuracy": State;
  /** The sky and the globe's atmosphere, as MapLibre sky JSON. */
  "data-ok-sky": Value<string>;
  /** On a layer outside a source: the id of its source. On the terrain control: the DEM source. On regions: the source of the regions. */
  "data-ok-source": Value<string>;
  /** On a layer: the layer of a vector source it draws. On regions: the source layer of the regions. */
  "data-ok-source-layer": Value<string>;
  /** On a tile source: the tile size, in pixels. */
  "data-ok-tile-size": Value<string>;
  /** On a tile source: the tile URLs, separated by spaces. */
  "data-ok-tiles": Value<string>;
  /** On a GeoJSON source: how much lines are simplified. */
  "data-ok-tolerance": Value<string>;
  /** On a source: the URL of its TileJSON or data. */
  "data-ok-url": Value<string>;
  /** Set by the runtime on the region option the keyboard is on. */
  "data-ok-active": State;
  /** Set by the runtime on the region option under the pointer. */
  "data-ok-hovered": State;
  /** Set by the runtime on the regions list while the pointer is over a region. */
  "data-ok-hovering": State;
  /** On regions: the id of the fill layer that pointer hovers and clicks hit. */
  "data-ok-layer": Value<string>;
  /** A legend's swatches for each class, or its gradient bar. */
  "data-ok-map-legend-bar": Part<"span">;
  /** One class of a legend: a toggle button (interactive) or a list item. */
  "data-ok-map-legend-class": Part;
  /** The list of a legend's classes. */
  "data-ok-map-legend-classes": Part<"ul">;
  /** A gradient legend: the bar and its ticks. */
  "data-ok-map-legend-gradient": Part<"div">;
  /** The range text of a legend class. */
  "data-ok-map-legend-label": Part<"span">;
  /** One color of a gradient bar. */
  "data-ok-map-legend-stop": Part<"span">;
  /** The color square of a legend class. */
  "data-ok-map-legend-swatch": Part<"span">;
  /** The lowest and highest values under a gradient bar. */
  "data-ok-map-legend-ticks": Part<"div">;
  /** The title of a legend. */
  "data-ok-map-legend-title": Part<"p">;
  /** Set by the runtime: one region in the regions list (an option with its name and value). */
  "data-ok-map-region": Part<"div">;
  /** The regions of a choropleth: their keyboard list and their data table. */
  "data-ok-map-regions": Part<"div">;
  /** The regions' listbox; the runtime fills it from the table. */
  "data-ok-map-regions-list": Part<"div">;
  /** On a legend class: the highest value of the class. */
  "data-ok-max": Value<string>;
  /** On a legend class: the lowest value of the class. */
  "data-ok-min": Value<string>;
  /** On a legend class: the class of regions without a value. */
  "data-ok-null": State;
  /** On a legend swatch or gradient stop: its color, a CSS color or `var(--ok-…)` token. */
  "data-ok-swatch": Value<string>;
  /** On a cell of the regions table: the region's value, a number. */
  "data-ok-value": Value<string>;
}

/** Markdown: parts, states, values and triggers. */
export interface MarkdownParts {
  /** Only these elements are rendered, separated by spaces. */
  "data-ok-allowed-elements": Value<string>;
  /** These elements are removed, separated by spaces. */
  "data-ok-disallowed-elements": Value<string>;
}

/** Menu: parts, states, values and triggers. */
export interface MenuParts {
  /** A submenu: the `li[role=none]` that holds its trigger item and its popover. */
  "data-ok-menu-submenu": Part<"li">;
  /** The chevron at the end of a submenu's trigger. */
  "data-ok-menu-submenu-icon": Part<"svg">;
}

/** Motion: parts, states, values and triggers. */
export interface MotionParts {
  /** The full number for assistive technology. */
  "data-ok-count-up-label": Part<"span">;
  /** The counting number (hidden from assistive technology). */
  "data-ok-count-up-value": Part<"span">;
  /** One animated character. */
  "data-ok-motion-char": Part<"span">;
  /** The full text for assistive technology. */
  "data-ok-motion-text-label": Part<"span">;
  /** One animated word. */
  "data-ok-motion-text-word": Part<"span">;
  /** In view: grows (or, with negative values, shrinks) the viewport's box, written like CSS margins in `px` or `%`, such as `0px 0px -100px`. */
  "data-ok-viewport-margin": Value<string>;
  /** In view: the id of the scrolling ancestor whose box counts as the viewport. Default: the browser viewport. */
  "data-ok-viewport-root": Value<string>;
}

/** Organization chart: parts, states, values and triggers. */
export interface OrganizationChartParts {
  /** In a toggle: the number of hidden descendants, written by the script while the node is collapsed. Leave it out for no badge. */
  "data-ok-organization-chart-badge": Part<"span">;
  /** The list of a node's children. Absent without children; empty and `hidden` on a node whose children load on demand. */
  "data-ok-organization-chart-children": Part<"ul">;
  /** A node's content, such as a card. */
  "data-ok-organization-chart-label": Part<"div">;
  /** One node. */
  "data-ok-organization-chart-node": Part<"li">;
  /** In a toggle: the loading indicator of a node whose children load on demand, shown while the toggle is `aria-busy`. */
  "data-ok-organization-chart-spinner": Part<"span">;
  /** The button after a label that expands and collapses the node's children (`aria-expanded`, `aria-controls`). */
  "data-ok-organization-chart-toggle": Part<"button">;
  /** The chevron icon of a toggle. */
  "data-ok-organization-chart-toggle-icon": Part<"svg">;
  /** The toggle's name, visually hidden, such as "Priya Raman's reports". The badge's count follows it in the name. */
  "data-ok-organization-chart-toggle-label": Part<"span">;
  /** On a node: its id, used by the instance methods and in the events. */
  "data-ok-node-id": Value<string>;
  /** On a node: it is highlighted (a search result). Its path to the root keeps its colors while the other nodes fade. Written by `highlightNode(id)`. */
  "data-ok-highlighted": State;
  /** A group of zoom buttons next to the chart; its value is the chart's `id`. Works with `data-ok-enable-zoom-pan`. */
  "data-ok-organization-chart-toolbar": Part<"div">;
  /** In the toolbar: zooms in by one step. `aria-disabled` at the largest level. */
  "data-ok-organization-chart-zoom-in": Part<"button">;
  /** In the toolbar: zooms out by one step. `aria-disabled` at the smallest level. */
  "data-ok-organization-chart-zoom-out": Part<"button">;
  /** In the toolbar: fits the whole chart in its scroll area, up to 100%. */
  "data-ok-organization-chart-fit": Part<"button">;
  /** In the toolbar: back to 100%. */
  "data-ok-organization-chart-reset": Part<"button">;
  /** In the toolbar: the zoom level as a percentage, written by the script and announced politely. */
  "data-ok-organization-chart-zoom-value": Part<"output">;
  /** On the chart: set while a mouse drag pans its scroll area. */
  "data-ok-panning": State;
}

/** Pagination: parts, states, values and triggers. */
export interface PaginationParts {
  /** The pages always shown at each end. Default 1. */
  "data-ok-boundary-count": Value<string>;
  /** The number of pages. */
  "data-ok-count": Value<string>;
  /** The accessible name pattern of the current page, such as `page {page}`. */
  "data-ok-label-current": Value<string>;
  /** The accessible name pattern of the other pages, such as `Go to page {page}`. */
  "data-ok-label-page": Value<string>;
  /** An ellipsis that stands for hidden pages. */
  "data-ok-pagination-ellipsis": Part<"span">;
  /** A page or navigation button. */
  "data-ok-pagination-item": Part<"button">;
  /** On a pagination linked to a table: the rows per page. */
  "data-ok-rows-per-page": Value<string>;
  /** The pages shown on each side of the current one. Default 1. */
  "data-ok-sibling-count": Value<string>;
}

/** Popover: parts, states, values and triggers. */
export interface PopoverParts {
  /** The point the popover opens at with `data-ok-anchor-reference="anchorPosition"`: `top,left` in px from the viewport's top left corner. */
  "data-ok-anchor-position": Value<string>;
  /** Set by the runtime: the side the popover opened on after flipping. */
  "data-ok-current-placement": Value<string>;
  /** Set by the runtime when the browser lacks the Popover API. */
  "data-ok-fallback": State;
  /** The arrow that points at the anchor (shown with `data-ok-arrow`). */
  "data-ok-popover-arrow": Part<"span">;
  /** Opens the popover whose `id` it names while the pointer hovers the element. */
  "data-ok-popover-hover": Trigger<"id">;
  /** Opens the popover whose `id` it names next to the element. */
  "data-ok-popover-open": Trigger<"id">;
}

/** Radio: parts, states, values and triggers. */
export interface RadioParts {
  /** The icon of one state. */
  "data-ok-radio-icon": Value<"unchecked" | "checked">;
  /** The native radio. It covers the control, invisible. */
  "data-ok-radio-input": Part<"input">;
}

/** Rating: parts, states, values and triggers. */
export interface RatingParts {
  /** On an icon of a fraction: the part of the icon it fills. */
  "data-ok-fraction": Value<string>;
  /** Set by the runtime on icons up to the one under the pointer. */
  "data-ok-hover": State;
  /** The "Empty" choice that clears the value. */
  "data-ok-rating-empty": Part<"label">;
  /** The label of one value: its icon. */
  "data-ok-rating-icon": Part<"label">;
  /** The icon of an unfilled value. */
  "data-ok-rating-icon-empty": Part<"span">;
  /** The icon of a filled value. */
  "data-ok-rating-icon-filled": Part<"span">;
  /** The visually hidden radio of one value. */
  "data-ok-rating-input": Part<"input">;
  /** The icons of one whole value. */
  "data-ok-rating-item": Part<"span">;
  /** The visually hidden name of a value, such as "2 Stars". */
  "data-ok-rating-label-text": Part<"span">;
}

/** Select: parts, states, values and triggers. */
export interface SelectParts {
  /** HTML only: the template of the chip each value of a multiple select shows. */
  "data-ok-select-chip": Part<"template">;
  /** The button that shows the value and opens the listbox. */
  "data-ok-select-display": Part<"div">;
  /** The arrow icon. */
  "data-ok-select-icon": Part<"svg">;
  /** The hidden input that carries the value in a form. */
  "data-ok-select-input": Part<"input">;
  /** The list of options. */
  "data-ok-select-listbox": Part<"ul">;
  /** A native `select`, with `data-ok-native`. */
  "data-ok-select-native": Part<"select">;
  /** Opens the select whose `id` it names. */
  "data-ok-select-open": Trigger<"id">;
  /** The outline of the outlined variant. */
  "data-ok-select-outline": Part<"fieldset">;
  /** HTML only: the template of what an empty value shows. */
  "data-ok-select-placeholder": Part<"template">;
}

/** Slider: parts, states, values and triggers. */
export interface SliderParts {
  /** On a thumb: its position among the thumbs. */
  "data-ok-index": Value<string>;
  /** The accessible value text pattern of a thumb, such as `{value} °C`. */
  "data-ok-label-value": Value<string>;
  /** A mark on the rail. */
  "data-ok-slider-mark": Part<"span">;
  /** The label of a mark. */
  "data-ok-slider-mark-label": Part<"span">;
  /** The rail. */
  "data-ok-slider-rail": Part<"span">;
  /** A thumb. */
  "data-ok-slider-thumb": Part<"span">;
  /** The filled part of the rail. */
  "data-ok-slider-track": Part<"span">;
  /** The value shown over a thumb. */
  "data-ok-slider-value-label": Part<"span">;
}

/** Snackbar: parts, states, values and triggers. */
export interface SnackbarParts {
  /** Marks a toast with custom content and no default styling. */
  "data-ok-custom": State;
  /** Set on a stacked toaster (`data-ok-expand="false"`) while the hotkey keeps it expanded. */
  "data-ok-expanded": State;
  /** HTML: the keys that expand the toaster and focus it, such as `altKey+KeyT` (the default). */
  "data-ok-hotkey": Value<string>;
  /** HTML: the directions a toast can be swiped away in, such as `top right`. Default: toward the toaster's edges. */
  "data-ok-swipe-directions": Value<string>;
  /** Set on a toast while a pointer swipes it. */
  "data-ok-swiping": State;
  /** HTML: the id of the toast template that replaces this one when its promise settles. */
  "data-ok-then": Value<string>;
  /** One toast. */
  "data-ok-toast": Part;
  /** The action button of a toast. */
  "data-ok-toast-action": Part;
  /** The buttons of a toast. */
  "data-ok-toast-actions": Part;
  /** The cancel button of a toast. */
  "data-ok-toast-cancel": Part;
  /** The close button of a toast. */
  "data-ok-toast-close": Part;
  /** The title and the description of a toast. */
  "data-ok-toast-content": Part;
  /** The description of a toast. */
  "data-ok-toast-description": Part;
  /** Dismisses the toast it sits in. */
  "data-ok-toast-dismiss": Trigger<"">;
  /** The icon of a toast. */
  "data-ok-toast-icon": Part;
  /** HTML: shows the toast from the template whose `id` it names. */
  "data-ok-toast-open": Trigger<"id">;
  /** The title of a toast. */
  "data-ok-toast-title": Part;
  /** The list of toasts in one corner. */
  "data-ok-toaster-list": Part<"ol">;
  /** On a toast trigger: the corner it shows the toast in. */
  "data-ok-toaster-position": Value<string>;
  /** HTML: on a toast trigger, the `id` of the toaster that shows the toast (default: the page's first). */
  "data-ok-toast-toaster": Value<string>;
}

/** Sortable: parts, states, values and triggers. */
export interface SortableParts {
  /** Set by the runtime on the item being dragged. */
  "data-ok-dragging": State;
  /** Set by the runtime on the item grabbed with the keyboard. */
  "data-ok-grabbed": State;
  /** The buttons at the end of an item. */
  "data-ok-sortable-actions": Part<"div">;
  /** HTML only: the button that adds a copy of the new-item template. */
  "data-ok-sortable-add": Part<"button">;
  /** A visually hidden live region that announces moves. Created once per page. */
  "data-ok-sortable-announcer": Part<"div">;
  /** The handle that drags an item, or moves it with the keyboard. */
  "data-ok-sortable-handle": Part<"button">;
  /** The button that removes its item. */
  "data-ok-sortable-remove": Part;
  /** HTML only: the markup of new items. */
  "data-ok-sortable-template": Part<"template">;
  /** On the list: the group it belongs to. Items move between lists of the same group. */
  "data-ok-group": Value<string>;
  /** On the list: the groups it takes items from, separated by spaces (default: its own group). */
  "data-ok-accept": Value<string>;
  /** On a button or menu item inside an item: the `id` of the list it moves the item to (its end). */
  "data-ok-sortable-move-to": Value<string>;
  /** On an item: it can't move and isn't a target (its handle is `disabled` too). */
  "data-ok-disabled": State;
  /** Set by the runtime, swap lists: on the item the moved one would trade places with. */
  "data-ok-swap-target": State;
  /** HTML: on the list, the announcement when an item is grabbed (`{position}`, `{total}`, `{list}`). */
  "data-ok-message-grabbed": Value<string>;
  /** HTML: on the list, the announcement when an item moves (`{position}`, `{total}`, `{list}`). */
  "data-ok-message-moved": Value<string>;
  /** HTML: on the list, the announcement when an item moves to this list (`{position}`, `{total}`, `{list}`). */
  "data-ok-message-moved-to-list": Value<string>;
  /** HTML: on the list, the announcement when an item is dropped (`{position}`, `{total}`, `{list}`). */
  "data-ok-message-dropped": Value<string>;
  /** HTML: on the list, the announcement when a move is cancelled (`{position}`, `{total}`, `{list}`). */
  "data-ok-message-cancelled": Value<string>;
  /** HTML: on the list, the announcement when an item is removed (`{position}`, `{total}`, `{list}`). */
  "data-ok-message-removed": Value<string>;
}

/** Stepper: parts, states, values and triggers. */
export interface StepperParts {
  /** Marks a step icon with custom content. */
  "data-ok-custom": State;
  /** Moves the mobile stepper whose `id` it names back one step. */
  "data-ok-mobile-stepper-back": Trigger<"id">;
  /** One dot. */
  "data-ok-mobile-stepper-dot": Part<"span">;
  /** The dots of the `dots` variant. */
  "data-ok-mobile-stepper-dots": Part<"span">;
  /** Moves the mobile stepper whose `id` it names to the next step. */
  "data-ok-mobile-stepper-next": Trigger<"id">;
  /** HTML: content shown while the mobile stepper whose `id` it names is at this panel's index. */
  "data-ok-mobile-stepper-panel": Trigger<"id">;
  /** The progress bar of the `progress` variant. */
  "data-ok-mobile-stepper-progress": Part<"span">;
  /** The "2 / 6" text of the `text` variant. */
  "data-ok-mobile-stepper-text": Part<"span">;
  /** A step's label as a button that moves to the step (non-linear steppers). */
  "data-ok-step-button": Part<"button">;
  /** The line before a step (not on the first one). */
  "data-ok-step-connector": Part<"div">;
  /** The line itself. */
  "data-ok-step-connector-line": Part<"span">;
  /** The content under a vertical step: a collapse. */
  "data-ok-step-content": Part<"div">;
  /** The step's icon: its number, a check or an error. */
  "data-ok-step-icon": Part<"span">;
  /** The check of a completed step. */
  "data-ok-step-icon-check": Part<"svg">;
  /** The icon of a step with an error. */
  "data-ok-step-icon-error": Part<"svg">;
  /** The step's number. */
  "data-ok-step-icon-text": Part<"span">;
  /** The optional text under the title, such as "Optional". */
  "data-ok-step-label-optional": Part<"span">;
  /** The title and the optional text. */
  "data-ok-step-label-text": Part<"span">;
  /** The step's title. */
  "data-ok-step-label-title": Part<"span">;
  /** Moves the stepper whose `id` it names back one step. */
  "data-ok-stepper-back": Trigger<"id">;
  /** Moves the stepper whose `id` it names to the next step. */
  "data-ok-stepper-next": Trigger<"id">;
  /** HTML: content shown while the stepper whose `id` it names is at this panel's index. */
  "data-ok-stepper-panel": Trigger<"id">;
  /** On a panel: the step it shows at, instead of its index. */
  "data-ok-stepper-panel-step": Value<string>;
  /** Moves the stepper whose `id` it names back to the first step. */
  "data-ok-stepper-reset": Trigger<"id">;
}

/** Switch: parts, states, values and triggers. */
export interface SwitchParts {
  /** The native checkbox (`role="switch"`). It covers the control, invisible. */
  "data-ok-switch-input": Part<"input">;
  /** The thumb. */
  "data-ok-switch-thumb": Part<"span">;
  /** The icon in the thumb while off (`icon`). */
  "data-ok-switch-icon": Part<"span">;
  /** The icon in the thumb while on (`checkedIcon`). */
  "data-ok-switch-checked-icon": Part<"span">;
  /** The track. */
  "data-ok-switch-track": Part<"span">;
}

/** Table: parts, states, values and triggers. */
export interface TableParts {
  /** Highlights rows on hover. */
  "data-ok-hover": State;
  /** The container around the table, with a scrollbar. */
  "data-ok-table-container": Part<"section">;
  /** A switch that makes the table whose `id` it names dense while checked. */
  "data-ok-table-dense": Trigger<"id">;
  /** The detail row under a collapsible row. */
  "data-ok-table-detail": Part<"tr">;
  /** The button that opens and closes a row's detail. */
  "data-ok-table-expand": Part<"button">;
  /** The pagination under a table. */
  "data-ok-table-pagination": Part<"div">;
  /** A navigation button of the pagination. */
  "data-ok-table-pagination-action": Value<"first" | "previous" | "next" | "last">;
  /** The navigation buttons. */
  "data-ok-table-pagination-actions": Part<"div">;
  /** The "1–10 of 100" text. */
  "data-ok-table-pagination-displayed": Part<"span">;
  /** The rows per page select and its label. */
  "data-ok-table-pagination-rows": Part<"label">;
  /** The checkbox that selects a row. */
  "data-ok-table-select": Part<"input">;
  /** The checkbox that selects every row. */
  "data-ok-table-select-all": Part<"input">;
  /** The sort arrow of a sortable header. */
  "data-ok-table-sort-icon": Part<"span">;
}

/** Tabs: parts, states, values and triggers. */
export interface TabsParts {
  /** Set by the runtime while scrollable tabs can scroll toward the end. */
  "data-ok-can-scroll-end": State;
  /** Set by the runtime while scrollable tabs can scroll toward the start. */
  "data-ok-can-scroll-start": State;
  /** The label of a tab. */
  "data-ok-tab-label": Part<"span">;
  /** The panel of a tab. */
  "data-ok-tab-panel": Part<"div">;
  /** The line under the selected tab. */
  "data-ok-tabs-indicator": Part<"span">;
  /** The list of tabs (`role="tablist"`). */
  "data-ok-tabs-list": Part<"div">;
  /** A scroll button of scrollable tabs. */
  "data-ok-tabs-scroll-button": Value<"start" | "end">;
  /** The scrolling area of the tabs. */
  "data-ok-tabs-scroller": Part<"div">;
}

/** Text field: parts, states, values and triggers. */
export interface TextFieldParts {
  /** An adornment before or after the input, such as an icon or a unit. */
  "data-ok-text-field-adornment": Value<"start" | "end">;
  /** On an adornment: presses go through it to the input (React `disablePointerEvents`). */
  "data-ok-disable-pointer-events": State;
  /** The asterisk of a required field's label. */
  "data-ok-text-field-asterisk": Part<"span">;
  /** The box around the input. */
  "data-ok-text-field-control": Part<"div">;
  /** The helper text under the field. */
  "data-ok-text-field-helper": Part<"div">;
  /** The input or text area. */
  "data-ok-text-field-input": Part<"input">;
  /** The label that floats above the input. */
  "data-ok-text-field-label": Part<"label">;
  /** The outline of the outlined variant, with a notch for the label. */
  "data-ok-text-field-outline": Part<"fieldset">;
  /** The button that shows and hides a password. */
  "data-ok-text-field-reveal": Part;
  /** The arrow icon of a native select field. */
  "data-ok-text-field-select-icon": Part;
}

/** Timeline: parts, states, values and triggers. */
export interface TimelineParts {
  /** The line to the next event. Leave it out on the last one. */
  "data-ok-timeline-connector": Part<"span">;
  /** What happened. */
  "data-ok-timeline-content": Part<"div">;
  /** Content on the other side of the line, such as the time. */
  "data-ok-timeline-opposite-content": Part<"div">;
  /** Holds the dot and the connector. */
  "data-ok-timeline-separator": Part<"div">;
}

/** Tooltip: parts, states, values and triggers. */
export interface TooltipParts {
  /** The arrow that points at the trigger (shown with `data-ok-arrow`). */
  "data-ok-tooltip-arrow": Part<"span">;
}

/** Transfer list: parts, states, values and triggers. */
export interface TransferListParts {
  /** The pattern of the selected count, such as `{checked}/{total} selected`. */
  "data-ok-label-count": Value<string>;
  /** On a panel: which list it is. */
  "data-ok-side": Value<"left" | "right">;
  /** The buttons that move items between the lists. */
  "data-ok-transfer-list-actions": Part<"div">;
  /** The selected count in a panel's header. */
  "data-ok-transfer-list-count": Part<"span">;
  /** A panel's header: the select-all checkbox, the title and the count. */
  "data-ok-transfer-list-header": Part<"div">;
  /** A button that moves items to the other list. */
  "data-ok-transfer-list-move": Part<"button">;
  /** One item: a label around its checkbox. */
  "data-ok-transfer-list-option": Part<"label">;
  /** One list. */
  "data-ok-transfer-list-panel": Part<"section">;
  /** The title of a panel. */
  "data-ok-transfer-list-title": Part<"span">;
}

/** Tree view: parts, states, values and triggers. */
export interface TreeViewParts {
  /** On an item: the item can't be selected (it still expands). */
  "data-ok-disable-selection": State;
  /** Set by the controller on the item being dragged. */
  "data-ok-dragging": State;
  /** Set by the controller on the item a dragged item would land on: before it, after it or inside it. */
  "data-ok-drop-position": Value<"before" | "after" | "inside">;
  /** On an item: its label can be edited (F2, double click); on the tree: every item's. `"false"` opts an item out. */
  "data-ok-editable": Value<"" | "false">;
  /** On an item: its children failed to load. */
  "data-ok-error": State;
  /** Set on the label input once saved or cancelled, so its blur doesn't save it again. */
  "data-ok-finished": State;
  /** On the tree: highlights the items whose label contains this text, and their ancestors. */
  "data-ok-highlight": Value<string>;
  /** Set on an item whose label matches the highlight. */
  "data-ok-highlighted": State;
  /** Set on an ancestor of an item that matches the highlight. */
  "data-ok-highlighted-ancestor": State;
  /** On an item: its id. */
  "data-ok-item-id": Value<string>;
  /** On an item: children to load from the data source when it expands. */
  "data-ok-lazy": State;
  /** On an item, with `data-ok-items-reordering`: `"false"` keeps it in place. */
  "data-ok-reorderable": Value<"false">;
  /** On the tree: `parents`, `descendants` or both: how a selection spreads. */
  "data-ok-selection-propagation": Value<string>;
  /** The icon of an item whose children failed to load. */
  "data-ok-tree-error-icon": Part<"svg">;
  /** The default expand icon. */
  "data-ok-tree-chevron": Part;
  /** The icon of an expanded item. */
  "data-ok-tree-collapse-icon": Part;
  /** The icon of a collapsed item. */
  "data-ok-tree-expand-icon": Part;
  /** One item (`role="treeitem"`). */
  "data-ok-tree-item": Part;
  /** The checkbox of an item, with `checkboxSelection`. */
  "data-ok-tree-item-checkbox": Part;
  /** The row of an item: icon, checkbox and label. */
  "data-ok-tree-item-content": Part;
  /** The children of an item: a collapse. */
  "data-ok-tree-item-group": Part;
  /** The icon of an item. */
  "data-ok-tree-item-icon": Part;
  /** The label of an item. */
  "data-ok-tree-item-label": Part;
  /** The input that replaces the label while it is edited. */
  "data-ok-tree-item-label-input": Part<"input">;
  /** Why an item's children couldn't load, in its row. */
  "data-ok-tree-item-error": Part<"span">;
}

/** Upload: parts, states, values and triggers. */
export interface UploadParts {
  /** Set by the runtime while files are dragged over the zone: whether they would be accepted. */
  "data-ok-drag": Value<"accept" | "reject" | "unknown">;
  /** Set by the runtime while files are dragged anywhere over the page. */
  "data-ok-drag-global": State;
  /** On a file icon: the kind of file. */
  "data-ok-kind": Value<
    | "image"
    | "video"
    | "audio"
    | "pdf"
    | "document"
    | "spreadsheet"
    | "presentation"
    | "archive"
    | "other"
  >;
  /** The text of the avatar upload's overlay when it has a picture. Default "Update photo". */
  "data-ok-label-update": Value<string>;
  /** The text of the avatar upload's overlay when it is empty. Default "Upload photo". */
  "data-ok-label-upload": Value<string>;
  /** On a file icon: its color tone. */
  "data-ok-tone": Value<string>;
  /** The Remove all and Upload buttons. */
  "data-ok-upload-actions": Part<"div">;
  /** The "browse" link text of the title. */
  "data-ok-upload-browse": Part<"span">;
  /** The text under the title. */
  "data-ok-upload-description": Part<"span">;
  /** The icon of a file that isn't a picture. */
  "data-ok-upload-file": Part<"span">;
  /** The file extension on the icon. */
  "data-ok-upload-file-ext": Part<"span">;
  /** The helper text under the zone. */
  "data-ok-upload-helper-text": Part<"div">;
  /** The icon of the box variant. */
  "data-ok-upload-icon": Part<"svg">;
  /** The picture of the zone. */
  "data-ok-upload-illustration": Part<"svg">;
  /** The native file input. It covers the zone, invisible. */
  "data-ok-upload-input": Part<"input">;
  /** One file of the list. */
  "data-ok-upload-item": Part<"li">;
  /** The name of a file. */
  "data-ok-upload-item-name": Part<"span">;
  /** The size of a file. */
  "data-ok-upload-item-size": Part<"span">;
  /** The name and the size of a file. */
  "data-ok-upload-item-text": Part<"span">;
  /** The list of files. */
  "data-ok-upload-list": Part<"ul">;
  /** Opens the file dialog of the upload whose `id` it names, or of the upload it sits in. */
  "data-ok-upload-open": Trigger<"id">;
  /** What the zone shows while it is empty. */
  "data-ok-upload-placeholder": Part<"div">;
  /** The text of the placeholder. */
  "data-ok-upload-placeholder-text": Part<"div">;
  /** The preview of the single file. */
  "data-ok-upload-preview": Part<"span">;
  /** The name of the single file. */
  "data-ok-upload-preview-name": Part<"span">;
  /** The size of the single file. */
  "data-ok-upload-preview-size": Part<"span">;
  /** Why a file was rejected. */
  "data-ok-upload-rejection-error": Part<"span">;
  /** The name of a rejected file. */
  "data-ok-upload-rejection-file": Part<"span">;
  /** The list of rejected files. */
  "data-ok-upload-rejections": Part<"div">;
  /** Removes the file of the item it sits in, or the single file. */
  "data-ok-upload-remove": Trigger<"">;
  /** The Remove all button. */
  "data-ok-upload-remove-all": Part<"button">;
  /** The text of the single file's remove button. */
  "data-ok-upload-remove-text": Part<"span">;
  /** Fires `ok:upload:upload` with the files of the upload it sits in. */
  "data-ok-upload-submit": Trigger<"">;
  /** HTML only: the markup of a file item. */
  "data-ok-upload-template": Part<"template">;
  /** The thumbnail of a picture. */
  "data-ok-upload-thumb": Part<"span">;
  /** The title of the zone, such as "Drop or select a file". */
  "data-ok-upload-title": Part<"span">;
  /** The drop zone. */
  "data-ok-upload-zone": Part<"div">;
}

/** Walktour: parts, states, values and triggers. */
export interface WalktourParts {
  /** Set by the runtime on a step: the side it opened on after flipping. */
  "data-ok-current-placement": Value<string>;
  /** Set by the runtime when the browser lacks the Popover API. */
  "data-ok-fallback": State;
  /** The progress text pattern, such as `Step {current} of {total}`. */
  "data-ok-format": Value<string>;
  /** Set by the runtime: the tour's status. */
  "data-ok-status": Value<
    "idle" | "ready" | "waiting" | "running" | "paused" | "skipped" | "finished"
  >;
  /** On a step: a CSS selector of the element it points at (`body` centers it). */
  "data-ok-target": Value<string>;
  /** On a step: a CSS selector of the element to scroll to instead of the target. */
  "data-ok-scroll-target": Value<string>;
  /** On a step: a CSS selector of the element to put in the spotlight instead of the target. */
  "data-ok-spotlight-target": Value<string>;
  /** On a step: its identifier, passed in the tour's events as `step.id`. */
  "data-ok-step-id": Value<string>;
  /** HTML: on a step, JSON passed in the tour's events as `step.data`. */
  "data-ok-step-data": Value<string>;
  /** A step button and what it does. */
  "data-ok-walktour-action": Value<"back" | "close" | "primary" | "skip">;
  /** The pulsing button that opens a step. */
  "data-ok-walktour-beacon": Part<"button">;
  /** The inner dot of the beacon. */
  "data-ok-walktour-beacon-inner": Part<"span">;
  /** The content of a step. */
  "data-ok-walktour-content": Part<"div">;
  /** The buttons of a step. */
  "data-ok-walktour-footer": Part<"div">;
  /** The title and the close button of a step. */
  "data-ok-walktour-header": Part<"div">;
  /** The spotlight's cut-out around the target. */
  "data-ok-walktour-hole": Part<"path">;
  /** A visually hidden live region that announces the step. */
  "data-ok-walktour-live": Part<"span">;
  /** The dimmed area around the cut-out. */
  "data-ok-walktour-mask": Part<"path">;
  /** The overlay over the page. */
  "data-ok-walktour-overlay": Part<"div">;
  /** The progress text of a step. */
  "data-ok-walktour-progress": Part<"span">;
  /** The drawing of the mask and the cut-out. */
  "data-ok-walktour-spotlight": Part<"svg">;
  /** Starts the tour whose `id` it names again, at `data-ok-index` if given. */
  "data-ok-walktour-start": Trigger<"id">;
  /** The title of a step. */
  "data-ok-walktour-title": Part<"h2">;
}
