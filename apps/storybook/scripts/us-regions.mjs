// Writes public/maps/us-regions.geojson (the four US Census regions) from public/maps/us-states.geojson
// (Natural Earth 1:110m, public domain): one MultiPolygon per region, named by its states' `region`.
//   node apps/storybook/scripts/us-regions.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const folder = resolve(dirname(fileURLToPath(import.meta.url)), "../public/maps");
const states = JSON.parse(readFileSync(resolve(folder, "us-states.geojson"), "utf8"));
const regions = new Map();
for (const { geometry, properties } of states.features) {
  const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  regions.set(properties.region, [...(regions.get(properties.region) ?? []), ...polygons]);
}
const features = [...regions].map(([name, coordinates]) => ({
  type: "Feature",
  properties: { name },
  geometry: { type: "MultiPolygon", coordinates },
}));
writeFileSync(
  resolve(folder, "us-regions.geojson"),
  JSON.stringify({ type: "FeatureCollection", features }),
);
