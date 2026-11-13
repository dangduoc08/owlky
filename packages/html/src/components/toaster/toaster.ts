import {
  checkCircleLinear,
  closeLinear,
  createIcon,
  createToasterHotkey,
  createToastSwipe,
  createToastTimer,
  dangerCircleLinear,
  dangerTriangleLinear,
  type IconData,
  infoCircleLinear,
  parseHotkey,
  parseSwipeDirections,
  readNumber,
  readStyle,
  type ToastPosition,
  type ToastTimer,
  type ToastType,
  toastDuration,
  toasterOptions,
  toasterStyle,
  toastPositions,
  toastSwipeDirections,
  toastTypes,
} from "@owlky/core";
import { defineComponent } from "../../runtime/define.js";
import { syncCustomProperties } from "../../runtime/style.js";
import type { ComponentInstance, EventSpec } from "../../runtime/types.js";

export interface ToastShowOptions {
  /** Reuse an id to replace a toast in place. */
  id?: string | undefined;
  type?: ToastType | undefined;
  title: string;
  description?: string | undefined;
  /** Milliseconds; `Infinity` keeps it. Default: the toaster's `data-ok-duration` (4000). */
  duration?: number | undefined;
  action?: { label: string; onClick?: ((event: Event) => void) | undefined } | undefined;
  cancel?: { label: string; onClick?: ((event: Event) => void) | undefined } | undefined;
  /** `false`: no close button, Escape and swipes ignored. */
  dismissible?: boolean | undefined;
  /** Shows this toast at another position than the toaster's. */
  position?: ToastPosition | undefined;
  /** Shows or hides the close button. Default: the toaster's `data-ok-close-button`. */
  closeButton?: boolean | undefined;
  /** Reverses this toast's colors. Default: the toaster's `data-ok-invert`. */
  invert?: boolean | undefined;
  /** Colors this typed toast with its status color. Default: the toaster's `data-ok-rich-colors`. */
  richColors?: boolean | undefined;
}

/** Messages of `promise()`. */
export interface ToastPromiseMessages {
  loading: string;
  success: string;
  error: string;
  /** Shown under the loading title. */
  description?: string | undefined;
  /** Runs once the promise settled, after the toast shows the result. */
  finally?: (() => void) | undefined;
}

/** Events of this component (`ok:<name>:<event>` on the root). */
export interface ToasterEvents {
  /** After a toast showed. */
  show: EventSpec<{ toast: Element }>;
  /** After a toast was dismissed, with what dismissed it. */
  dismiss: EventSpec<{ toast: Element; reason: string }>;
  /** Before a toast's action or cancel button runs. Call `preventDefault()` to keep the toast. */
  action: EventSpec<{ toast: Element; kind: string }, true>;
}

export interface ToasterInstance extends ComponentInstance {
  /** Shows a toast built from text (never HTML). Returns its id. */
  show(options: ToastShowOptions): string;
  /** Shows a copy of a `<template>`'s toast (`li[data-ok-toast]`). Returns its id. */
  showTemplate(template: HTMLTemplateElement): string | null;
  /** Shows `loading` until the promise settles, then `success` or `error` in the same toast. */
  promise<T>(promise: Promise<T>, messages: ToastPromiseMessages): string;
  /** Closes one toast, or every toast. */
  dismiss(id?: string): void;
  /** The toasts shown now, newest first. */
  getToasts(): HTMLElement[];
  /** Every toast shown since the toaster started, dismissed ones too (oldest first). */
  getHistory(): HTMLElement[];
}

const ICONS: Record<"info" | "success" | "warning" | "error", IconData> = {
  info: infoCircleLinear,
  success: checkCircleLinear,
  warning: dangerTriangleLinear,
  error: dangerCircleLinear,
};

const SVG = "http://www.w3.org/2000/svg";
const { position, duration, visibleToasts, closeButton } = toasterOptions.options;

