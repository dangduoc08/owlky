"use client";

import {
  arrayMove,
  createSortableController,
  iconButtonAttributes,
  moveBetweenLists,
  type SortableController,
  type SortableLayout,
  type SortableMessages,
  type SortableTransferTarget,
  sortableAttributes,
} from "@owlky/core";
import {
  type ComponentPropsWithoutRef,
  forwardRef,
  type Key,
  type ReactNode,
  type Ref,
  useEffect,
  useId,
  useRef,
} from "react";
import { useMergedRefs } from "../utils/refs.js";

/** Decorative icons of the item actions (same SVG as the HTML snippets). */
const RemoveIcon = () => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <path d="M7 7l10 10M17 7 7 17" />
  </svg>
);

const HandleIcon = () => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
  >
    <path d="M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01" />
  </svg>
);

/** A drag event: the item, its index and the `id` of its list (for `onDragOver`: where it goes). */
export interface SortableDragEvent<T> {
  /** The dragged (or grabbed) item. */
  item: T;
  /** Its index in `list` (for `onDragOver`: the index it is about to take). */
  index: number;
  /** The `id` of the list it is in (for `onDragOver`: the list it is about to enter). */
  list: string;
}

/** A move of an item to another list of its group (`onTransfer`). */
export interface SortableTransferEvent<T> extends SortableTransferTarget {
  /** The item that moves. */
  item: T;
}

// The drag callbacks replace the list element's native HTML drag and drop handlers of the same names.
export interface SortableProps<T>
  extends Omit<
    ComponentPropsWithoutRef<"ul">,
    "children" | "onDragStart" | "onDragOver" | "onDragEnd"
  > {
  /** The items, in display order. */
  items: readonly T[];
  /** Stable identity of an item (React key). */
  getKey: (item: T) => Key;
  /** Content of an item. */
  renderItem: (item: T, index: number) => ReactNode;
  /** Called with the reordered items (controlled: render them to apply the move). */
  onReorder: (items: T[]) => void;
  /** Renders a remove button per item and is called when one is pressed. */
  onRemove?: ((item: T, index: number) => void) | undefined;
  /** Name used in the handle / remove labels ("Reorder …", "Remove …"). Default `Item <n>`. */
  getItemLabel?: ((item: T, index: number) => string) | undefined;
  /** Default `"grid"`. */
  layout?: SortableLayout | undefined;
  /** Screen reader announcements (localization). */
  messages?: Partial<SortableMessages> | undefined;
  /**
   * Connects lists: items move between lists of the page with the same group (drag, keys, taps,
   * move-to triggers). Give each list an `id`.
   */
  group?: string | undefined;
  /**
   * The groups this list takes items from (default: its own `group`). Set it to take items from
   * other groups, such as a "Done" list that takes tasks but gives none back.
   */
  accept?: string | readonly string[] | undefined;
  /**
   * Called when an item of this list moves to another list. Update both lists, for example with
   * `moveBetweenLists(lists, event)`. Without it, items never leave the list.
   */
  onTransfer?: ((event: SortableTransferEvent<T>) => void) | undefined;
  /** Items that can't move: their handle is disabled and other items don't take their place. */
  isItemDisabled?: ((item: T, index: number) => boolean) | undefined;
  /**
   * While dragging near the edge of a scroll area (such as a Scrollbar) or the window, it
   * scrolls. Default `true`.
   */
  autoScroll?: boolean | undefined;
  /** Called when an item is grabbed (keyboard, tap) or starts a pointer drag. */
  onDragStart?: ((event: SortableDragEvent<T>) => void) | undefined;
  /** Called before the item moves over another position, in this list or another one. */
  onDragOver?: ((event: SortableDragEvent<T>) => void) | undefined;
  /** Called when the item is dropped in this list. */
  onDragEnd?: ((event: SortableDragEvent<T>) => void) | undefined;
  /** Called when a move is cancelled (Escape, an interrupted touch), before the item goes back. */
  onDragCancel?: ((event: SortableDragEvent<T>) => void) | undefined;
}

