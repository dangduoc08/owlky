/*
 * Geo chart stories: the US states from Storybook's static folder (Natural Earth 1:110m, public
 * domain), bundled as text so React and the HTML page script draw the same shapes offline.
 */
import raw from "../../../public/maps/us-states.geojson?raw";

export const US_STATES_GEOMETRY = JSON.parse(raw) as {
  type: "FeatureCollection";
  features: { properties: { name: string }; geometry: { type: string; coordinates: unknown } }[];
};
