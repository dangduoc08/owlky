import {
  BREADCRUMBS_EXPAND_TEXT,
  breadcrumbsCollapse,
  breadcrumbsOptions,
  readNumber,
} from "@owlky/core";
import { defineComponent } from "../../runtime/define.js";
import type { ComponentInstance, EventSpec } from "../../runtime/types.js";

/** Events of this component (`ok:<name>:<event>` on the root). */
export interface BreadcrumbsEvents {
  /** Before the collapsed items are shown. Call `preventDefault()` to keep them collapsed. */
  expand: EventSpec<undefined, true>;
}

export interface BreadcrumbsInstance extends ComponentInstance {
  /** `true` while items are collapsed behind the expand button. */
  readonly collapsed: boolean;
  /** Shows every item and removes the expand button. Returns `false` if prevented. */
  expand(): boolean;
}

const { maxItems, itemsBeforeCollapse, itemsAfterCollapse } = breadcrumbsOptions.options;
const SVG = "http://www.w3.org/2000/svg";
const COLLAPSED = "[data-ok-breadcrumbs-collapsed]";

/** The "more" icon, built with DOM APIs (no markup strings). */
function moreIcon(): SVGSVGElement {
  const svg = document.createElementNS(SVG, "svg");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "currentColor");
  for (const cx of ["6", "12", "18"]) {
    const circle = document.createElementNS(SVG, "circle");
    circle.setAttribute("cx", cx);
    circle.setAttribute("cy", "12");
    circle.setAttribute("r", "2");
    svg.append(circle);
  }
  return svg;
}

/**
 * Breadcrumbs — spec: specs/components/breadcrumbs.md
 *
 * Markup:  <nav data-ok-breadcrumbs aria-label="breadcrumb">
 *            <ol data-ok-breadcrumbs-list>
 *              <li data-ok-breadcrumbs-item><a href="/">Home</a></li>
 *              <li data-ok-breadcrumbs-separator aria-hidden="true">/</li>
 *              <li data-ok-breadcrumbs-item><span aria-current="page">Page</span></li>
 * Behavior: more items than `data-ok-max-items` (default 8) collapse: the runtime hides the middle
 *          ones and inserts an expand button (`data-ok-expand-text`, default "Show path"); markup
 *          that is already collapsed (as React renders it) is kept. Expanding shows every item and
 *          focuses the first one that was hidden.
 * Events:  ok:breadcrumbs:expand (cancelable).
 */
export const breadcrumbs = defineComponent<BreadcrumbsInstance, BreadcrumbsEvents>({
  name: "breadcrumbs",
  selector: "[data-ok-breadcrumbs]",

  setup(element, { emit, signal }) {
    const list = () => element.querySelector<HTMLElement>("[data-ok-breadcrumbs-list]");
    const own = (selector: string) =>
      [...(list()?.children ?? [])].filter((child): child is HTMLElement =>
        child.matches(selector),
      );
    const items = () => own(`[data-ok-breadcrumbs-item]:not(${COLLAPSED})`);

    const collapse = () => {
      const ol = list();
      if (!ol || element.hasAttribute("data-ok-expanded") || own(COLLAPSED).length > 0) return;
      const all = items();
      const range = breadcrumbsCollapse(all.length, {
        maxItems: readNumber(element, maxItems) as number,
        itemsBeforeCollapse: readNumber(element, itemsBeforeCollapse) as number,
        itemsAfterCollapse: readNumber(element, itemsAfterCollapse) as number,
      });
      if (!range) return;
      const first = all[range.start] as HTMLElement;
      for (const item of all.slice(range.start, range.end)) {
        item.hidden = true;
        const separator = item.nextElementSibling;
        if (separator?.matches("[data-ok-breadcrumbs-separator]"))
          (separator as HTMLElement).hidden = true;
      }
      const li = document.createElement("li");
      li.setAttribute("data-ok-breadcrumbs-item", "");
      li.setAttribute("data-ok-breadcrumbs-collapsed", "");
      const button = document.createElement("button");
      button.type = "button";
      button.setAttribute("data-ok-breadcrumbs-expand", "");
      button.setAttribute(
        "aria-label",
        element.getAttribute("data-ok-expand-text") || BREADCRUMBS_EXPAND_TEXT,
      );
      button.append(moreIcon());
      li.append(button);
      ol.insertBefore(li, first);
      const template = own("[data-ok-breadcrumbs-separator]")[0];
      const separator = template?.cloneNode(true) as HTMLElement | undefined;
      if (separator) {
        separator.hidden = false;
        ol.insertBefore(separator, first);
      }
    };

    const instance: BreadcrumbsInstance = {
      get collapsed() {
        return own(COLLAPSED).length > 0;
      },
      expand() {
        const button = own(COLLAPSED)[0];
        if (!button) return true;
        if (!emit("expand", undefined, { cancelable: true })) return false;
        const separator = button.nextElementSibling;
        const first = items().find((item) => item.hidden);
        button.remove();
        if (separator?.matches("[data-ok-breadcrumbs-separator]")) separator.remove();
        for (const child of own("[hidden]")) child.hidden = false;
        element.setAttribute("data-ok-expanded", "");
        first?.querySelector<HTMLElement>("a, button, [tabindex]")?.focus();
        return true;
      },
    };

    element.addEventListener(
      "click",
      (event) => {
        const target = event.target as Element;
        if (target.closest?.("[data-ok-breadcrumbs-expand]") && element.contains(target))
          instance.expand();
      },
      { signal },
    );
    collapse();
    return instance;
  },
});
