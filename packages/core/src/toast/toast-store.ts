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
  /** Shows this toast at another position than the toaster's. */
  position?: ToastPosition | undefined;
  /** Shows or hides the close button on this toast. Default: the toaster's `closeButton`. */
  closeButton?: boolean | undefined;
  /** Reverses this toast's colors (dark on light pages). Default: the toaster's `invert`. */
  invert?: boolean | undefined;
  /** Colors this typed toast with its status color. Default: the toaster's `richColors`. */
  richColors?: boolean | undefined;
  /** The `id` of the toaster that shows this toast. Default: the toaster without an `id`. */
  toasterId?: string | undefined;
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
  /** Every toast shown since the page loaded (dismissed ones too), oldest first, last version. */
  readonly history: readonly Toast<C>[];
  /** Adds a toast, or replaces the one with the same id. */
  set(toast: Toast<C>): ToastId;
  /** Removes one toast, or every toast without an id. Calls `onDismiss`. */
  dismiss(id?: ToastId): void;
  /** Removes a toast whose time ran out. Calls `onAutoClose`. */
  expire(id: ToastId): void;
  subscribe(listener: (toasts: readonly Toast<C>[]) => void): () => void;
}

/** A toast id as a primitive (`toast.promise` returns a boxed id that also has `unwrap()`). */
const plainId = (id: ToastId): ToastId =>
  typeof id === "object" && id !== null ? ((id as object).valueOf() as ToastId) : id;

export function createToastStore<C>(): ToastStore<C> {
  let toasts: Toast<C>[] = [];
  let history: Toast<C>[] = [];
  const listeners = new Set<(toasts: readonly Toast<C>[]) => void>();
  const emit = () => {
    for (const listener of [...listeners]) listener(toasts);
  };
  const remove = (given: ToastId, callback: "onDismiss" | "onAutoClose") => {
    const id = plainId(given);
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
    get history() {
      return history;
    },
    set(given) {
      const toast = { ...given, id: plainId(given.id) };
      const index = toasts.findIndex((t) => t.id === toast.id);
      toasts =
        index === -1
          ? [toast, ...toasts]
          : toasts.map((t, i) => (i === index ? { ...t, ...toast } : t));
      const current = toasts.find((t) => t.id === toast.id) as Toast<C>;
      const past = history.findIndex((t) => t.id === toast.id);
      history =
        past === -1 ? [...history, current] : history.map((t, i) => (i === past ? current : t));
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

export interface PromiseMessages<C, T> extends Omit<ToastOptions<C>, "description"> {
  loading: C;
  success: C | ((value: T) => C);
  error: C | ((reason: unknown) => C);
  description?: C | undefined;
  /** Runs once the promise settled, after the toast shows the result. */
  finally?: (() => void | Promise<void>) | undefined;
}

/** What `toast.promise` returns: the toast's id, with `unwrap()` for the promise's own result. */
export type PromiseToastId<T> = ToastId & {
  /** The original promise's result (rejects like it). */
  unwrap(): Promise<T>;
};

export interface ToastApi<C> {
  (title: C, options?: ToastOptions<C>): ToastId;
  message(title: C, options?: ToastOptions<C>): ToastId;
  info(title: C, options?: ToastOptions<C>): ToastId;
  success(title: C, options?: ToastOptions<C>): ToastId;
  warning(title: C, options?: ToastOptions<C>): ToastId;
  error(title: C, options?: ToastOptions<C>): ToastId;
  loading(title: C, options?: ToastOptions<C>): ToastId;
  /**
   * Shows `loading` until the promise settles, then `success` or `error` in the same toast.
   * Returns the id with `unwrap()`.
   */
  promise<T>(
    promise: Promise<T> | (() => Promise<T>),
    messages: PromiseMessages<C, T>,
  ): PromiseToastId<T>;
  /** Renders your own content in a toast frame. */
  custom(content: C, options?: ToastOptions<C>): ToastId;
  /** Closes one toast, or all of them. */
  dismiss(id?: ToastId): void;
  /** Every toast shown so far, dismissed ones too (oldest first). */
  getHistory(): readonly Toast<C>[];
  /** The toasts shown now (newest first). */
  getToasts(): readonly Toast<C>[];
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
  api.promise = <T>(input: Promise<T> | (() => Promise<T>), messages: PromiseMessages<C, T>) => {
    const { loading, success, error, finally: after, duration, ...options } = messages;
    const id = show("loading", loading, options);
    const settle = (type: "success" | "error", message: unknown, value: unknown) => {
      const title =
        typeof message === "function" ? (message as (v: unknown) => C)(value) : (message as C);
      // Updated in place (same id): a fresh duration starts for the settled toast.
      store.set({ id, type, title, duration, description: undefined });
    };
    const result = Promise.resolve().then(() => (typeof input === "function" ? input() : input));
    result
      .then(
        (value) => settle("success", success, value),
        (reason) => settle("error", error, reason),
      )
      .then(() => after?.());
    // A boxed id: it still works as an id (the store unboxes it), and carries `unwrap()`.
    return Object.assign(Object(id) as object, { unwrap: () => result }) as PromiseToastId<T>;
  };
  api.dismiss = (id) => store.dismiss(id);
  api.getHistory = () => store.history;
  api.getToasts = () => store.toasts;
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
