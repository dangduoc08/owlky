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

/** Zoom and pan (HTML): the toolbar needs no script; the button centers a person. */
export function zoomScript(row: HTMLElement) {
  const element = row.querySelector("#org-zoom") as HTMLElement;
  const chart = () =>
    getRuntime().get(element, "organization-chart") as unknown as {
      centerOnNode(nodeId: string): Promise<void>;
    };
  const center = () => void chart().centerOnNode("tomas");
  const button = row.querySelector("#org-zoom-center");
  button?.addEventListener("click", center);
  return () => button?.removeEventListener("click", center);
}

export const ZOOM_SCRIPT_SOURCE = `import { getRuntime } from "@owlky/html";

// The toolbar works on its own: it names the chart with data-ok-organization-chart-toolbar
const chart = getRuntime().get(document.getElementById("org-zoom"), "organization-chart");

// Expands the collapsed branches above the node, then centers it in the scroll area
document.getElementById("org-zoom-center").addEventListener("click", () => chart.centerOnNode("tomas"));`;

/** The selection methods the selection and breadcrumb stories call. */
interface SelectionApi {
  setSelection(nodeIds: string[]): void;
  clearSelection(): void;
  getSelection(): string[];
  getNodePath(nodeId: string): string[];
  centerOnNode(nodeId: string): Promise<void>;
}

/** A person's name: the first line of their card. */
const personName = (chart: Element, id: string) =>
  chart.querySelector(
    `[data-ok-node-id="${CSS.escape(id)}"] > [data-ok-organization-chart-label] .sb-org-name`,
  )?.textContent ?? id;

/** Selection (HTML): the buttons call the methods; the status line names the selection. */
export function selectionScript(row: HTMLElement) {
  const element = row.querySelector("#org-selection") as HTMLElement;
  const status = row.querySelector("#org-selection-status") as HTMLElement;
  const chart = () => getRuntime().get(element, "organization-chart") as unknown as SelectionApi;
  const show = (ids: string[]) => {
    status.textContent = ids.length
      ? `Selected: ${ids.map((id) => personName(element, id)).join(", ")}`
      : "No one is selected.";
  };
  const controller = new AbortController();
  const { signal } = controller;
  element.addEventListener(
    "ok:organization-chart:select",
    (event) => show((event as CustomEvent<{ selectedNodes: string[] }>).detail.selectedNodes),
    { signal },
  );
  row.querySelector("#org-select-leads")?.addEventListener(
    "click",
    () => {
      chart().setSelection(["jonah", "priya", "leila"]);
      show(chart().getSelection());
    },
    { signal },
  );
  row.querySelector("#org-select-clear")?.addEventListener(
    "click",
    () => {
      chart().clearSelection();
      show([]);
    },
    { signal },
  );
  return () => controller.abort();
}

export const SELECTION_SCRIPT_SOURCE = `import { getRuntime } from "@owlky/html";

const element = document.getElementById("org-selection");
const chart = getRuntime().get(element, "organization-chart");
const status = document.getElementById("org-selection-status");

// A person's name: the first line of their card
const nameOf = (id) =>
  element.querySelector(\`[data-ok-node-id="\${id}"] > [data-ok-organization-chart-label] .sb-org-name\`).textContent;
const show = (ids) => {
  status.textContent = ids.length ? \`Selected: \${ids.map(nameOf).join(", ")}\` : "No one is selected.";
};

// A click on a card or Space on a focused node asks for a new selection
element.addEventListener("ok:organization-chart:select", (event) => show(event.detail.selectedNodes));

// The methods change the selection without an event
document.getElementById("org-select-leads").addEventListener("click", () => {
  chart.setSelection(["jonah", "priya", "leila"]);
  show(chart.getSelection());
});
document.getElementById("org-select-clear").addEventListener("click", () => {
  chart.clearSelection();
  show([]);
});`;

/** Breadcrumb attributes of a manager's button (a Link rendered as a button). */
const CRUMB = [
  ["data-ok-typography", ""],
  ["data-ok-variant", "inherit"],
  ["data-ok-link", ""],
  ["data-ok-color", "inherit"],
  ["data-ok-underline", "hover"],
  ["type", "button"],
] as const;

