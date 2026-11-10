import {
  createSortableController,
  defaultSortableMessages,
  type SortableDragEvent,
  type SortableMessages,
} from "@owlky/core";
import { defineComponent } from "../../runtime/define.js";
import type { ComponentInstance, EventSpec } from "../../runtime/types.js";

/** Events of this component (`ok:<name>:<event>` on the root). */
export interface SortableEvents {
  /** Before an item moves from index `from` to `to`. Call `preventDefault()` to keep the order. */
  move: EventSpec<{ from: number; to: number; item: HTMLElement }, true>;
  /**
   * Before two items trade places (lists with `data-ok-strategy="swap"`): the item at `from` and
   * `target` at `to`. Call `preventDefault()` to keep the order.
   */
  swap: EventSpec<{ from: number; to: number; item: HTMLElement; target: HTMLElement }, true>;
  /** Before an item is removed. Call `preventDefault()` to keep it. */
  remove: EventSpec<{ index: number; item: HTMLElement }, true>;
  /** After a copy of the new-item template was added: fill in its content here. */
  add: EventSpec<{ item: HTMLElement; index: number }>;
  /**
   * Before an item moves to another list of its group (`data-ok-group`), at `index` in `to`.
   * Fires on the list it leaves. Call `preventDefault()` to keep it.
   */
  transfer: EventSpec<
    { item: HTMLElement; from: HTMLElement; to: HTMLElement; index: number },
    true
  >;
  /** An item was grabbed (keyboard, tap) or started a pointer drag. */
  dragstart: EventSpec<{ item: HTMLElement; index: number; list: HTMLElement }>;
  /** The item is about to move to `index` in `list` (this list or another one). */
  dragover: EventSpec<{ item: HTMLElement; index: number; list: HTMLElement }>;
  /** The item was dropped in this list, at `index`. */
  dragend: EventSpec<{ item: HTMLElement; index: number; list: HTMLElement }>;
  /** A move was cancelled (Escape, an interrupted touch), before the item goes back. */
  dragcancel: EventSpec<{ item: HTMLElement; index: number; list: HTMLElement }>;
}

export interface SortableInstance extends ComponentInstance {
  /** Moves an item. Returns `false` if out of range or `ok:sortable:move` was prevented. */
  move(from: number, to: number): boolean;
  /**
   * Swaps two items (the `swap` strategy's move). Returns `false` if out of range or
   * `ok:sortable:swap` was prevented.
   */
  swap(from: number, to: number): boolean;
  /** Removes an item. Returns `false` if out of range or `ok:sortable:remove` was prevented. */
  remove(index: number): boolean;
  /** Appends a clone of `template[data-ok-sortable-template]`; returns it (or `null`). */
  add(): HTMLElement | null;
  /**
   * Moves the item at `index` to another sortable list (an element or its `id`), at `toIndex`
   * (default: its end). Returns `false` if out of range or `ok:sortable:transfer` was prevented.
   */
  transfer(index: number, to: HTMLElement | string, toIndex?: number): boolean;
}

const ITEM = "[data-ok-sortable-item]";
const TEMPLATE = ":scope > template[data-ok-sortable-template]";
/** Announcement keys and the attributes that replace their text (`data-ok-message-<name>`). */
const MESSAGES: [keyof SortableMessages, string][] = [
  ["grabbed", "grabbed"],
  ["moved", "moved"],
  ["movedToList", "moved-to-list"],
  ["dropped", "dropped"],
  ["cancelled", "cancelled"],
  ["removed", "removed"],
];