/** An indeterminate CircularProgress (same anatomy as circular-progress.css), inherit color. */
function spinner(): HTMLElement {
  const root = document.createElement("span");
  root.setAttribute("data-ok-circular-progress", "");
  root.setAttribute("data-ok-variant", "indeterminate");
  root.setAttribute("data-ok-color", "inherit");
  root.setAttribute("role", "progressbar");
  root.setAttribute("aria-label", "Loading");
  const graphic = document.createElementNS(SVG, "svg");
  graphic.setAttribute("data-ok-circular-progress-svg", "");
  graphic.setAttribute("viewBox", "22 22 44 44");
  graphic.setAttribute("aria-hidden", "true");
  const circle = document.createElementNS(SVG, "circle");
  circle.setAttribute("data-ok-circular-progress-circle", "");
  for (const [name, value] of [
    ["cx", "44"],
    ["cy", "44"],
    ["r", "20.2"],
    ["stroke-width", "3.6"],
  ])
    circle.setAttribute(name as string, value as string);
  graphic.append(circle);
  root.append(graphic);
  return root;
}

function closeButtonElement(): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.setAttribute("data-ok-toast-close", "");
  button.setAttribute("aria-label", "Close");
  button.append(createIcon(closeLinear));
  return button;
}

/** A toast element built with createElement / textContent only. */
function buildToast(options: ToastShowOptions, toasterClose: boolean): HTMLLIElement {
  const withClose = options.closeButton ?? toasterClose;
  const type = toastTypes.includes(options.type as ToastType)
    ? (options.type as ToastType)
    : "default";
  const li = document.createElement("li");
  li.setAttribute("data-ok-toast", "");
  li.setAttribute("data-ok-type", type);
  if (toastPositions.includes(options.position as ToastPosition))
    li.setAttribute("data-ok-position", options.position as string);
  for (const [key, attr] of [
    ["invert", "data-ok-invert"],
    ["richColors", "data-ok-rich-colors"],
  ] as const)
    if (options[key] !== undefined) li.setAttribute(attr, options[key] ? "" : "false");
  if (type !== "default") {
    const icon = document.createElement("span");
    icon.setAttribute("data-ok-toast-icon", "");
    icon.setAttribute("aria-hidden", "true");
    icon.append(type === "loading" ? spinner() : createIcon(ICONS[type]));
    li.append(icon);
  }
  const content = document.createElement("div");
  content.setAttribute("data-ok-toast-content", "");
  const title = document.createElement("div");
  title.setAttribute("data-ok-toast-title", "");
  title.textContent = options.title;
  content.append(title);
  if (options.description) {
    const description = document.createElement("div");
    description.setAttribute("data-ok-toast-description", "");
    description.textContent = options.description;
    content.append(description);
  }
  li.append(content);
  for (const kind of ["cancel", "action"] as const) {
    const data = options[kind];
    if (!data) continue;
    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute(`data-ok-toast-${kind}`, "");
    button.textContent = data.label;
    li.append(button);
  }
  if (withClose && options.dismissible !== false && !options.action)
    li.append(closeButtonElement());
  return li;
}

