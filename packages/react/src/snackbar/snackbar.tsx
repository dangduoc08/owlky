"use client";

import {
  createToastApi,
  createToastStore,
  createToastTimer,
  isToastButton,
  type Toast,
  type ToastApi,
  type ToastButton,
  type ToastPosition,
  type ToastStore,
  type ToastTimer,
  toastDuration,
  toasterAttributes,
} from "@owlky/core";
import {
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

export interface ToasterProps extends HTMLAttributes<HTMLElement> {
  /** Default `"top-right"`. */
  position?: ToastPosition | undefined;
  /** Milliseconds a toast stays (paused while the toaster is hovered or focused). Default 4000. */
  duration?: number | undefined;
  /** Toasts shown at once. Default 3. */
  visibleToasts?: number | undefined;
  /** Every toast shows a close button. */
  closeButton?: boolean | undefined;
  /** Another store than the page's `toastStore` (tests, several toasters). */
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
  store = toastStore,
  "aria-label": label = "Notifications",
  ...props
}: ToasterProps) {
  const toasts = useSyncExternalStore(
    store.subscribe,
    () => store.toasts,
    () => store.toasts,
  );
  const [paused, setPaused] = useState(false);
  const visible = toasts.slice(0, Math.max(1, visibleToasts ?? 3));
  const pause = () => setPaused(true);
  const resume = (event: { currentTarget: Element; relatedTarget: EventTarget | null }) => {
    if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget))
      return;
    setPaused(false);
  };
  return (
    <section
      {...toasterAttributes({ position, duration, visibleToasts, closeButton })}
      data-ok-runtime="off"
      aria-label={label}
      onPointerEnter={pause}
      onPointerLeave={(event) => {
        if (!event.currentTarget.contains(document.activeElement)) setPaused(false);
      }}
      onFocus={pause}
      onBlur={resume}
      {...props}
    >
      <ol data-ok-toaster-list="" aria-live="polite">
        {visible.map((item) => (
          <ToastItem
            key={item.id}
            toast={item}
            store={store}
            duration={toastDuration(item.duration, toastDuration(duration))}
            paused={paused}
            closeButton={closeButton}
          />
        ))}
      </ol>
    </section>
  );
}

function ToastItem({
  toast: item,
  store,
  duration,
  paused,
  closeButton,
}: {
  toast: Toast<ReactNode>;
  store: ToastStore<ReactNode>;
  duration: number;
  paused: boolean;
  closeButton: boolean | undefined;
}) {
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
    (type === "loading" ? (
      <CircularProgress color="inherit" />
    ) : type === "default" ? null : (
      TOAST_ICONS[type]
    ));
  // Like the reference: a close button when the toaster asks for one, except on toasts with
  // actions (they close themselves) and custom content.
  const showClose =
    closeButton === true &&
    item.dismissible !== false &&
    item.type !== "loading" &&
    item.action == null &&
    item.custom === undefined;

  return (
    <li
      data-ok-toast=""
      data-ok-type={type}
      {...(item.custom !== undefined ? { "data-ok-custom": "" } : {})}
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
          {CLOSE_ICON}
        </button>
      )}
    </li>
  );
}