/** Breadcrumb (HTML): the trail follows the selected node; its buttons select a manager. */
export function breadcrumbScript(row: HTMLElement) {
  const element = row.querySelector("#org-breadcrumb") as HTMLElement;
  const list = row.querySelector("#org-breadcrumb-trail [data-ok-breadcrumbs-list]") as HTMLElement;
  const chart = () => getRuntime().get(element, "organization-chart") as unknown as SelectionApi;
  const item = (content: Node) => {
    const li = document.createElement("li");
    li.setAttribute("data-ok-breadcrumbs-item", "");
    li.append(content);
    return li;
  };
  const render = (path: string[]) => {
    const items: Node[] = [];
    path.forEach((id, index) => {
      if (index < path.length - 1) {
        const button = document.createElement("button");
        for (const [name, value] of CRUMB) button.setAttribute(name, value);
        button.value = id;
        button.textContent = personName(element, id);
        const separator = document.createElement("li");
        separator.setAttribute("data-ok-breadcrumbs-separator", "");
        separator.setAttribute("aria-hidden", "true");
        separator.textContent = "/";
        items.push(item(button), separator);
      } else {
        const span = document.createElement("span");
        span.setAttribute("aria-current", "location");
        span.textContent = personName(element, id);
        items.push(item(span));
      }
    });
    if (!path.length) {
      const span = document.createElement("span");
      span.textContent = "No one is selected.";
      items.push(item(span));
    }
    list.replaceChildren(...items);
  };
  const controller = new AbortController();
  const { signal } = controller;
  element.addEventListener(
    "ok:organization-chart:select",
    (event) => {
      const [id] = (event as CustomEvent<{ selectedNodes: string[] }>).detail.selectedNodes;
      render(id ? chart().getNodePath(id) : []);
    },
    { signal },
  );
  list.addEventListener(
    "click",
    (event) => {
      const button = (event.target as Element).closest("button");
      if (!button) return;
      chart().setSelection([button.value]);
      render(chart().getNodePath(button.value));
      void chart().centerOnNode(button.value);
    },
    { signal },
  );
  return () => controller.abort();
}

export const BREADCRUMB_SCRIPT_SOURCE = `import { getRuntime } from "@owlky/html";

const element = document.getElementById("org-breadcrumb");
const chart = getRuntime().get(element, "organization-chart");
const list = document.querySelector("#org-breadcrumb-trail [data-ok-breadcrumbs-list]");

// A person's name: the first line of their card
const nameOf = (id) =>
  element.querySelector(\`[data-ok-node-id="\${id}"] > [data-ok-organization-chart-label] .sb-org-name\`).textContent;
const item = (content) => {
  const li = document.createElement("li");
  li.setAttribute("data-ok-breadcrumbs-item", "");
  li.append(content);
  return li;
};

// The trail: a button per manager (a Link rendered as a button), then the selected person
function render(path) {
  const items = [];
  path.forEach((id, index) => {
    if (index < path.length - 1) {
      const button = document.createElement("button");
      button.type = "button";
      button.value = id;
      button.setAttribute("data-ok-typography", "");
      button.setAttribute("data-ok-variant", "inherit");
      button.setAttribute("data-ok-link", "");
      button.setAttribute("data-ok-color", "inherit");
      button.setAttribute("data-ok-underline", "hover");
      button.textContent = nameOf(id);
      const separator = document.createElement("li");
      separator.setAttribute("data-ok-breadcrumbs-separator", "");
      separator.setAttribute("aria-hidden", "true");
      separator.textContent = "/";
      items.push(item(button), separator);
    } else {
      const span = document.createElement("span");
      span.setAttribute("aria-current", "location");
      span.textContent = nameOf(id);
      items.push(item(span));
    }
  });
  if (!path.length) {
    const span = document.createElement("span");
    span.textContent = "No one is selected.";
    items.push(item(span));
  }
  list.replaceChildren(...items);
}

// getNodePath(id) returns the ids from the top node down to the node
element.addEventListener("ok:organization-chart:select", (event) => {
  const [id] = event.detail.selectedNodes;
  render(id ? chart.getNodePath(id) : []);
});

// A manager's button selects them and centers the chart on them
list.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  chart.setSelection([button.value]);
  render(chart.getNodePath(button.value));
  chart.centerOnNode(button.value);
});`;
