import { getRuntime } from "@owlky/html";

/*
 * Page script of the HTML "Items" story: like the React demo's state, the page shows the items of
 * the current page and recounts the pages when the items-per-page Select changes.
 */

const TOTAL = 120;

interface PaginationApi {
  setPage(page: number): boolean;
  refresh(): void;
}

export function itemsScript(row: HTMLElement) {
  const grid = row.querySelector(".sb-pagination-grid") as HTMLElement;
  const nav = row.querySelector("[data-ok-pagination]") as HTMLElement;
  const select = row.querySelector("[data-ok-select]") as HTMLElement;
  const template = grid.firstElementChild?.cloneNode(true) as HTMLElement;
  let perPage = 12;
  const show = (page: number) => {
    const first = (page - 1) * perPage;
    const count = Math.min(perPage, TOTAL - first);
    grid.replaceChildren(
      ...Array.from({ length: count }, (_, i) => {
        const item = template.cloneNode(true) as HTMLElement;
        (item.querySelector("[data-ok-typography]") as HTMLElement).textContent = String(
          first + i + 1,
        );
        return item;
      }),
    );
  };
  const onPage = (event: Event) => show((event as CustomEvent<{ page: number }>).detail.page);
  const onPerPage = (event: Event) => {
    perPage = Number((event as CustomEvent<{ value: string }>).detail.value);
    nav.setAttribute("data-ok-count", String(Math.ceil(TOTAL / perPage)));
    nav.setAttribute("data-ok-page", "1");
    (getRuntime().get(nav, "pagination") as unknown as PaginationApi | undefined)?.refresh();
    show(1);
  };
  nav.addEventListener("ok:pagination:change", onPage);
  select.addEventListener("ok:select:change", onPerPage);
  return () => {
    nav.removeEventListener("ok:pagination:change", onPage);
    select.removeEventListener("ok:select:change", onPerPage);
  };
}

export const ITEMS_SCRIPT_SOURCE = `import { getRuntime } from "@owlky/html";

// Show the items of the current page; recount the pages when the items per page change.
const TOTAL = 120;
const grid = document.querySelector(".sb-pagination-grid");
const nav = document.querySelector('[data-ok-pagination][aria-label="Items pages"]');
const template = grid.firstElementChild.cloneNode(true);
let perPage = 12;

function show(page) {
  const first = (page - 1) * perPage;
  const count = Math.min(perPage, TOTAL - first);
  grid.replaceChildren(
    ...Array.from({ length: count }, (_, i) => {
      const item = template.cloneNode(true);
      item.querySelector("[data-ok-typography]").textContent = String(first + i + 1);
      return item;
    }),
  );
}

nav.addEventListener("ok:pagination:change", (event) => show(event.detail.page));
document.getElementById("items-per-page").closest("[data-ok-select]")
  .addEventListener("ok:select:change", (event) => {
    perPage = Number(event.detail.value);
    nav.setAttribute("data-ok-count", String(Math.ceil(TOTAL / perPage)));
    nav.setAttribute("data-ok-page", "1");
    getRuntime().get(nav, "pagination").refresh();
    show(1);
  });
`;
