"use client";

import {
  createToastApi,
  createToasterHotkey,
  createToastStore,
  createToastSwipe,
  createToastTimer,
  isToastButton,
  type SwipeDirection,
  TOASTER_HOTKEY,
  type Toast,
  type ToastApi,
  type ToastButton,
  type ToasterOffset,
  type ToastPosition,
  type ToastStore,
  type ToastTimer,
  toastDuration,
  toasterAttributes,
  toasterStyle,
  toastPositions,
  toastSwipeDirections,
} from "@owlky/core";
import {
  type CSSProperties,
  type HTMLAttributes,
  type MouseEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { CircularProgress } from "../circular-progress/circular-progress.js";

/** The page's toast queue (module-scoped, ADR-0007). `<Toaster>` shows it. */
export const toastStore: ToastStore<ReactNode> = createToastStore<ReactNode>();

/**
 * Shows a toast: `toast("Saved")`, `toast.success(…)`, `toast.info`, `toast.warning`,
 * `toast.error`, `toast.loading`, `toast.promise(promise, { loading, success, error })`,
 * `toast.custom(node)`, `toast.dismiss(id?)`. Returns the toast's id.
 */
export const toast: ToastApi<ReactNode> = createToastApi(toastStore);

const path = (d: string) => <path d={d} fill="currentColor" />;

/** Decorative type icons (filled, 24px). */
export const TOAST_ICONS: Record<"info" | "success" | "warning" | "error", ReactNode> = {
  info: (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      {path("M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20m1 15h-2v-6h2zm0-8h-2V7h2z")}
    </svg>
  ),
  success: (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      {path(
        "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20m-1.4 14.2-4.3-4.3 1.4-1.4 2.9 2.9 6-6 1.4 1.4z",
      )}
    </svg>
  ),
  warning: (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      {path("M12 2.5 1.5 21h21zM13 18h-2v-2h2zm0-4h-2V9h2z")}
    </svg>
  ),
  error: (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      {path("M15.7 2H8.3L3 7.3v7.4L8.3 20h7.4l5.3-5.3V7.3zM13 16h-2v-2h2zm0-4h-2V7h2z")}
    </svg>
  ),
};

const CLOSE_ICON = (
  <svg aria-hidden="true" viewBox="0 0 24 24">
    <path
      d="M18 6 6 18M6 6l12 12"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="2"
    />
  </svg>
);

/** Defaults for every toast of a toaster (Sonner `toastOptions`); a toast's own options win. */
export interface ToasterToastOptions {
  /** Milliseconds a toast stays. */
  duration?: number | undefined;
  /** Shows the close button. */
  closeButton?: boolean | undefined;
  /** Reverses the colors. */
  invert?: boolean | undefined;
  /** Colors typed toasts with their status color. */
  richColors?: boolean | undefined;
  /** `false`: no close button, Escape and swipes are ignored. */
  dismissible?: boolean | undefined;
}

/** Replacements for the toaster's icons (Sonner `icons`). */
export type ToasterIcons = Partial<
  Record<"info" | "success" | "warning" | "error" | "loading" | "close", ReactNode>
>;

/**
 * The toasts of a store, kept up to date (Sonner `useSonner()`): `{ toasts }`, newest first.
 */
export function useSonner(store: ToastStore<ReactNode> = toastStore): {
  toasts: readonly Toast<ReactNode>[];
} {
  const toasts = useSyncExternalStore(
    store.subscribe,
    () => store.toasts,
    () => store.toasts,
  );
  return { toasts };
}

export interface ToasterProps extends HTMLAttributes<HTMLElement> {
  /** Default `"top-right"`. */
  position?: ToastPosition | undefined;
  /** Milliseconds a toast stays (paused while the toaster is hovered or focused). Default 4000. */
  duration?: number | undefined;
  /** Toasts shown at once. Default 3. */
  visibleToasts?: number | undefined;
  /** Every toast shows a close button. Default: shown while toasts can be swiped away; `false` hides it. */
  closeButton?: boolean | undefined;
  /** `false` stacks the toasts and expands them on hover, focus or the hotkey. Default `true`. */
  expand?: boolean | undefined;
  /** Typed toasts take their status color. */
  richColors?: boolean | undefined;
  /** Reverses the toasts' colors (dark on light pages). */
  invert?: boolean | undefined;
  /** Keys that expand the toaster and move the focus to it. Default `["altKey", "KeyT"]`; `[]` turns it off. */
  hotkey?: readonly string[] | undefined;
  /** Distance from the viewport's edges: px, a CSS length or one per side. Default 16px. */
  offset?: ToasterOffset | undefined;
  /** `offset` on screens under 600px wide. Default 16px. */
  mobileOffset?: ToasterOffset | undefined;
  /** Space between expanded toasts, in px. Default 12. */
  gap?: number | undefined;
  /** Directions a toast can be swiped away in. Default: toward the toaster's edges; `[]` turns swiping off. */
  swipeDirections?: readonly SwipeDirection[] | undefined;
  /** Defaults for every toast. */
  toastOptions?: ToasterToastOptions | undefined;
  /** Replaces the type icons and the close icon. */
  icons?: ToasterIcons | undefined;
  /** Names the toaster: it shows the toasts whose `toasterId` is this id (and is the element's `id`). */
  id?: string | undefined;
  /** Another store than the page's `toastStore` (tests, separate queues). */
  store?: ToastStore<ReactNode> | undefined;
}

/**
 * Snackbar toaster — spec: specs/components/snackbar.md. A fixed `section` with a polite live
 * region; render it once per page and call `toast()` anywhere.
 */
export function Toaster({
  position,
  duration,
  visibleToasts,
  closeButton,
  expand,
  richColors,
  invert,
  hotkey = TOASTER_HOTKEY,
  offset,
  mobileOffset,
  gap,
  swipeDirections,
  toastOptions,
  icons,
  id,
  store = toastStore,
  style,
  "aria-label": label = "Notifications",
  ...props
}: ToasterProps) {
  const { toasts } = useSonner(store);
  const [paused, setPaused] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const keys = useRef(hotkey);
  keys.current = hotkey;
  useEffect(() => {
    const created = createToasterHotkey(ref.current as HTMLElement, { hotkey: () => keys.current });
    return () => created.destroy();
  }, []);
  const home = toastPositions.includes(position as ToastPosition)
    ? (position as ToastPosition)
    : "top-right";
  const mine = toasts.filter((item) => item.toasterId === id);
  const max = Math.max(1, visibleToasts ?? 3);
  // One list per position: the toaster's own first, then the toasts that asked for another one.
  const lists = [home, ...toastPositions.filter((p) => p !== home)]
    .map((at) => ({
      at,
      items: mine.filter((item) => (item.position ?? home) === at).slice(0, max),
    }))
    .filter((list) => list.at === home || list.items.length > 0);
  const single = (value: unknown) =>
    typeof value === "number" || typeof value === "string" ? value : undefined;
  const pause = () => setPaused(true);
  const resume = (event: { currentTarget: Element; relatedTarget: EventTarget | null }) => {
    if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget))
      return;
    setPaused(false);
  };
  return (
    <section
      ref={ref}
      {...toasterAttributes({
        position,
        duration,
        visibleToasts,
        closeButton,
        expand,
        richColors,
        invert,
        offset: single(offset),
        mobileOffset: single(mobileOffset),
        gap,
      })}
      data-ok-runtime="off"
      id={id}
      aria-label={label}
      style={{ ...(toasterStyle({ offset, mobileOffset, gap }) as CSSProperties), ...style }}
      onPointerEnter={pause}
      onPointerLeave={(event) => {
        if (!event.currentTarget.contains(document.activeElement)) setPaused(false);
      }}
      onFocus={pause}
      onBlur={resume}
      {...props}
    >
      {lists.map((list) => (
        <ol
          key={list.at}
          data-ok-toaster-list=""
          {...(list.at === home ? {} : { "data-ok-position": list.at })}
          aria-live="polite"
        >
          {list.items.map((item) => (
            <ToastItem
              key={item.id}
              toast={{ ...toastOptions, ...item }}
              store={store}
              duration={toastDuration(
                item.duration ?? toastOptions?.duration,
                toastDuration(duration),
              )}
              paused={paused}
              closeButton={closeButton}
              directions={swipeDirections ?? toastSwipeDirections(list.at)}
              icons={icons}
            />
          ))}
        </ol>
      ))}
    </section>
  );
}

