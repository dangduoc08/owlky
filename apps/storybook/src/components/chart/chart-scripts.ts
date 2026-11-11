import type { ChartGeometry } from "@owlky/core";
import { type ChartInstance, getRuntime } from "@owlky/html";
import { LIVE_POINTS, liveLabel, liveValue } from "./chart-data.js";
import { US_STATES_GEOMETRY } from "./chart-geo-geometry.js";

interface ChartApi {
  updateSeries(series: readonly { name: string; data: number[] }[], categories?: string[]): void;
  appendData(
    data: readonly { data: number[] }[],
    options?: { categories?: string[]; limit?: number },
  ): void;
}

/** Live data (HTML): "Add a point" appends one value and drops the oldest; "Reset" replaces all. */
export function liveScript(row: HTMLElement) {
  const element = row.querySelector("[data-ok-chart]") as HTMLElement;
  const chart = getRuntime().get(element, "chart") as unknown as ChartApi;
  let step = LIVE_POINTS - 1;
  const click = (event: Event) => {
    // The demo's two buttons, in order: "Add a point", "Reset".
    const button = (event.target as Element).closest("[data-ok-button]");
    const buttons = [...row.querySelectorAll("[data-ok-button]")];
    const action = button ? ["add", "reset"][buttons.indexOf(button)] : undefined;
    if (action === "add") {
      step += 1;
      chart.appendData([{ data: [liveValue(step)] }], {
        categories: [liveLabel(step)],
        limit: LIVE_POINTS,
      });
    } else if (action === "reset") {
      step = LIVE_POINTS - 1;
      const steps = Array.from({ length: LIVE_POINTS }, (_, i) => i);
      chart.updateSeries([{ name: "Requests", data: steps.map(liveValue) }], steps.map(liveLabel));
    }
  };
  row.addEventListener("click", click);
  return () => row.removeEventListener("click", click);
}

/** The script as shown in the Code panel. */
export const LIVE_SCRIPT_SOURCE = `import { getRuntime } from "@owlky/html";

const element = document.querySelector("[data-ok-chart]");
const chart = getRuntime().get(element, "chart");

// New data arrives (from a WebSocket, a poll…): append it and keep the last 12 points.
function onData(time, requests) {
  chart.appendData([{ data: [requests] }], { categories: [time], limit: 12 });
}

// Replace everything at once.
chart.updateSeries([{ name: "Requests", data: [42, 51, 47] }], ["10:00:00", "10:00:05", "10:00:10"]);`;

/** Geo stories: the page script hands the geometry to every chart in the row. */
export function geoScript(row: HTMLElement) {
  const runtime = getRuntime();
  runtime.init(row);
  for (const element of row.querySelectorAll<HTMLElement>("[data-ok-chart]"))
    runtime.get<ChartInstance>(element, "chart")?.setGeometry(US_STATES_GEOMETRY as ChartGeometry);
  return () => {};
}

export const GEO_SCRIPT_SOURCE = `import { getRuntime } from "@owlky/html";

// Your GeoJSON: Natural Earth's public domain boundaries, for example.
const response = await fetch("/maps/us-states.geojson");
const geometry = await response.json();
for (const element of document.querySelectorAll("[data-ok-chart]"))
  getRuntime().get(element, "chart").setGeometry(geometry);`;
