import { createSortableController } from "@minimal-tailwind/core";
import { defineComponent } from "../../runtime/define.js";
import type { ComponentInstance } from "../../runtime/types.js";

export interface SortableInstance extends ComponentInstance {
  /** Moves an item. Returns `false` if out of range or `mt:sortable:move` was prevented. */
  move(from: number, to: number): boolean;
  /** Removes an item. Returns `false` if out of range or `mt:sortable:remove` was prevented. */
  remove(index: number): boolean;
  /** Appends a clone of `template[data-mt-sortable-template]`; returns it (or `null`). */
  add(): HTMLElement | null;
}

const ITEM = "[data-mt-sortable-item]";

/**
 * Sortable — spec: specs/components/sortable.md
 *
 * Markup:  <ul data-mt-sortable data-mt-layout="grid" aria-label="…">
 *            <li data-mt-sortable-item> … <div data-mt-sortable-actions>
 *              <button data-mt-sortable-remove aria-label="Remove …">? <button data-mt-sortable-handle …>
 *            <template data-mt-sortable-template>…</template>?
 *          <button data-mt-sortable-add="<list id>">
 * Events:  mt:sortable:move (cancelable, detail: { from, to, item }),
 *          mt:sortable:remove (cancelable, detail: { index, item }),
 *          mt:sortable:add (detail: { item, index }) after a template clone is inserted.
 */
export const sortable = defineComponent<SortableInstance>({
  name: "sortable",
  selector: "[data-mt-sortable]",

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
          ":scope > template[data-mt-sortable-template]",
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
      selector: "[data-mt-sortable-add]",
      handle(trigger, event, runtime) {
        const id = trigger.getAttribute("data-mt-sortable-add") as string;
        const list = (trigger.getRootNode() as Document | ShadowRoot).getElementById(id);
        const instance = runtime.getOrCreate<SortableInstance>(list, "sortable");
        if (!instance) {
          console.warn(
            `[minimal-tailwind] No sortable list with id "${id}" for this trigger.`,
            trigger,
          );
          return;
        }
        event.preventDefault();
        instance.add();
      },
    },
  ],
});
