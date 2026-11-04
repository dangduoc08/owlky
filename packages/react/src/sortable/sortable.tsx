"use client";

import {
  arrayMove,
  createSortableController,
  iconButtonAttributes,
  type SortableController,
  type SortableLayout,
  type SortableMessages,
  sortableAttributes,
} from "@owlky/core";
import {
  type ComponentPropsWithoutRef,
  forwardRef,
  type Key,
  type ReactNode,
  type Ref,
  useEffect,
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

export interface SortableProps<T> extends Omit<ComponentPropsWithoutRef<"ul">, "children"> {
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
    ...props
  }: SortableProps<T>,
  forwardedRef: Ref<HTMLUListElement>,
) {
  const listRef = useRef<HTMLUListElement>(null);
  const ref = useMergedRefs(listRef, forwardedRef);
  const controllerRef = useRef<SortableController | null>(null);
  // The controller outlives renders: it reads the latest items and callbacks through refs.
  const latest = useRef({ items, onReorder, onRemove });
  latest.current = { items, onReorder, onRemove };

  useEffect(() => {
    const controller = createSortableController(listRef.current as HTMLUListElement);
    controllerRef.current = controller;
    return () => controller.destroy();
  }, []);

  useEffect(() => {
    controllerRef.current?.setOptions({
      messages,
      onMove: (from, to) => latest.current.onReorder(arrayMove(latest.current.items, from, to)),
      onRemove: (index) => latest.current.onRemove?.(latest.current.items[index] as T, index),
    });
  });

  return (
    <ul ref={ref} {...sortableAttributes({ layout })} data-ok-runtime="off" {...props}>
      {items.map((item, index) => {
        const label = getItemLabel ? getItemLabel(item, index) : `Item ${index + 1}`;
        return (
          <li key={getKey(item)} data-ok-sortable-item="">
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

export { arrayMove };
