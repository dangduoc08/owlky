import {
  createToastTimer,
  readNumber,
  type ToastPosition,
  type ToastTimer,
  type ToastType,
  toastDuration,
  toasterOptions,
  toastPositions,
  toastTypes,
} from "@owlky/core";
import { defineComponent } from "../../runtime/define.js";
import type { ComponentInstance } from "../../runtime/types.js";

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
  /** `false`: no close button, Escape ignored. */
  dismissible?: boolean | undefined;
}

export interface ToasterInstance extends ComponentInstance {
  /** Shows a toast built from text (never HTML). Returns its id. */
  show(options: ToastShowOptions): string;
  /** Shows a copy of a `<template>`'s toast (`li[data-ok-toast]`). Returns its id. */
  showTemplate(template: HTMLTemplateElement): string | null;
  /** Shows `loading` until the promise settles, then `success` or `error` in the same toast. */
  promise<T>(
    promise: Promise<T>,
    messages: { loading: string; success: string; error: string },
  ): string;
  /** Closes one toast, or every toast. */
  dismiss(id?: string): void;
}

const ICONS: Record<"info" | "success" | "warning" | "error", string> = {
  info: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20m1 15h-2v-6h2zm0-8h-2V7h2z",
  success: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20m-1.4 14.2-4.3-4.3 1.4-1.4 2.9 2.9 6-6 1.4 1.4z",
  warning: "M12 2.5 1.5 21h21zM13 18h-2v-2h2zm0-4h-2V9h2z",
  error: "M15.7 2H8.3L3 7.3v7.4L8.3 20h7.4l5.3-5.3V7.3zM13 16h-2v-2h2zm0-4h-2V7h2z",
};

const SVG = "http://www.w3.org/2000/svg";
const { position, duration, visibleToasts, closeButton } = toasterOptions.options;

function svg(d: string, stroke = false): SVGSVGElement {
  const root = document.createElementNS(SVG, "svg");
  root.setAttribute("aria-hidden", "true");
  root.setAttribute("viewBox", "0 0 24 24");
  const path = document.createElementNS(SVG, "path");
  path.setAttribute("d", d);
  if (stroke) {
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "currentColor");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-width", "2");
  } else path.setAttribute("fill", "currentColor");
  root.append(path);
  return root;
}

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
  button.append(svg("M18 6 6 18M6 6l12 12", true));
  return button;
}

/** A toast element built with createElement / textContent only. */
function buildToast(options: ToastShowOptions, withClose: boolean): HTMLLIElement {
  const type = toastTypes.includes(options.type as ToastType)
    ? (options.type as ToastType)
    : "default";
  const li = document.createElement("li");
  li.setAttribute("data-ok-toast", "");
  li.setAttribute("data-ok-type", type);
  if (type !== "default") {
    const icon = document.createElement("span");
    icon.setAttribute("data-ok-toast-icon", "");
    icon.setAttribute("aria-hidden", "true");
    icon.append(type === "loading" ? spinner() : svg(ICONS[type]));
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
 * Toasts:   [data-ok-toast-close], [data-ok-toast-action], [data-ok-toast-cancel] and your own
 *           [data-ok-toast-dismiss] buttons close it; time
 *           pauses while the toaster is hovered or focused; Escape on a focused toast closes it.
 * Events:   ok:toaster:show (detail.toast), ok:toaster:dismiss (detail.toast, detail.reason:
 *           "close" | "dismiss" | "action" | "cancel" | "timeout" | "escape" | "api" | "overflow");
 *           ok:toaster:action (cancelable, detail.toast, detail.kind) before an action closes it.
 */
export const toaster = defineComponent<ToasterInstance>({
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
    const timers = new Map<Element, ToastTimer>();
    const handlers = new Map<Element, ToastShowOptions>();
    let counter = 0;
    let paused = false;

    const remove = (toast: Element, reason: string) => {
      timers.get(toast)?.stop();
      timers.delete(toast);
      handlers.delete(toast);
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
            toast.replaceWith(replacement);
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
      const existing = [...(list as HTMLOListElement).children].find(
        (t) => t.getAttribute("data-ok-toast-id") === id,
      );
      if (existing) {
        timers.get(existing)?.stop();
        timers.delete(existing);
        existing.replaceWith(toast);
      } else (list as HTMLOListElement).prepend(toast);
      track(toast);
      const max = readNumber(element, visibleToasts) as number;
      for (const old of [...(list as HTMLOListElement).children].slice(max))
        remove(old, "overflow");
      emit("show", { toast });
      return id;
    };

    const cloneTemplate = (template: HTMLTemplateElement): HTMLElement | null => {
      const source = template.content.querySelector("[data-ok-toast]");
      return source ? (source.cloneNode(true) as HTMLElement) : null;
    };

    const byId = (id: string) =>
      [...(list as HTMLOListElement).children].find(
        (t) => t.getAttribute("data-ok-toast-id") === id,
      );

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
        if (!toast || !list?.contains(toast)) return;
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
    for (const toast of list.children) {
      if (!toast.getAttribute("data-ok-toast-id"))
        toast.setAttribute("data-ok-toast-id", `toast-${++counter}`);
      track(toast);
    }

    const instance: ToasterInstance = {
      show(options) {
        const toast = buildToast(options, element.hasAttribute(closeButton.attr));
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
        const id = instance.show({ type: "loading", title: messages.loading });
        promise.then(
          () => instance.show({ id, type: "success", title: messages.success }),
          () => instance.show({ id, type: "error", title: messages.error }),
        );
        return id;
      },
      dismiss(id) {
        const targets = id === undefined ? [...(list as HTMLOListElement).children] : [byId(id)];
        for (const toast of targets) if (toast) remove(toast, "api");
      },
      destroy() {
        for (const timer of timers.values()) timer.stop();
        timers.clear();
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
        const target = root.querySelector("[data-ok-toaster]");
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