/**
 * Sortable — spec: specs/components/sortable.md
 *
 * Markup:  <ul data-ok-sortable data-ok-layout="grid" aria-label="…">
 *            <li data-ok-sortable-item> … <div data-ok-sortable-actions>
 *              <button data-ok-sortable-remove aria-label="Remove …">? <button data-ok-sortable-handle …>
 *            <template data-ok-sortable-template>…</template>?
 *          <button data-ok-sortable-add="<list id>">
 * Several lists (ADR-0053): data-ok-group="<name>" connects lists, data-ok-accept="<names>"
 *          widens or narrows what a list takes; [data-ok-sortable-move-to="<list id>"] in an item
 *          moves it to that list.
 * Messages: data-ok-message-<grabbed|moved|moved-to-list|dropped|cancelled|removed> on the list,
 *          with {position}, {total} and {list} (read when announced).
 * Disabled: li[data-ok-disabled] (+ the handle's `disabled`) never moves and isn't a target.
 * Options: data-ok-strategy="swap" (two items trade places), data-ok-activator="item" (drag from
 *          anywhere on an item; the handle stays for keys and taps).
 * Events:  ok:sortable:dragstart / dragover / dragend / dragcancel (detail: { item, index, list }),
 *          ok:sortable:move (cancelable, detail: { from, to, item }),
 *          ok:sortable:swap (cancelable, detail: { from, to, item, target }),
 *          ok:sortable:transfer (cancelable, detail: { item, from, to, index }) on the list it leaves,
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
      swap(from, to) {
        const all = items();
        const item = all[from];
        const target = all[to];
        if (!item || !target || from === to) return false;
        if (!emit("swap", { from, to, item, target }, { cancelable: true })) return false;
        const next = item.nextSibling;
        if (next === target) list.insertBefore(target, item);
        else {
          list.insertBefore(item, target);
          list.insertBefore(target, next);
        }
        return true;
      },
      remove(index) {
        const item = items()[index];
        if (!item) return false;
        if (!emit("remove", { index, item }, { cancelable: true })) return false;
        item.remove();
        return true;
      },
      transfer(index, to, toIndex) {
        const item = items()[index];
        const target =
          typeof to === "string" ? (list.ownerDocument.getElementById(to) as HTMLElement) : to;
        if (!item || !target?.matches("[data-ok-sortable]") || target === list) return false;
        const others = Array.from(target.children).filter((child) => child.matches(ITEM));
        const at = Math.max(0, Math.min(others.length, toIndex ?? others.length));
        if (!emit("transfer", { item, from: list, to: target, index: at }, { cancelable: true }))
          return false;
        target.insertBefore(item, others[at] ?? target.querySelector(TEMPLATE));
        return true;
      },
      add() {
        const template = list.querySelector<HTMLTemplateElement>(TEMPLATE);
        const clone = template?.content.firstElementChild?.cloneNode(true);
        if (!(clone instanceof HTMLElement)) return null;
        list.insertBefore(clone, template as HTMLTemplateElement);
        emit("add", { item: clone, index: items().length - 1 });
        return clone;
      },
    };

    // Texts from the list's attributes, read when announced (they may change at any time).
    const messages: Partial<SortableMessages> = {};
    for (const [key, name] of MESSAGES)
      messages[key] = (position, total, label) => {
        const text = list.getAttribute(`data-ok-message-${name}`);
        if (text === null) return defaultSortableMessages[key](position, total, label);
        return text
          .replaceAll("{position}", String(position))
          .replaceAll("{total}", String(total))
          .replaceAll("{list}", label);
      };
    const relay =
      (name: "dragstart" | "dragover" | "dragend" | "dragcancel") =>
      ({ item, index, list: target }: SortableDragEvent) =>
        emit(name, { item, index, list: target });
    const controller = createSortableController(list, {
      messages,
      onMove: (from, to) => instance.move(from, to),
      onSwap: (from, to) => instance.swap(from, to),
      onRemove: (index) => instance.remove(index),
      onTransfer: ({ fromIndex, to, index }) => instance.transfer(fromIndex, to, index),
      onDragStart: relay("dragstart"),
      onDragOver: relay("dragover"),
      onDragEnd: relay("dragend"),
      onDragCancel: relay("dragcancel"),
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
