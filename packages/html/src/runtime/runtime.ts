import { supports } from "@minimal-tailwind/core";
import type {
  ComponentDefinition,
  ComponentInstance,
  DelegatedHandler,
  Runtime,
  SetupContext,
} from "./types.js";
import { PROTOCOL, VERSION } from "./version.js";

/** Subtrees marked with this attribute are owned by another implementation (e.g. React). */
export const RUNTIME_OFF_SELECTOR = '[data-mt-runtime="off"]';

const LOG_PREFIX = "[minimal-tailwind]";

interface Mounted {
  instance: ComponentInstance;
  abort: AbortController;
}

type ListenRoot = Document | ShadowRoot;

const isRuntimeOff = (element: Element) => element.closest(RUNTIME_OFF_SELECTOR) !== null;

const listenerKey = (event: string, capture: boolean) => `${event}|${capture ? "c" : "b"}`;

/**
 * Creates an isolated runtime. Pages normally use the page-wide singleton from `getRuntime()`;
 * `createRuntime()` is exported for tests and advanced embedding.
 */
export function createRuntime(): Runtime {
  const definitions = new Map<string, ComponentDefinition>();
  const instances = new Map<Element, Map<string, Mounted>>();
  const handlers = new Map<string, { event: string; capture: boolean; list: DelegatedHandler[] }>();
  /** Per connected root: its abort controller (listeners + observer). */
  const roots = new Map<ListenRoot, { abort: AbortController; listening: Set<string> }>();
  let started = false;
  let observe = true;

  // --- mounting ---------------------------------------------------------------------------

  function mount(element: HTMLElement, definition: ComponentDefinition): Mounted | undefined {
    const existing = instances.get(element)?.get(definition.name);
    if (existing) return existing;
    if (!element.isConnected || isRuntimeOff(element)) return undefined;

    const abort = new AbortController();
    const context: SetupContext = {
      signal: abort.signal,
      runtime,
      emit(type, detail, options = {}) {
        return element.dispatchEvent(
          new CustomEvent(`mt:${definition.name}:${type}`, {
            bubbles: true,
            cancelable: options.cancelable === true,
            detail,
          }),
        );
      },
    };
    let instance: ComponentInstance;
    try {
      instance = definition.setup(element, context);
    } catch (error) {
      abort.abort();
      console.error(`${LOG_PREFIX} Failed to initialize "${definition.name}".`, element, error);
      return undefined;
    }
    const mounted = { instance, abort };
    let byName = instances.get(element);
    if (!byName) {
      byName = new Map();
      instances.set(element, byName);
    }
    byName.set(definition.name, mounted);
    return mounted;
  }

  function unmount(element: Element, name: string) {
    const byName = instances.get(element);
    const mounted = byName?.get(name);
    if (!byName || !mounted) return;
    byName.delete(name);
    if (byName.size === 0) instances.delete(element);
    try {
      mounted.instance.destroy?.();
    } catch (error) {
      console.error(`${LOG_PREFIX} Failed to destroy "${name}".`, element, error);
    } finally {
      mounted.abort.abort();
    }
  }

  function initWith(root: ParentNode, definition: ComponentDefinition) {
    if (root instanceof HTMLElement && root.matches(definition.selector)) mount(root, definition);
    for (const element of root.querySelectorAll<HTMLElement>(definition.selector)) {
      mount(element, definition);
    }
  }

  /** Destroys instances whose element left the document (memory-leak guard). */
  function sweep() {
    for (const [element, byName] of [...instances]) {
      if (!element.isConnected) for (const name of [...byName.keys()]) unmount(element, name);
    }
  }

  // --- delegation -------------------------------------------------------------------------

  function dispatch(event: Event, key: string) {
    const entry = handlers.get(key);
    const origin = event.target;
    const start = origin instanceof Element ? origin : (origin as Node | null)?.parentElement;
    if (!entry || !start) return;
    for (const handler of entry.list) {
      const target = start.closest(handler.selector);
      if (!target || isRuntimeOff(target)) continue;
      try {
        handler.handle(target, event, runtime);
      } catch (error) {
        console.error(`${LOG_PREFIX} Delegated "${event.type}" handler failed.`, target, error);
      }
    }
  }

  function listen(root: ListenRoot, key: string) {
    const state = roots.get(root);
    const entry = handlers.get(key);
    if (!state || !entry || state.listening.has(key)) return;
    state.listening.add(key);
    root.addEventListener(entry.event, (event) => dispatch(event, key), {
      capture: entry.capture,
      signal: state.abort.signal,
    });
  }

  // --- observation ------------------------------------------------------------------------

  function observeRoot(root: ListenRoot, signal: AbortSignal) {
    const added = new Set<Node>();
    let removed = false;
    let scheduled = false;
    const flush = () => {
      scheduled = false;
      if (signal.aborted) return;
      // Moves (remove + re-add in one task) keep their instance: connectedness is checked here.
      if (removed) {
        removed = false;
        sweep();
      }
      for (const node of added) {
        if (node.isConnected && (node instanceof Element || node instanceof DocumentFragment)) {
          runtime.init(node);
        }
      }
      added.clear();
    };
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) added.add(node);
        if (record.removedNodes.length > 0) removed = true;
      }
      if (!scheduled) {
        scheduled = true;
        queueMicrotask(flush);
      }
    });
    observer.observe(root, { childList: true, subtree: true });
    signal.addEventListener("abort", () => observer.disconnect(), { once: true });
  }

  function connectRoot(root: ListenRoot) {
    if (roots.has(root)) return;
    const abort = new AbortController();
    roots.set(root, { abort, listening: new Set() });
    for (const key of handlers.keys()) listen(root, key);
    if (observe) observeRoot(root, abort.signal);
  }

  // --- public API -------------------------------------------------------------------------

  const runtime: Runtime = {
    version: VERSION,
    protocol: PROTOCOL,
    active: true,
    supports,

    register(...defs) {
      for (const definition of defs) {
        if (definitions.has(definition.name)) continue; // first registration wins (ADR-0005)
        definitions.set(definition.name, definition);
        for (const handler of definition.delegate ?? []) {
          const capture = handler.capture === true;
          const key = listenerKey(handler.event, capture);
          let entry = handlers.get(key);
          if (!entry) {
            entry = { event: handler.event, capture, list: [] };
            handlers.set(key, entry);
          }
          entry.list.push(handler);
          for (const root of roots.keys()) listen(root, key);
        }
        if (started) initWith(document, definition);
      }
      return runtime;
    },

    start(options = {}) {
      if (started || typeof document === "undefined") return runtime;
      started = true;
      observe = options.observe !== false;
      connectRoot(document);
      if (document.readyState === "loading") {
        const signal = roots.get(document)?.abort.signal;
        document.addEventListener("DOMContentLoaded", () => runtime.init(document), {
          once: true,
          ...(signal ? { signal } : {}),
        });
      } else {
        runtime.init(document);
      }
      return runtime;
    },

    stop() {
      for (const { abort } of roots.values()) abort.abort();
      roots.clear();
      for (const [element, byName] of [...instances]) {
        for (const name of [...byName.keys()]) unmount(element, name);
      }
      started = false;
    },

    connect(root) {
      if (!started) runtime.start();
      connectRoot(root);
      runtime.init(root);
    },

    init(root = document) {
      sweep();
      for (const definition of definitions.values()) initWith(root, definition);
    },

    destroy(root = document) {
      for (const [element, byName] of [...instances]) {
        if (root === element || root.contains(element)) {
          for (const name of [...byName.keys()]) unmount(element, name);
        }
      }
    },

    get<I extends ComponentInstance>(element: Element | null, name: string) {
      if (!element) return undefined;
      return instances.get(element)?.get(name)?.instance as I | undefined;
    },

    getOrCreate<I extends ComponentInstance>(element: Element | null, name: string) {
      const definition = definitions.get(name);
      if (
        !(element instanceof HTMLElement) ||
        !definition ||
        !element.matches(definition.selector)
      ) {
        return undefined;
      }
      return mount(element, definition)?.instance as I | undefined;
    },
  };

  return runtime;
}
