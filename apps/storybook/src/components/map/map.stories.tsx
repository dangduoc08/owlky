import { setMapWorkerUrl } from "@owlky/core/map";
import workerUrl from "@owlky/core/map-worker.js?url";
import { getRuntime, map } from "@owlky/html";
import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentType } from "react";
import { frameworkStory, reactGroupsStory } from "../../helpers/groups.js";
import { snippetStory } from "../shared/snippets.js";
import { BubblesDemo } from "./demos/bubbles.js";
import bubblesSource from "./demos/bubbles.tsx?raw";
import { ChangeThemeDemo } from "./demos/change-theme.js";
import changeThemeSource from "./demos/change-theme.tsx?raw";
import { ChoroplethDemo } from "./demos/choropleth.js";
import choroplethSource from "./demos/choropleth.tsx?raw";
import { ClustersDemo } from "./demos/clusters.js";
import clustersSource from "./demos/clusters.tsx?raw";
import { DraggableMarkersDemo } from "./demos/draggable-markers.js";
import draggableSource from "./demos/draggable-markers.tsx?raw";
import { ExportMapDemo } from "./demos/export-map.js";
import exportMapSource from "./demos/export-map.tsx?raw";
import { GeojsonAnimationDemo } from "./demos/geojson-animation.js";
import animationSource from "./demos/geojson-animation.tsx?raw";
import { GreatCirclesDemo } from "./demos/great-circles.js";
import greatCirclesSource from "./demos/great-circles.tsx?raw";
import { HeatmapDemo } from "./demos/heatmap.js";
import heatmapSource from "./demos/heatmap.tsx?raw";
import { HexbinDemo } from "./demos/hexbin.js";
import hexbinSource from "./demos/hexbin.tsx?raw";
import { HighlightByFilterDemo } from "./demos/highlight-by-filter.js";
import highlightSource from "./demos/highlight-by-filter.tsx?raw";
import { InteractionDemo } from "./demos/interaction.js";
import interactionSource from "./demos/interaction.tsx?raw";
import { MarkersPopupsDemo } from "./demos/markers-popups.js";
import markersSource from "./demos/markers-popups.tsx?raw";
import { PixelMapDemo } from "./demos/pixel-map.js";
import pixelMapSource from "./demos/pixel-map.tsx?raw";
import { RegionDrilldownDemo } from "./demos/region-drilldown.js";
import regionDrilldownSource from "./demos/region-drilldown.tsx?raw";
import { SideBySideDemo } from "./demos/side-by-side.js";
import sideBySideSource from "./demos/side-by-side.tsx?raw";
import { ViewportAnimationDemo } from "./demos/viewport-animation.js";
import viewportSource from "./demos/viewport-animation.tsx?raw";
import { MapDocs } from "./map-docs.js";
import { MAP_SCRIPTS } from "./map-scripts.js";

// MapLibre draws in a Web Worker: bundlers point it at Owlky's copy (ADR-0025).
setMapWorkerUrl(workerUrl);
// The Map is opt-in (not in `components`): register it on the page's runtime, as `@owlky/html/map` does.
getRuntime().register(map);

const snippets = import.meta.glob(
  "../../../../../packages/html/src/components/map/examples/*.html",
  {
    query: "?raw",
    import: "default",
    eager: true,
  },
) as Record<string, string>;

const CDN = "https://cdn.jsdelivr.net/npm/@owlky/html@0/dist";
const SETUP = [
  "<!-- Once per page (CDN): owlky-map-worker.js sits next to owlky-map.js. -->",
  `<link rel="stylesheet" href="${CDN}/owlky.css">`,
  `<script src="${CDN}/owlky.js" defer></script>`,
  `<script src="${CDN}/owlky-map.js" defer></script>`,
  '<!-- npm: import "@owlky/styles/owlky.css", "@owlky/html/auto", then "@owlky/html/map"; point setMapWorkerUrl() (from @owlky/core/map) at "@owlky/core/map-worker.js". -->',
].join("\n");

const meta = {
  title: "Components/Map",
  tags: ["autodocs"],
  parameters: {
    docs: {
      page: MapDocs,
      description: { component: "An interactive map with markers, popups and data layers." },
    },
  },
} satisfies Meta;
export default meta;

/** One story: the HTML snippet with its page script, and the React demo with its source. */
const story = (
  name: string,
  file: string,
  title: string,
  Demo: ComponentType,
  source: string,
): StoryObj => ({
  ...frameworkStory({
    html: snippetStory(snippets, file, [[title, "group"]], SETUP, undefined, {
      group: MAP_SCRIPTS[file] ?? {},
    }),
    react: reactGroupsStory([{ title, content: <Demo /> }], undefined, source),
  }),
  name,
});

export const ChangeTheme = story(
  "Change theme",
  "change-theme",
  "Change theme",
  ChangeThemeDemo,
  changeThemeSource,
);
export const MarkersPopups = story(
  "Markers & popups",
  "markers-popups",
  "Markers & popups",
  MarkersPopupsDemo,
  markersSource,
);
export const DraggableMarkers = story(
  "Draggable markers",
  "draggable-markers",
  "Draggable markers",
  DraggableMarkersDemo,
  draggableSource,
);
export const GeojsonAnimation = story(
  "GeoJSON animation",
  "geojson-animation",
  "GeoJSON animation",
  GeojsonAnimationDemo,
  animationSource,
);
export const Clusters = story("Clusters", "clusters", "Clusters", ClustersDemo, clustersSource);
export const Interaction = story(
  "Interaction",
  "interaction",
  "Interaction",
  InteractionDemo,
  interactionSource,
);
export const ViewportAnimation = story(
  "Viewport animation",
  "viewport-animation",
  "Viewport animation",
  ViewportAnimationDemo,
  viewportSource,
);
export const HighlightByFilter = story(
  "Highlight by filter",
  "highlight-by-filter",
  "Highlight by filter",
  HighlightByFilterDemo,
  highlightSource,
);
export const Heatmap = story("Heatmap", "heatmap", "Heatmap", HeatmapDemo, heatmapSource);
export const SideBySide = story(
  "Side by side",
  "side-by-side",
  "Side by side",
  SideBySideDemo,
  sideBySideSource,
);
export const GreatCircles = story(
  "Great circles",
  "great-circles",
  "Great circles",
  GreatCirclesDemo,
  greatCirclesSource,
);
export const RegionDrilldown = story(
  "Region drilldown",
  "region-drilldown",
  "Region drilldown",
  RegionDrilldownDemo,
  regionDrilldownSource,
);
export const ExportMap = story("Export", "export-map", "Export", ExportMapDemo, exportMapSource);
export const Choropleth = story(
  "Choropleth",
  "choropleth",
  "Choropleth",
  ChoroplethDemo,
  choroplethSource,
);
// Roadmap 4.18.94–4.18.98 (ApexMaps): proportional symbols, hexbins, pixel maps, patterns, selection.
export const Bubbles = story("Bubbles", "bubbles", "Bubbles", BubblesDemo, bubblesSource);
export const Hexbin = story("Hexbin", "hexbin", "Hexbin", HexbinDemo, hexbinSource);
export const PixelMap = story("Pixel map", "pixel-map", "Pixel map", PixelMapDemo, pixelMapSource);
