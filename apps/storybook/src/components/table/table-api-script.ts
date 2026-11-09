import { getRuntime } from "@owlky/html";

/*
 * Page script of the HTML "Table pagination with API" story: like the React demo's state, the
 * Search button filters the rows by the text and the category, and the query line follows the
 * pagination. The TablePagination runtime pages the rows that are left.
 */

interface PaginationApi {
  readonly page: number;
  readonly rowsPerPage: number;
  refresh(): void;
}

export function tableApiScript(row: HTMLElement) {
  const body = row.querySelector("#table-api tbody") as HTMLTableSectionElement;
  const all = [...body.rows];
  const pagination = row.querySelector("[data-ok-table-pagination]") as HTMLElement;
  const search = row.querySelector("#table-api-search") as HTMLInputElement;
  const category = row.querySelector("#table-api-category")?.closest("[data-ok-select]");
  const [endpoint, counts] = row.querySelectorAll(".sb-table-api-query > p");
  const api = () => getRuntime().get(pagination, "table-pagination") as unknown as PaginationApi;
  const describe = () => {
    const { page, rowsPerPage } = api();
    const items = body.rows.length;
    (endpoint?.querySelector("code") as HTMLElement).textContent =
      `/api/pagination?page=${page + 1}&perPage=${rowsPerPage}`;
    const [, itemsText, , pagesText] = counts?.childNodes ?? [];
    if (itemsText) itemsText.textContent = ` ${items} `;
    if (pagesText) pagesText.textContent = ` ${Math.max(Math.ceil(items / rowsPerPage), 1)}`;
  };
  const onClick = (event: Event) => {
    if (!(event.target as Element).closest(".sb-table-api-filters > [data-ok-button]")) return;
    const text = search.value.trim();
    const wanted =
      (category?.querySelector("[data-ok-select-input]") as HTMLInputElement | null)?.value ?? "";
    body.replaceChildren(
      ...all.filter((tr) => {
        const [id, name, kind] = [...tr.cells].map((cell) => cell.textContent ?? "");
        return (
          (wanted === "" || kind === wanted) && (text === "" || `${id} ${name}`.includes(text))
        );
      }),
    );
    api().refresh();
    describe();
  };
  // The pagination's change event fires before it applies the page: describe it a task later.
  const onPage = () => setTimeout(describe);
  row.addEventListener("click", onClick);
  pagination.addEventListener("ok:table-pagination:change", onPage);
  return () => {
    row.removeEventListener("click", onClick);
    pagination.removeEventListener("ok:table-pagination:change", onPage);
  };
}

export const TABLE_API_SCRIPT_SOURCE = `import { getRuntime } from "@owlky/html";

// Search filters the rows; the TablePagination runtime pages the rows that are left.
const body = document.querySelector("#table-api tbody");
const all = [...body.rows];
const pagination = document.querySelector('[data-ok-table-pagination="table-api"]');
const search = document.getElementById("table-api-search");
const category = document.getElementById("table-api-category").closest("[data-ok-select]");

document.querySelector(".sb-table-api-filters > [data-ok-button]").addEventListener("click", () => {
  const text = search.value.trim();
  const wanted = category.querySelector("[data-ok-select-input]").value;
  body.replaceChildren(
    ...all.filter((tr) => {
      const [id, name, kind] = [...tr.cells].map((cell) => cell.textContent);
      return (wanted === "" || kind === wanted) && (text === "" || \`\${id} \${name}\`.includes(text));
    }),
  );
  getRuntime().get(pagination, "table-pagination").refresh();
});
`;