function SortableInner<T>(
  {
    items,
    getKey,
    renderItem,
    onReorder,
    onRemove,
    getItemLabel,
    layout,
    messages,
    group,
    accept,
    onTransfer,
    isItemDisabled,
    autoScroll,
    onDragStart,
    onDragOver,
    onDragEnd,
    onDragCancel,
    id,
    ...props
  }: SortableProps<T>,
  forwardedRef: Ref<HTMLUListElement>,
) {
  const listRef = useRef<HTMLUListElement>(null);
  const ref = useMergedRefs(listRef, forwardedRef);
  const controllerRef = useRef<SortableController | null>(null);
  // The controller outlives renders: it reads the latest items and callbacks through refs.
  const callbacks = { items, onReorder, onRemove, onTransfer };
  const drags = { onDragStart, onDragOver, onDragEnd, onDragCancel };
  const latest = useRef({ ...callbacks, ...drags });
  latest.current = { ...callbacks, ...drags };
  // Transfers name lists by id: a list in a group always has one.
  const generatedId = useId();
  const listId = id ?? (group ? generatedId : undefined);

  useEffect(() => {
    const controller = createSortableController(listRef.current as HTMLUListElement);
    controllerRef.current = controller;
    return () => controller.destroy();
  }, []);

  useEffect(() => {
    /** The data of an item element of this list (the controller reports elements). */
    const dataOf = (element: HTMLElement) => {
      const all = Array.from(listRef.current?.children ?? []);
      return latest.current.items[all.indexOf(element)] as T;
    };
    const drag =
      (key: keyof typeof drags) =>
      ({ item, index, list }: { item: HTMLElement; index: number; list: HTMLElement }) =>
        latest.current[key]?.({ item: dataOf(item), index, list: list.id });
    controllerRef.current?.setOptions({
      messages,
      onDragStart: drag("onDragStart"),
      onDragOver: drag("onDragOver"),
      onDragEnd: drag("onDragEnd"),
      onDragCancel: drag("onDragCancel"),
      onMove: (from, to) => latest.current.onReorder(arrayMove(latest.current.items, from, to)),
      onRemove: (index) => latest.current.onRemove?.(latest.current.items[index] as T, index),
      onTransfer: ({ from, to, fromIndex, index }) => {
        const handler = latest.current.onTransfer;
        if (!handler) return false;
        handler({
          item: latest.current.items[fromIndex] as T,
          from: from.id,
          to: to.id,
          fromIndex,
          index,
        });
        return true;
      },
    });
  });

  return (
    <ul
      ref={ref}
      id={listId}
      {...sortableAttributes({ layout, autoScroll })}
      data-ok-group={group || undefined}
      data-ok-accept={accept === undefined ? undefined : [accept].flat().join(" ")}
      data-ok-runtime="off"
      {...props}
    >
      {items.map((item, index) => {
        const label = getItemLabel ? getItemLabel(item, index) : `Item ${index + 1}`;
        const disabled = isItemDisabled?.(item, index) ?? false;
        return (
          <li
            key={getKey(item)}
            data-ok-sortable-item=""
            data-ok-disabled={disabled ? "" : undefined}
          >
            {renderItem(item, index)}
            <div data-ok-sortable-actions="">
              {onRemove && (
                <button
                  type="button"
                  {...iconButtonAttributes({ size: "sm" })}
                  data-ok-sortable-remove=""
                  aria-label={`Remove ${label}`}
                >
                  <RemoveIcon />
                </button>
              )}
              <button
                type="button"
                {...iconButtonAttributes({ size: "sm" })}
                data-ok-sortable-handle=""
                aria-label={`Reorder ${label}`}
                aria-pressed="false"
                disabled={disabled || undefined}
              >
                <HandleIcon />
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Sortable — spec: specs/components/sortable.md. A controlled list reordered by dragging the
 * handle, by keyboard (Space, arrows, Escape) or by two taps. Name it with `aria-label`.
 */
export const Sortable = forwardRef(SortableInner) as <T>(
  props: SortableProps<T> & { ref?: Ref<HTMLUListElement> },
) => ReturnType<typeof SortableInner>;

export { arrayMove, moveBetweenLists };
