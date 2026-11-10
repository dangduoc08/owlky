import { getRuntime } from "@owlky/html";
import { MANY_OPTIONS } from "./autocomplete-examples.js";

interface AutocompleteApi {
  setOptions(options: readonly string[]): void;
}
const autocompleteIn = (row: HTMLElement) => {
  const element = row.querySelector("[data-ok-autocomplete]") as HTMLElement;
  return {
    element,
    api: getRuntime().get(element, "autocomplete") as unknown as AutocompleteApi,
  };
};

const FILMS = [
  "Alien",
  "Amélie",
  "Casablanca",
  "City of God",
  "Inception",
  "Parasite",
  "Spirited Away",
  "The Matrix",
];

/** Load on open (HTML): the options load the first time the list opens. */
export function loadOnOpenScript(row: HTMLElement) {
  const { element, api } = autocompleteIn(row);
  let timer: ReturnType<typeof setTimeout> | undefined;
  let loaded = false;
  const load = () => {
    if (loaded) return;
    loaded = true;
    element.setAttribute("data-ok-loading", "");
    timer = setTimeout(() => {
      api.setOptions(FILMS);
      element.removeAttribute("data-ok-loading");
    }, 1000);
  };
  element.addEventListener("ok:autocomplete:open", load);
  return () => {
    clearTimeout(timer);
    element.removeEventListener("ok:autocomplete:open", load);
  };
}

export const LOAD_ON_OPEN_SCRIPT_SOURCE = `import { getRuntime } from "@owlky/html";

const element = document.getElementById("ac-async").closest("[data-ok-autocomplete]");
const autocomplete = getRuntime().get(element, "autocomplete");

// Load the options the first time the list opens; "Loading…" shows meanwhile
element.addEventListener(
  "ok:autocomplete:open",
  async () => {
    element.setAttribute("data-ok-loading", "");
    autocomplete.setOptions(await fetchFilms());
    element.removeAttribute("data-ok-loading");
  },
  { once: true },
);`;

/** Virtualization (HTML): 10,000 options set from data. */
export function virtualizationScript(row: HTMLElement) {
  autocompleteIn(row).api.setOptions(MANY_OPTIONS);
  return undefined;
}

export const VIRTUALIZATION_SCRIPT_SOURCE = `import { getRuntime } from "@owlky/html";

const element = document.getElementById("ac-virtual").closest("[data-ok-autocomplete]");
const options = Array.from({ length: 10000 }, (_, index) => \`Option \${index + 1}\`);

// The list draws only the options in view (data-ok-virtualize)
getRuntime().get(element, "autocomplete").setOptions(options);`;
