/*
 * Snackbar / toast queue (the reference's Sonner API), framework-free. A store holds the toasts;
 * `createToastApi()` builds the `toast()` function (`toast.success`, `toast.promise`, …) on top of
 * it. Content is generic: React passes nodes, HTML passes strings. Module- or instance-scoped
 * (ADR-0007): each implementation owns its store.
 */

export const toastTypes = ["default", "info", "success", "warning", "error", "loading"] as const;
export type ToastType = (typeof toastTypes)[number];
export const toastPositions = [
  "top-left",
  "top-center",
  "top-right",
  "bottom-left",
  "bottom-center",
  "bottom-right",
] as const;
export type ToastPosition = (typeof toastPositions)[number];

export type ToastId = string | number;

export interface ToastButton<C> {
  label: C;
  onClick?: ((event: Event) => void) | undefined;
}

/** `true` for a `{ label, onClick }` button description (not your own content). */
export const isToastButton = <C>(value: unknown): value is ToastButton<C> =>
  typeof value === "object" &&
  value !== null &&
  "label" in value &&
  !("$$typeof" in value) &&
  !("nodeType" in value);

export interface ToastOptions<C> {
  /** Reuse an id to update a toast in place. */
  id?: ToastId | undefined;
  description?: C | undefined;
  /**
   * A button after the text (clicking it closes the toast unless the handler prevents default),
   * or your own content in its place, such as several buttons.
   */
  action?: ToastButton<C> | C | undefined;
  /** A secondary button that closes the toast. */
  cancel?: ToastButton<C> | undefined;
  /** Milliseconds before it closes; `Infinity` keeps it. Default: the toaster's (4000). */
  duration?: number | undefined;
  /** Replaces the type's icon. */
  icon?: C | undefined;
  /** `false` hides the close button and ignores Escape for this toast. Default `true`. */
  dismissible?: boolean | undefined;
  onDismiss?: ((toast: Toast<C>) => void) | undefined;
  onAutoClose?: ((toast: Toast<C>) => void) | undefined;
}

export interface Toast<C> extends Omit<ToastOptions<C>, "id"> {
  id: ToastId;
  type: ToastType;
  title?: C | undefined;
  /** Rendered instead of the standard layout (`toast.custom`). */
  custom?: C | undefined;
}

export interface ToastStore<C> {
  readonly toasts: readonly Toast<C>[];
  /** Adds a toast, or replaces the one with the same id. */
  set(toast: Toast<C>): ToastId;
  /** Removes one toast, or every toast without an id. Calls `onDismiss`. */
  dismiss(id?: ToastId): void;
  /** Removes a toast whose time ran out. Calls `onAutoClose`. */
  expire(id: ToastId): void;
  subscribe(listener: (toasts: readonly Toast<C>[]) => void): () => void;
}

