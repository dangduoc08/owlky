import { getRuntime } from "@owlky/html";
import { bytes, storageScale } from "./slider-examples.js";

interface SliderApi {
  setScale(
    scale: ((value: number) => number) | null,
    format?: ((value: number, index: number) => string) | null,
  ): void;
}

/** Non-linear scale (HTML): the value label and the announced value are 2 to the value, in bytes. */
export function nonLinearScript(row: HTMLElement) {
  const element = row.querySelector("[data-ok-slider]") as HTMLElement;
  const api = getRuntime().get(element, "slider") as unknown as SliderApi;
  api.setScale(storageScale, bytes);
  return () => api.setScale(null);
}

export const NON_LINEAR_SCRIPT_SOURCE = `import { getRuntime } from "@owlky/html";

function bytes(value) {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = value;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return \`\${size} \${units[unit]}\`;
}

// Show and announce 2 to the value, as a size in bytes
const slider = getRuntime().get(document.querySelector("[data-ok-slider]"), "slider");
slider.setScale((value) => 2 ** value, bytes);`;
