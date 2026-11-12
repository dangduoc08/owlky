import { paletteColorNames } from "@owlky/tokens";
import {
  type DataAttributes,
  defineOptions,
  flag,
  number,
  optionAttributes,
  style,
} from "../options/define.js";

// --- Organization chart -------------------------------------------------------------------------

export const organizationChartLineColors = ["divider", "inherit", ...paletteColorNames] as const;
export const organizationChartLineStyles = ["solid", "dashed", "dotted"] as const;
export const organizationChartDirections = ["top", "bottom", "left", "right"] as const;
export const organizationChartEdgeColorModes = ["default", "node"] as const;
export const organizationChartSelectionModes = ["single", "multi"] as const;

export type OrganizationChartLineColor = (typeof organizationChartLineColors)[number];
export type OrganizationChartLineStyle = (typeof organizationChartLineStyles)[number];
export type OrganizationChartDirection = (typeof organizationChartDirections)[number];
export type OrganizationChartEdgeColorMode = (typeof organizationChartEdgeColorModes)[number];

const CHART_LENGTH = { min: 0, units: ["px", "rem", "em"] } as const;

export const organizationChartOptions = defineOptions(
  "organization-chart",
  "data-ok-organization-chart",
  {
    direction: style(
      "data-ok-direction",
      organizationChartDirections,
      "top",
      "Where the root sits: `top` (default, children below), `bottom`, `left` (at the inline start) or `right`.",
      { optional: true },
    ),
    lineHeight: number(
      "data-ok-line-height",
      40,
      "Height of the connectors between two levels: a number in px, or a CSS length.",
      CHART_LENGTH,
    ),
    lineWidth: number(
      "data-ok-line-width",
      1,
      "Thickness of the connectors: a number in px, or a CSS length.",
      CHART_LENGTH,
    ),
    lineColor: style(
      "data-ok-line-color",
      organizationChartLineColors,
      "divider",
      "`divider` (default), `inherit` (the text color) or a palette color (its light tone).",
    ),
    lineStyle: style(
      "data-ok-line-style",
      organizationChartLineStyles,
      "solid",
      "Line style of the connectors.",
    ),
    edgeColorMode: style(
      "data-ok-edge-color-mode",
      organizationChartEdgeColorModes,
      "default",
      "`default`: a node's own `lineColor` and `lineStyle` style the lines to its children only. `node`: they style its whole branch, down to the nodes that set their own.",
      { optional: true },
    ),
    lineBorderRadius: number(
      "data-ok-line-border-radius",
      24,
      "Corner radius where a connector turns: a number in px, or a CSS length.",
      CHART_LENGTH,
    ),
    nodePadding: number(
      "data-ok-node-padding",
      4,
      "Space on each side of every node: a number in px, or a CSS length.",
      CHART_LENGTH,
    ),
    groupLeafNodes: flag(
      "data-ok-group-leaf-nodes",
      "Two or more children without children of their own stack in one column, joined to their parent by a line along their side.",
    ),
    groupLeafNodesSpacing: number(
      "data-ok-group-leaf-nodes-spacing",
      8,
      "Space between grouped leaf nodes: a number in px, or a CSS length.",
      CHART_LENGTH,
    ),
    enableExpandCollapse: flag(
      "data-ok-enable-expand-collapse",
      "Nodes with children can be collapsed and expanded with their toggle button.",
    ),
    expandCollapseOnNodeClick: flag(
      "data-ok-expand-collapse-on-node-click",
      "A click on a node's label (outside its buttons and links) also toggles its children.",
    ),
    collapseBadgeThreshold: number(
      "data-ok-collapse-badge-threshold",
      1,
      "Smallest number of hidden descendants that a collapsed node's badge shows.",
      { min: 1 },
    ),
    highlightOnHover: flag(
      "data-ok-highlight-on-hover",
      "Hovering or focusing a node highlights its path to the root and dims the other nodes.",
    ),
    dimOpacity: number(
      "data-ok-dim-opacity",
      0.7,
      "How much nodes outside a highlighted path fade, from 0 (not at all) to 1 (hidden).",
      { min: 0 },
    ),
    enableZoomPan: flag(
      "data-ok-enable-zoom-pan",
      "Ctrl or Command with the mouse wheel, a trackpad pinch, the + / − / 0 keys and the toolbar zoom the chart; a mouse drag pans it.",
    ),
    zoom: number(
      "data-ok-zoom",
      1,
      "The zoom level, from `minZoom` to `maxZoom` (1 is 100%). Changed by the user with zoom and pan on.",
      { min: 0.01 },
    ),
    minZoom: number("data-ok-min-zoom", 0.25, "The smallest zoom level.", { min: 0.01 }),
    maxZoom: number("data-ok-max-zoom", 2, "The largest zoom level.", { min: 0.01 }),
    enableKeyboardNavigation: flag(
      "data-ok-enable-keyboard-navigation",
      "The chart becomes a tree with one tab stop: the arrow keys move between visible nodes, expand and collapse them, Home and End go to the first and last node, letters jump to a node.",
    ),
    enableSelection: style(
      "data-ok-enable-selection",
      organizationChartSelectionModes,
      "single",
      "Nodes with an id can be selected with a click or Space: `single` (one node) or `multi` (several). Turns on keyboard navigation.",
      { optional: true },
    ),
  },
);