/**
 * Snackbar toaster — spec: specs/components/snackbar.md
 *
 * Markup:   <section data-ok-toaster data-ok-position="top-right" aria-label="Notifications">
 *             <ol data-ok-toaster-list aria-live="polite"></ol>
 *           </section>
 *           <template id="t1"><li data-ok-toast data-ok-type="success">…</li></template>
 *           <button data-ok-toast-open="t1">Show</button>
 * Triggers: [data-ok-toast-open="<template id>"] shows a copy of the template's toast in the first
 *           toaster of the page; with data-ok-toaster-position it moves the toaster first.
 *           A toast may carry data-ok-duration (ms; "Infinity" keeps it) and data-ok-then
 *           ("<template id>": replaces it when its time runs out — a loading toast, then the result).
 *           data-ok-toast-toaster="<toaster id>" on the trigger picks another toaster.
 * Toasts:   [data-ok-toast-close], [data-ok-toast-action], [data-ok-toast-cancel] and your own
 *           [data-ok-toast-dismiss] buttons close it; time
 *           pauses while the toaster is hovered or focused; Escape on a focused toast closes it;
 *           a swipe toward data-ok-swipe-directions (default: the toaster's edges) closes it.
 *           A toast's data-ok-position puts it in a list of its own at that position.
 * Toaster:  data-ok-expand="false" stacks the toasts (expanded on hover, focus or the hotkey,
 *           data-ok-hotkey, default "altKey+KeyT"); data-ok-offset / data-ok-mobile-offset /
 *           data-ok-gap become private properties (CSSOM).
 * Events:   ok:toaster:show (detail.toast), ok:toaster:dismiss (detail.toast, detail.reason:
 *           "close" | "dismiss" | "action" | "cancel" | "timeout" | "escape" | "api" | "overflow");
 *           ok:toaster:action (cancelable, detail.toast, detail.kind) before an action closes it.
 */
