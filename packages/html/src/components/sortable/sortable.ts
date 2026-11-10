import { createSortableController } from "@owlky/core";
import { defineComponent } from "../../runtime/define.js";
import type { ComponentInstance, EventSpec } from "../../runtime/types.js";

/** Events of this component (`ok:<name>:<event>` on the root). */
export interface SortableEvents {
  /** Before an item moves from index `from` to `to`. Call `preventDefault()` to keep the order. */
  move: EventSpec<{ from: number; to: number; item: HTMLElement }, true>;
  /** Before an item is removed. Call `preventDefault()` to keep it. */
  remove: EventSpec<{ index: number; item: HTMLElement }, true>;
  /** After a copy of the new-item template was added: fill in its content here. */
  add: EventSpec<{ item: HTMLElement; index: number }>;
}

export interface SortableInstance extends ComponentInstance {
  /** Moves an item. Returns `false` if out of range or `ok:sortable:move` was prevented. */
  move(from: number, to: number): boolean;
  /** Removes an item. Returns `false` if out of range or `ok:sortable:remove` was prevented. */
  remove(index: number): boolean;
  /** Appends a clone of `template[data-ok-sortable-template]`; returns it (or `null`). */
  add(): HTMLElement | null;
}

const ITEM = "[data-ok-sortable-item]";

/**
 * Sortable — spec: specs/components/sortable.md
 *
 * Markup:  <ul data-ok-sortable data-ok-layout="grid" aria-label="…">
 *            <li data-ok-sortable-item> … <div data-ok-sortable-actions>
 *              <button data-ok-sortable-remove aria-label="Remove …">? <button data-ok-sortable-handle …>
 *            <template data-ok-sortable-template>…</template>?
 *          <button data-ok-sortable-add="<list id>">
 * Events:  ok:sortable:move (cancelable, detail: { from, to, item }),
 *          ok:sortable:remove (cancelable, detail: { index, item }),
 *          ok:sortable:add (detail: { item, index }) after a template clone is inserted.
 */
export const sortable = defineComponent<SortableInstance, SortableEvents>({
  name: "sortable",
  selector: "[data-ok-sortable]",

  setup(list, { emit }) {
    const items = () =>
      Array.from(list.children).filter((child): child is HTMLElement => child.matches(ITEM));

    const instance: SortableInstance = {
      move(from, to) {
        const all = items();
        const item = all[from];
        const target = all[to];
        if (!item || !target || from === to) return false;
        if (!emit("move", { from, to, item }, { cancelable: true })) return false;
        list.insertBefore(item, to > from ? target.nextSibling : target);
        return true;
      },
      remove(index) {
        const item = items()[index];
        if (!item) return false;
        if (!emit("remove", { index, item }, { cancelable: true })) return false;
        item.remove();
        return true;
      },
      add() {
        const template = list.querySelector<HTMLTemplateElement>(
          ":scope > template[data-ok-sortable-template]",
        );
        const clone = template?.content.firstElementChild?.cloneNode(true);
        if (!(clone instanceof HTMLElement)) return null;
        list.insertBefore(clone, template as HTMLTemplateElement);
        emit("add", { item: clone, index: items().length - 1 });
        return clone;
      },
    };

    const controller = createSortableController(list, {
      onMove: (from, to) => instance.move(from, to),
      onRemove: (index) => instance.remove(index),
    });
    return { ...instance, destroy: () => controller.destroy() };
  },

  delegate: [
    {
      event: "click",
      selector: "[data-ok-sortable-add]",
      handle(trigger, event, runtime) {
        const id = trigger.getAttribute("data-ok-sortable-add") as string;
        const list = (trigger.getRootNode() as Document | ShadowRoot).getElementById(id);
        const instance = runtime.getOrCreate<SortableInstance>(list, "sortable");
        if (!instance) {
          console.warn(`[owlky] No sortable list with id "${id}" for this trigger.`, trigger);
          return;
        }
        event.preventDefault();
        instance.add();
      },
    },
  ],
});