export interface OrganizationChartAnatomyOptions {
  direction?: OrganizationChartDirection | undefined;
  lineHeight?: number | string | undefined;
  lineWidth?: number | string | undefined;
  lineColor?: OrganizationChartLineColor | undefined;
  lineStyle?: OrganizationChartLineStyle | undefined;
  edgeColorMode?: OrganizationChartEdgeColorMode | undefined;
  lineBorderRadius?: number | string | undefined;
  nodePadding?: number | string | undefined;
  groupLeafNodes?: boolean | undefined;
  groupLeafNodesSpacing?: number | string | undefined;
  enableExpandCollapse?: boolean | undefined;
  expandCollapseOnNodeClick?: boolean | undefined;
  collapseBadgeThreshold?: number | undefined;
  highlightOnHover?: boolean | undefined;
  dimOpacity?: number | undefined;
  enableZoomPan?: boolean | undefined;
  zoom?: number | undefined;
  minZoom?: number | undefined;
  maxZoom?: number | undefined;
  enableKeyboardNavigation?: boolean | undefined;
  enableSelection?: (typeof organizationChartSelectionModes)[number] | false | undefined;
}

/** `data-ok-*` attributes of an organization chart (the outer `ul`). */
export const organizationChartAttributes = (
  options: OrganizationChartAnatomyOptions = {},
): DataAttributes => optionAttributes(organizationChartOptions, { ...options });

/** Per-node line options (ApexTree `edgeColorMode: "node"`): the lines from a node to its children. */
export const organizationChartNodeOptions = defineOptions(
  "organization-chart-node",
  "data-ok-organization-chart-node",
  {
    lineColor: style(
      "data-ok-line-color",
      organizationChartLineColors,
      "divider",
      "Color of the lines from this node to its children (its whole branch with `edgeColorMode` `node`); none: the chart's.",
      { optional: true },
    ),
    lineStyle: style(
      "data-ok-line-style",
      organizationChartLineStyles,
      "solid",
      "Line style of the lines from this node to its children (its whole branch with `edgeColorMode` `node`); none: the chart's.",
      { optional: true },
    ),
  },
);

export interface OrganizationChartNodeAnatomyOptions {
  lineColor?: OrganizationChartLineColor | undefined;
  lineStyle?: OrganizationChartLineStyle | undefined;
}

/** `data-ok-*` attributes of an organization chart node (an `li`). */
export const organizationChartNodeAttributes = (
  options: OrganizationChartNodeAnatomyOptions = {},
): DataAttributes => optionAttributes(organizationChartNodeOptions, { ...options });