export function createToastStore<C>(): ToastStore<C> {
  let toasts: Toast<C>[] = [];
  const listeners = new Set<(toasts: readonly Toast<C>[]) => void>();
  const emit = () => {
    for (const listener of [...listeners]) listener(toasts);
  };
  const remove = (id: ToastId, callback: "onDismiss" | "onAutoClose") => {
    const toast = toasts.find((t) => t.id === id);
    if (!toast) return;
    toasts = toasts.filter((t) => t !== toast);
    toast[callback]?.(toast);
    emit();
  };
  return {
    get toasts() {
      return toasts;
    },
    set(toast) {
      const index = toasts.findIndex((t) => t.id === toast.id);
      toasts =
        index === -1
          ? [toast, ...toasts]
          : toasts.map((t, i) => (i === index ? { ...t, ...toast } : t));
      emit();
      return toast.id;
    },
    dismiss(id) {
      if (id === undefined) {
        for (const toast of [...toasts]) remove(toast.id, "onDismiss");
        return;
      }
      remove(id, "onDismiss");
    },
    expire(id) {
      remove(id, "onAutoClose");
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

export interface PromiseMessages<C, T> {
  loading: C;
  success: C | ((value: T) => C);
  error: C | ((reason: unknown) => C);
  description?: C | undefined;
}

export interface ToastApi<C> {
  (title: C, options?: ToastOptions<C>): ToastId;
  message(title: C, options?: ToastOptions<C>): ToastId;
  info(title: C, options?: ToastOptions<C>): ToastId;
  success(title: C, options?: ToastOptions<C>): ToastId;
  warning(title: C, options?: ToastOptions<C>): ToastId;
  error(title: C, options?: ToastOptions<C>): ToastId;
  loading(title: C, options?: ToastOptions<C>): ToastId;
  /** Shows `loading` until the promise settles, then `success` or `error` in the same toast. */
  promise<T>(promise: Promise<T> | (() => Promise<T>), messages: PromiseMessages<C, T>): ToastId;
  /** Renders your own content in a toast frame. */
  custom(content: C, options?: ToastOptions<C>): ToastId;
  /** Closes one toast, or all of them. */
  dismiss(id?: ToastId): void;
}

/** The `toast()` function for a store; ids are counters unless you pass one. */
export function createToastApi<C>(store: ToastStore<C>): ToastApi<C> {
  let counter = 0;
  const show = (type: ToastType, title: C | undefined, options: ToastOptions<C> = {}) => {
    const { id = ++counter, ...rest } = options;
    // A loading toast stays until it is updated or dismissed.
    const duration =
      type === "loading" ? (rest.duration ?? Number.POSITIVE_INFINITY) : rest.duration;
    return store.set({ ...rest, id, type, title, duration });
  };
  const api = ((title: C, options?: ToastOptions<C>) =>
    show("default", title, options)) as ToastApi<C>;
  api.message = (title, options) => show("default", title, options);
  api.info = (title, options) => show("info", title, options);
  api.success = (title, options) => show("success", title, options);
  api.warning = (title, options) => show("warning", title, options);
  api.error = (title, options) => show("error", title, options);
  api.loading = (title, options) => show("loading", title, options);
  api.custom = (content, options = {}) => {
    const { id = ++counter, ...rest } = options;
    return store.set({ ...rest, id, type: "default", custom: content });
  };
  api.promise = (input, messages) => {
    const id = show("loading", messages.loading, { description: messages.description });
    const settle = (type: "success" | "error", message: unknown, value: unknown) => {
      const title =
        typeof message === "function" ? (message as (v: unknown) => C)(value) : (message as C);
      // Updated in place (same id): a fresh duration starts for the settled toast.
      store.set({ id, type, title, duration: undefined, description: undefined });
    };
    Promise.resolve()
      .then(() => (typeof input === "function" ? input() : input))
      .then(
        (value) => settle("success", messages.success, value),
        (reason) => settle("error", messages.error, reason),
      );
    return id;
  };
  api.dismiss = (id) => store.dismiss(id);
  return api;
}

export interface ToastTimer {
  pause(): void;
  resume(): void;
  /** Starts over with a new duration (a toast updated in place). */
  restart(duration: number): void;
  stop(): void;
}

/** Auto-close countdown that pauses while the toaster is hovered or focused (Sonner). */
export function createToastTimer(duration: number, onExpire: () => void): ToastTimer {
  let remaining = duration;
  let started = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let paused = false;
  const run = () => {
    if (!Number.isFinite(remaining)) return;
    started = Date.now();
    timer = setTimeout(onExpire, Math.max(0, remaining));
  };
  const halt = () => {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
  };
  run();
  return {
    pause() {
      if (paused) return;
      paused = true;
      if (timer === undefined) return;
      halt();
      remaining -= Date.now() - started;
    },
    resume() {
      if (!paused) return;
      paused = false;
      run();
    },
    restart(next) {
      halt();
      remaining = next;
      if (!paused) run();
    },
    stop() {
      halt();
    },
  };
}

/** A valid duration in ms (finite ≥ 0 or Infinity), else `fallback`. */
export const toastDuration = (value: unknown, fallback = 4000): number =>
  typeof value === "number" &&
  (value === Number.POSITIVE_INFINITY || (Number.isFinite(value) && value >= 0))
    ? value
    : fallback;
