import { type PaginationItemData, paginationItems } from "@owlky/core";
import { defineComponent } from "../../runtime/define.js";
import type { ComponentInstance } from "../../runtime/types.js";

export interface PaginationInstance extends ComponentInstance {
  /** Current page (1-based). */
  readonly page: number;
  readonly count: number;
  /** Returns `false` if out of range, the current page, or `ok:pagination:change` was prevented. */
  setPage(page: number): boolean;
  /** Rebuilds the items from the attributes (after changing `data-ok-count`…). */
  refresh(): void;
}

const NAV_TYPES = ["first", "previous", "next", "last"] as const;
type NavType = (typeof NAV_TYPES)[number];

/** A whole number ≥ `min` from an attribute, else the fallback. */
const whole = (element: Element, attr: string, fallback: number, min: number) => {
  const raw = element.getAttribute(attr);
  const value = Number(raw);
  return raw !== null && raw !== "" && Number.isInteger(value) && value >= min ? value : fallback;
};

const fill = (template: string, page: number) => template.split("{page}").join(String(page));

/**
 * Pagination — spec: specs/components/pagination.md
 *
 * Markup:  <nav data-ok-pagination aria-label="…" data-ok-count="10" data-ok-page="1">
 *            <ul><li><button data-ok-pagination-item data-ok-type="previous|page|next…">…</li></ul>
 * Options: data-ok-sibling-count, data-ok-boundary-count, data-ok-disabled,
 *          data-ok-label-page ("Go to page {page}"), data-ok-label-current ("page {page}");
 *          first / previous / next / last = the buttons present in the markup
 * Events:  ok:pagination:change (cancelable, detail.page)
 */
export const pagination = defineComponent<PaginationInstance>({
  name: "pagination",
  selector: "[data-ok-pagination]",

  setup(element, { emit }) {
    const list = element.querySelector(":scope > ul");
    // The navigation buttons are authored (labels, icons); page items are built from the range.
    const navItems = new Map<NavType, HTMLLIElement>();
    for (const type of NAV_TYPES) {
      const li = list?.querySelector<HTMLElement>(`[data-ok-type="${type}"]`)?.closest("li");
      if (li) navItems.set(type, li);
    }

    const count = () => whole(element, "data-ok-count", 1, 0);
    const clamp = (page: number) => Math.min(Math.max(page, 1), Math.max(count(), 1));
    let page = clamp(whole(element, "data-ok-page", 1, 1));

    const pageItem = (item: PaginationItemData, disabled: boolean) => {
      const li = document.createElement("li");
      const target = item.page as number;
      const button = document.createElement("button");
      button.type = "button";
      button.setAttribute("data-ok-pagination-item", "");
      button.setAttribute("data-ok-type", "page");
      button.value = String(target);
      const template = item.selected
        ? (element.getAttribute("data-ok-label-current") ?? "page {page}")
        : (element.getAttribute("data-ok-label-page") ?? "Go to page {page}");
      button.setAttribute("aria-label", fill(template, target));
      if (item.selected) button.setAttribute("aria-current", "page");
      button.disabled = disabled;
      button.textContent = String(target);
      li.append(button);
      return li;
    };

    const ellipsis = () => {
      const li = document.createElement("li");
      const span = document.createElement("span");
      span.setAttribute("data-ok-pagination-ellipsis", "");
      span.setAttribute("aria-hidden", "true");
      span.textContent = "…";
      li.append(span);
      return li;
    };

    const render = () => {
      if (!list) return;
      const disabled = element.hasAttribute("data-ok-disabled");
      const items = paginationItems({
        count: count(),
        page,
        boundaryCount: whole(element, "data-ok-boundary-count", 1, 0),
        siblingCount: whole(element, "data-ok-sibling-count", 1, 0),
        showFirstButton: navItems.has("first"),
        showLastButton: navItems.has("last"),
        hidePrevButton: !navItems.has("previous"),
        hideNextButton: !navItems.has("next"),
        disabled,
      });
      // Moving the focused element blurs it: restore focus on the same control afterwards.
      const active = element.contains(document.activeElement)
        ? (document.activeElement as HTMLElement)
        : null;
      const activeValue = active?.getAttribute("value");
      list.replaceChildren(
        ...items.map((item) => {
          if (item.type === "page") return pageItem(item, disabled);
          if (item.page === null) return ellipsis();
          const li = navItems.get(item.type as NavType) as HTMLLIElement;
          (li.querySelector("button") as HTMLButtonElement).disabled = item.disabled;
          return li;
        }),
      );
      if (!active) return;
      const restore =
        active.isConnected && !(active as HTMLButtonElement).disabled
          ? active
          : (list.querySelector<HTMLElement>(`button[value="${activeValue}"]:not(:disabled)`) ??
            list.querySelector<HTMLElement>('[aria-current="page"]:not(:disabled)'));
      restore?.focus({ preventScroll: true });
    };

    const instance: PaginationInstance = {
      get page() {
        return page;
      },
      get count() {
        return count();
      },
      setPage(next) {
        if (!Number.isInteger(next) || next < 1 || next > count() || next === page) return false;
        if (!emit("change", { page: next }, { cancelable: true })) return false;
        page = next;
        element.setAttribute("data-ok-page", String(page));
        render();
        return true;
      },
      refresh() {
        page = clamp(page);
        render();
      },
    };
    render();
    return instance;
  },

  delegate: [
    {
      event: "click",
      selector: "[data-ok-pagination-item]",
      handle(item, _event, runtime) {
        const root = item.closest("[data-ok-pagination]");
        // Always mounted: delegation skips data-ok-runtime="off" subtrees.
        const instance = runtime.getOrCreate<PaginationInstance>(
          root,
          "pagination",
        ) as PaginationInstance;
        const type = item.getAttribute("data-ok-type");
        const targets: Record<string, number> = {
          page: Number(item.getAttribute("value")),
          first: 1,
          previous: instance.page - 1,
          next: instance.page + 1,
          last: instance.count,
        };
        instance.setPage(targets[type as string] ?? Number.NaN);
      },
    },
  ],
});
