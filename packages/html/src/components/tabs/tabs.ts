import { createTabsController, tabsOf, tabValue } from "@owlky/core";
import { defineComponent } from "../../runtime/define.js";
import type { ComponentInstance, EventSpec } from "../../runtime/types.js";

/** Events of this component (`ok:<name>:<event>` on the root). */
export interface TabsEvents {
  /** Before another tab is selected. Call `preventDefault()` to keep the current one. */
  change: EventSpec<{ value: string | null; previous: string | null; tab: Element }, true>;
}

export interface TabsInstance extends ComponentInstance {
  /** The selected tab's value (its `value` attribute, else its position), or `null`. */
  readonly value: string | null;
  /** Selects the tab with `value` (shows its panel), without emitting events. */
  setValue(value: string): void;
  /** Selects `tab` as the user would. Returns `false` if disabled, unknown or prevented. */
  select(tab: Element): boolean;
}

/**
 * Tabs — spec: specs/components/tabs.md
 *
 * Markup:  <div data-ok-tabs data-ok-variant="standard" …>
 *            <div data-ok-tabs-scroller>
 *              <div role="tablist" data-ok-tabs-list aria-label="…">
 *                <button type="button" role="tab" data-ok-tab id="t1" aria-controls="p1"
 *                        aria-selected="true" tabindex="0">…</button> …
 *              </div>
 *              <span data-ok-tabs-indicator></span>
 *            </div>
 *          </div>
 *          <div role="tabpanel" data-ok-tab-panel id="p1" aria-labelledby="t1" tabindex="0">…</div>
 * Behavior: core `createTabsController` (arrow keys, Home / End, scroll buttons, indicator); the
 *          runtime applies the selection: `aria-selected`, `tabindex`, and `hidden` on the panels
 *          the tabs name in `aria-controls`.
 * Events:  ok:tabs:change (cancelable, detail `{ value, previous, tab }`).
 */
export const tabs = defineComponent<TabsInstance, TabsEvents>({
  name: "tabs",
  selector: "[data-ok-tabs]",

  setup(element, { emit }) {
    const root = element.getRootNode() as Document | ShadowRoot;
    const panel = (tab: Element) => {
      const id = tab.getAttribute("aria-controls");
      return id ? root.getElementById(id) : null;
    };
    const valueOfTab = (tab: Element) => tabValue(tab, tabsOf(element).indexOf(tab as HTMLElement));
    const selected = () =>
      tabsOf(element).find((tab) => tab.getAttribute("aria-selected") === "true") ?? null;

    const apply = (next: Element) => {
      for (const tab of tabsOf(element)) {
        tab.setAttribute("aria-selected", String(tab === next));
        tab.tabIndex = tab === next ? 0 : -1;
        const target = panel(tab);
        if (target) target.hidden = tab !== next;
      }
      controller.update();
    };

    const instance: TabsInstance = {
      get value() {
        const tab = selected();
        return tab ? valueOfTab(tab) : null;
      },
      setValue(value) {
        const tab = tabsOf(element).find((item) => valueOfTab(item) === value);
        if (tab) apply(tab);
      },
      select(tab) {
        if (!tabsOf(element).includes(tab as HTMLElement)) return false;
        if ((tab as HTMLButtonElement).disabled) return false;
        const previous = instance.value;
        const value = valueOfTab(tab);
        if (value === previous) return true;
        if (!emit("change", { value, previous, tab }, { cancelable: true })) return false;
        apply(tab);
        return true;
      },
      destroy() {
        controller.destroy();
      },
    };
    const controller = createTabsController(element, { onSelect: (tab) => instance.select(tab) });
    return instance;
  },
});
