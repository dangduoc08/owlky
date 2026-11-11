/** Color pickers (HTML stories): the picked colors shown under the swatches, as React's demos do. */

/** Single (Radio): the checked color. */
export function singleColorScript(row: HTMLElement) {
  const group = row.querySelector('[role="radiogroup"]') as HTMLElement;
  const output = row.querySelector("#color-picker-value") as HTMLElement;
  const abort = new AbortController();
  group.addEventListener(
    "change",
    (event) => {
      output.textContent = (event.target as HTMLInputElement).value;
    },
    { signal: abort.signal },
  );
  return () => abort.abort();
}

export const SINGLE_COLOR_SCRIPT_SOURCE = `// Show the picked color under the swatches
const group = document.querySelector('[role="radiogroup"][aria-label="Color"]');
const output = document.getElementById("color-picker-value");
group.addEventListener("change", (event) => {
  output.textContent = event.target.value;
});`;

/** Multiple (Checkbox): the checked colors, in the palette's order. */
export function multipleColorScript(row: HTMLElement) {
  const group = row.querySelector('[role="group"]') as HTMLElement;
  const output = row.querySelector("#color-picker-values") as HTMLElement;
  const abort = new AbortController();
  group.addEventListener(
    "change",
    () => {
      const checked = group.querySelectorAll<HTMLInputElement>("input:checked");
      output.textContent = [...checked].map((input) => input.value).join(", ");
    },
    { signal: abort.signal },
  );
  return () => abort.abort();
}

export const MULTIPLE_COLOR_SCRIPT_SOURCE = `// Show the picked colors under the swatches, in the palette's order
const group = document.querySelector('[role="group"][aria-label="Colors"]');
const output = document.getElementById("color-picker-values");
group.addEventListener("change", () => {
  const checked = group.querySelectorAll("input:checked");
  output.textContent = [...checked].map((input) => input.value).join(", ");
});`;
