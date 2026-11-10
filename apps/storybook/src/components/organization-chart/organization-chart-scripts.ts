import { getRuntime } from "@owlky/html";

/** The chart instance's methods the stories call. */
interface ChartApi {
  expandAll(): void;
  collapseAll(): void;
  expandToDepth(depth: number): void;
}

/** Expand and collapse (HTML): the buttons call the instance methods. */
export function collapsibleScript(row: HTMLElement) {
  const element = row.querySelector("[data-ok-organization-chart]") as HTMLElement;
  const chart = () => getRuntime().get(element, "organization-chart") as unknown as ChartApi;
  const actions: [string, () => void][] = [
    ["org-expand-all", () => chart().expandAll()],
    ["org-collapse-all", () => chart().collapseAll()],
    ["org-expand-depth", () => chart().expandToDepth(1)],
  ];
  const controller = new AbortController();
  for (const [id, run] of actions)
    row.querySelector(`#${id}`)?.addEventListener("click", run, { signal: controller.signal });
  return () => controller.abort();
}

export const COLLAPSIBLE_SCRIPT_SOURCE = `import { getRuntime } from "@owlky/html";

const element = document.getElementById("org-collapsible");
const chart = getRuntime().get(element, "organization-chart");

document.getElementById("org-expand-all").addEventListener("click", () => chart.expandAll());
document.getElementById("org-collapse-all").addEventListener("click", () => chart.collapseAll());
// Depth 0 is the root: depth 1 shows the root and its children
document.getElementById("org-expand-depth").addEventListener("click", () => chart.expandToDepth(1));`;

/** Lazy children (HTML): the reports come from a template after a short delay. */
export function lazyScript(row: HTMLElement) {
  const element = row.querySelector("[data-ok-organization-chart]") as HTMLElement;
  const load = (event: Event) => {
    const { nodeId, respondWith } = (
      event as CustomEvent<{ nodeId: string | null; respondWith(nodes: unknown): void }>
    ).detail;
    const template = row.querySelector<HTMLTemplateElement>(`#org-lazy-${nodeId}`);
    respondWith(
      new Promise((resolve) =>
        setTimeout(() => resolve(template?.content.cloneNode(true) ?? null), 800),
      ),
    );
  };
  element.addEventListener("ok:organization-chart:loadchildren", load);
  return () => element.removeEventListener("ok:organization-chart:loadchildren", load);
}

export const LAZY_SCRIPT_SOURCE = `const element = document.getElementById("org-lazy");

// A node whose children list is empty asks for its children on its first expand
element.addEventListener("ok:organization-chart:loadchildren", (event) => {
  const { nodeId, respondWith } = event.detail;
  // The reports come from a template here; a server request works the same way
  const template = document.getElementById(\`org-lazy-\${nodeId}\`);
  respondWith(
    new Promise((resolve) =>
      setTimeout(() => resolve(template ? template.content.cloneNode(true) : null), 800),
    ),
  );
});`;

/** The highlight methods the search story calls. */
interface HighlightApi {
  highlightNode(nodeId: string): Promise<void>;
  clearHighlight(): void;
}

/** Search (HTML): a pick in the Autocomplete highlights that person; the status line says so. */
export function searchScript(row: HTMLElement) {
  const element = row.querySelector("#org-search") as HTMLElement;
  const field = row.querySelector("[data-ok-autocomplete]") as HTMLElement;
  const status = row.querySelector("#org-search-status") as HTMLElement;
  const chart = () => getRuntime().get(element, "organization-chart") as unknown as HighlightApi;
  const pick = (event: Event) => {
    const { value } = (event as CustomEvent<{ value: string | string[] | null }>).detail;
    const option =
      typeof value === "string"
        ? field.querySelector(`[role="option"][data-ok-value="${CSS.escape(value)}"]`)
        : null;
    if (typeof value === "string" && option) {
      void chart().highlightNode(value);
      status.textContent = `${option.textContent?.trim()} is highlighted in the chart.`;
    } else {
      chart().clearHighlight();
      status.textContent = "";
    }
  };
  field.addEventListener("ok:autocomplete:change", pick);
  return () => field.removeEventListener("ok:autocomplete:change", pick);
}

export const SEARCH_SCRIPT_SOURCE = `import { getRuntime } from "@owlky/html";

const chart = getRuntime().get(document.getElementById("org-search"), "organization-chart");
const field = document.querySelector("[data-ok-autocomplete]");
const status = document.getElementById("org-search-status");

// The options' values are the nodes' data-ok-node-id
field.addEventListener("ok:autocomplete:change", (event) => {
  const { value } = event.detail;
  const option = value && field.querySelector(\`[role="option"][data-ok-value="\${CSS.escape(value)}"]\`);
  if (option) {
    // Opens the collapsed branches above the node, scrolls to it and highlights its path
    chart.highlightNode(value);
    status.textContent = \`\${option.textContent.trim()} is highlighted in the chart.\`;
  } else {
    chart.clearHighlight();
    status.textContent = "";
  }
});`;