function ToastItem({
  toast: item,
  store,
  duration,
  paused,
  closeButton,
  directions,
  icons,
}: {
  toast: Toast<ReactNode>;
  store: ToastStore<ReactNode>;
  duration: number;
  paused: boolean;
  closeButton: boolean | undefined;
  directions: readonly SwipeDirection[];
  icons: ToasterIcons | undefined;
}) {
  const element = useRef<HTMLLIElement>(null);
  const latest = useRef({ directions, item });
  latest.current = { directions, item };
  // biome-ignore lint/correctness/useExhaustiveDependencies: one swipe controller per toast; it reads the latest values.
  useEffect(() => {
    const swipe = createToastSwipe(element.current as HTMLLIElement, {
      directions: () => latest.current.directions,
      enabled: () => latest.current.item.dismissible !== false,
      onDismiss: () => store.dismiss(latest.current.item.id),
    });
    return () => swipe.destroy();
  }, [store]);
  const timer = useRef<ToastTimer | null>(null);
  useEffect(() => {
    const created = createToastTimer(duration, () => store.expire(item.id));
    timer.current = created;
    return () => created.stop();
  }, [store, item.id, duration]);
  useEffect(() => {
    if (paused) timer.current?.pause();
    else timer.current?.resume();
  }, [paused]);
  // A toast updated in place (promise settled, same id) starts its time again.
  const type = item.type;
  const first = useRef(true);
  // biome-ignore lint/correctness/useExhaustiveDependencies: restart when the toast's content changes.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    timer.current?.restart(duration);
  }, [type, item.title, duration]);

  const dismiss = () => store.dismiss(item.id);
  const button = (kind: "action" | "cancel") => {
    const value = item[kind];
    if (value == null) return null;
    if (!isToastButton<ReactNode>(value))
      return <div data-ok-toast-actions="">{value as ReactNode}</div>;
    const data: ToastButton<ReactNode> = value;
    const onClick = (event: MouseEvent<HTMLButtonElement>) => {
      data.onClick?.(event.nativeEvent);
      if (!event.defaultPrevented && !event.nativeEvent.defaultPrevented) dismiss();
    };
    return (
      <button
        type="button"
        {...(kind === "action" ? { "data-ok-toast-action": "" } : { "data-ok-toast-cancel": "" })}
        onClick={onClick}
      >
        {data.label}
      </button>
    );
  };
  const icon =
    item.icon ??
    (type === "loading"
      ? (icons?.loading ?? <CircularProgress color="inherit" />)
      : type === "default"
        ? null
        : (icons?.[type] ?? TOAST_ICONS[type]));
  // Like the reference: a close button when the toaster (or the toast) asks for one, except on
  // toasts with actions (they close themselves) and custom content.
  const showClose =
    // A swipeable toast always gets one unless asked not to: the single-pointer path (WCAG 2.5.7).
    (item.closeButton ?? closeButton ?? directions.length > 0) === true &&
    item.dismissible !== false &&
    item.type !== "loading" &&
    item.action == null &&
    item.custom === undefined;

  return (
    <li
      data-ok-toast=""
      ref={element}
      data-ok-type={type}
      {...(item.custom !== undefined ? { "data-ok-custom": "" } : {})}
      {...(item.position !== undefined ? { "data-ok-position": item.position } : {})}
      {...(item.invert !== undefined ? { "data-ok-invert": item.invert ? "" : "false" } : {})}
      {...(item.richColors !== undefined
        ? { "data-ok-rich-colors": item.richColors ? "" : "false" }
        : {})}
      onKeyDown={(event) => {
        if (event.key === "Escape" && item.dismissible !== false) dismiss();
      }}
    >
      {item.custom !== undefined ? (
        item.custom
      ) : (
        <>
          {icon != null && (
            <span data-ok-toast-icon="" aria-hidden="true">
              {icon}
            </span>
          )}
          <div data-ok-toast-content="">
            <div data-ok-toast-title="">{item.title}</div>
            {item.description != null && <div data-ok-toast-description="">{item.description}</div>}
          </div>
          {button("cancel")}
          {button("action")}
        </>
      )}
      {showClose && (
        <button type="button" data-ok-toast-close="" aria-label="Close" onClick={dismiss}>
          {icons?.close ?? CLOSE_ICON}
        </button>
      )}
    </li>
  );
}