export const toaster = defineComponent<ToasterInstance, ToasterEvents>({
  name: "toaster",
  selector: "[data-ok-toaster]",

  setup(element, { emit, signal }) {
    let list = element.querySelector<HTMLOListElement>(":scope > [data-ok-toaster-list]");
    if (!list) {
      list = document.createElement("ol");
      list.setAttribute("data-ok-toaster-list", "");
      list.setAttribute("aria-live", "polite");
      element.append(list);
    }
    const home = list;
    const timers = new Map<Element, ToastTimer>();
    const handlers = new Map<Element, ToastShowOptions>();
    const swipes = new Map<Element, { destroy(): void }>();
    const history: HTMLElement[] = [];
    const lists = () => [
      ...element.querySelectorAll<HTMLOListElement>(":scope > [data-ok-toaster-list]"),
    ];
    const toasts = () => lists().flatMap((l) => [...l.children] as HTMLElement[]);
    /** The list for a toast: the toaster's own, or one per other position (made on demand). */
    const listFor = (toast: Element) => {
      const at = toast.getAttribute("data-ok-position");
      if (!toastPositions.includes(at as ToastPosition) || at === readStyle(element, position))
        return home;
      const found = lists().find((l) => l.getAttribute("data-ok-position") === at);
      if (found) return found;
      const made = document.createElement("ol");
      made.setAttribute("data-ok-toaster-list", "");
      made.setAttribute("data-ok-position", at as string);
      made.setAttribute("aria-live", "polite");
      element.append(made);
      return made;
    };
    const directions = (toast: Element) =>
      parseSwipeDirections(element.getAttribute("data-ok-swipe-directions")) ??
      toastSwipeDirections(
        (toastPositions.includes(toast.getAttribute("data-ok-position") as ToastPosition)
          ? toast.getAttribute("data-ok-position")
          : readStyle(element, position)) as ToastPosition,
      );
    const swipeable = (toast: HTMLElement) => {
      swipes.get(toast)?.destroy();
      swipes.set(
        toast,
        createToastSwipe(toast, {
          directions: () => directions(toast),
          enabled: () => !toast.hasAttribute("data-ok-persistent"),
          onDismiss: () => remove(toast, "swipe"),
        }),
      );
    };
    const hotkey = createToasterHotkey(element, {
      hotkey: () => parseHotkey(element.getAttribute("data-ok-hotkey") ?? undefined),
    });
    let written: string[] = [];
    const drawStyle = () => {
      written = syncCustomProperties(
        element,
        toasterStyle({
          offset: element.getAttribute(toasterOptions.options.offset.attr) ?? undefined,
          mobileOffset: element.getAttribute(toasterOptions.options.mobileOffset.attr) ?? undefined,
          gap: element.getAttribute(toasterOptions.options.gap.attr) ?? undefined,
        }),
        written,
      );
    };
    drawStyle();
    const styleObserver = new MutationObserver(drawStyle);
    styleObserver.observe(element, {
      attributes: true,
      attributeFilter: ["offset", "mobileOffset", "gap"].map(
        (key) => toasterOptions.options[key as "gap"].attr,
      ),
    });
    let counter = 0;
    let paused = false;

    const remove = (toast: Element, reason: string) => {
      timers.get(toast)?.stop();
      timers.delete(toast);
      handlers.delete(toast);
      swipes.get(toast)?.destroy();
      swipes.delete(toast);
      if (!toast.isConnected) return;
      toast.remove();
      emit("dismiss", { toast, reason });
    };

    const startTimer = (toast: Element, ms: number) => {
      const timer = createToastTimer(ms, () => {
        const next = toast.getAttribute("data-ok-then");
        const template = next ? (element.getRootNode() as Document).getElementById(next) : null;
        if (template instanceof HTMLTemplateElement) {
          const replacement = cloneTemplate(template);
          if (replacement) {
            replacement.setAttribute(
              "data-ok-toast-id",
              toast.getAttribute("data-ok-toast-id") as string,
            );
            timers.get(toast)?.stop();
            timers.delete(toast);
            swipes.get(toast)?.destroy();
            swipes.delete(toast);
            toast.replaceWith(replacement);
            history.push(replacement);
            swipeable(replacement);
            track(replacement);
            return;
          }
        }
        remove(toast, "timeout");
      });
      if (paused) timer.pause();
      timers.set(toast, timer);
    };

    const toasterDuration = () => toastDuration(readNumber(element, duration));

    const track = (toast: Element) => {
      const attr = toast.getAttribute("data-ok-duration");
      const ms = toastDuration(
        attr === "Infinity" ? Number.POSITIVE_INFINITY : attr === null ? undefined : Number(attr),
        toast.getAttribute("data-ok-type") === "loading"
          ? Number.POSITIVE_INFINITY
          : toasterDuration(),
      );
      startTimer(toast, ms);
    };

    const insert = (toast: HTMLElement) => {
      const id = toast.getAttribute("data-ok-toast-id") || `toast-${++counter}`;
      toast.setAttribute("data-ok-toast-id", id);
      const existing = byId(id);
      if (existing) {
        timers.get(existing)?.stop();
        timers.delete(existing);
        swipes.get(existing)?.destroy();
        swipes.delete(existing);
        existing.replaceWith(toast);
      } else listFor(toast).prepend(toast);
      history.push(toast);
      swipeable(toast);
      track(toast);
      const max = readNumber(element, visibleToasts) as number;
      const target = toast.parentElement as HTMLElement;
      for (const old of [...target.children].slice(max)) remove(old, "overflow");
      emit("show", { toast });
      return id;
    };

    const cloneTemplate = (template: HTMLTemplateElement): HTMLElement | null => {
      const source = template.content.querySelector("[data-ok-toast]");
      return source ? (source.cloneNode(true) as HTMLElement) : null;
    };

    const byId = (id: string) => toasts().find((t) => t.getAttribute("data-ok-toast-id") === id);

    const pause = (on: boolean) => {
      paused = on;
      for (const timer of timers.values()) {
        if (on) timer.pause();
        else timer.resume();
      }
    };
    element.addEventListener("pointerenter", () => pause(true), { signal });
    element.addEventListener(
      "pointerleave",
      () => {
        if (!element.contains(document.activeElement)) pause(false);
      },
      { signal },
    );
    element.addEventListener("focusin", () => pause(true), { signal });
    element.addEventListener(
      "focusout",
      (event) => {
        if (event.relatedTarget instanceof Node && element.contains(event.relatedTarget)) return;
        pause(false);
      },
      { signal },
    );
    element.addEventListener(
      "click",
      (event) => {
        const target = event.target as Element;
        const toast = target.closest("[data-ok-toast]");
        if (!toast || toast.parentElement?.parentElement !== element) return;
        if (target.closest("[data-ok-toast-close]")) remove(toast, "close");
        if (target.closest("[data-ok-toast-dismiss]")) remove(toast, "dismiss");
        for (const kind of ["action", "cancel"] as const) {
          if (!target.closest(`[data-ok-toast-${kind}]`)) continue;
          handlers.get(toast)?.[kind]?.onClick?.(event);
          if (event.defaultPrevented) return;
          if (!emit("action", { toast, kind }, { cancelable: true })) return;
          remove(toast, kind);
        }
      },
      { signal },
    );
    element.addEventListener(
      "keydown",
      (event) => {
        if (event.key !== "Escape") return;
        const toast = (event.target as Element).closest("[data-ok-toast]");
        if (toast && !toast.hasAttribute("data-ok-persistent")) remove(toast, "escape");
      },
      { signal },
    );
    // Toasts in the markup on load are timed too.
    for (const toast of toasts()) {
      if (!toast.getAttribute("data-ok-toast-id"))
        toast.setAttribute("data-ok-toast-id", `toast-${++counter}`);
      history.push(toast);
      swipeable(toast);
      track(toast);
    }

    const instance: ToasterInstance = {
      show(options) {
        // A swipeable toast always gets a close button: the single-pointer path (WCAG 2.5.7).
        const probe = document.createElement("li");
        if (options.position) probe.setAttribute("data-ok-position", options.position);
        const toast = buildToast(
          options,
          element.hasAttribute(closeButton.attr) || directions(probe).length > 0,
        );
        if (options.id) toast.setAttribute("data-ok-toast-id", options.id);
        if (options.duration !== undefined)
          toast.setAttribute(
            "data-ok-duration",
            options.duration === Number.POSITIVE_INFINITY
              ? "Infinity"
              : String(toastDuration(options.duration)),
          );
        if (options.dismissible === false) toast.setAttribute("data-ok-persistent", "");
        handlers.set(toast, options);
        return insert(toast);
      },
      showTemplate(template) {
        const toast = cloneTemplate(template);
        return toast ? insert(toast) : null;
      },
      promise(promise, messages) {
        const id = instance.show({
          type: "loading",
          title: messages.loading,
          description: messages.description,
        });
        promise
          .then(
            () => instance.show({ id, type: "success", title: messages.success }),
            () => instance.show({ id, type: "error", title: messages.error }),
          )
          .then(() => messages.finally?.());
        return id;
      },
      dismiss(id) {
        const targets = id === undefined ? toasts() : [byId(id)];
        for (const toast of targets) if (toast) remove(toast, "api");
      },
      getToasts: () => toasts(),
      getHistory: () => [...history],
      destroy() {
        for (const timer of timers.values()) timer.stop();
        timers.clear();
        for (const swipe of swipes.values()) swipe.destroy();
        swipes.clear();
        hotkey.destroy();
        styleObserver.disconnect();
        syncCustomProperties(element, {}, written);
      },
    };
    return instance;
  },

  delegate: [
    {
      event: "click",
      selector: "[data-ok-toast-open]",
      handle(trigger, event, runtime) {
        const root = trigger.getRootNode() as Document | ShadowRoot;
        const template = root.getElementById(trigger.getAttribute("data-ok-toast-open") as string);
        const named = trigger.getAttribute("data-ok-toast-toaster");
        const target = named
          ? root.querySelector(`[data-ok-toaster][id="${CSS.escape(named)}"]`)
          : root.querySelector("[data-ok-toaster]");
        const instance = runtime.getOrCreate<ToasterInstance>(target, "toaster");
        if (!(template instanceof HTMLTemplateElement) || !instance || !target) {
          console.warn("[owlky] No toast template or toaster for this trigger.", trigger);
          return;
        }
        event.preventDefault();
        const next = trigger.getAttribute("data-ok-toaster-position");
        if (toastPositions.includes(next as ToastPosition))
          target.setAttribute(position.attr, next as string);
        instance.showTemplate(template);
      },
    },
  ],
});
