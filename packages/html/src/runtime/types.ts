import type { Supports } from "@owlky/core";

/** Anything a component instance returns from `setup`. */
export interface ComponentInstance {
  /** Extra teardown. Listeners registered with `context.signal` are removed automatically. */
  destroy?(): void;
}

export interface EmitOptions {
  cancelable?: boolean;
}

/**
 * Declares one event of a component (`ok:<component>:<name>`) for its event map: the type of
 * `event.detail` and whether `preventDefault()` refuses the change (`true`), never does
 * (`false`) or only sometimes does (`boolean`, explained in the member's comment). Type only:
 * the API reference (`scripts/api-reference.mjs`, ADR-0049) reads the maps and their comments.
 */
export interface EventSpec<Detail = undefined, Cancelable extends boolean = false> {
  readonly detail: Detail;
  readonly cancelable: Cancelable;
}

/** A component's events, by name (without the `ok:<component>:` prefix). */
export type EventMap<E> = { [K in keyof E]: EventSpec<unknown, boolean> };

/** Any events: what a definition without an event map may emit. */
export type AnyEvents = Record<string, EventSpec<unknown, boolean>>;

export interface SetupContext<E extends EventMap<E> = AnyEvents> {
  /** Aborted when the instance is destroyed. Pass it to every `addEventListener`. */
  readonly signal: AbortSignal;
  readonly runtime: Runtime;
  /**
   * Dispatches a bubbling `ok:<component>:<type>` CustomEvent on the element.
   * Returns `false` if a listener called `preventDefault()` on a cancelable event.
   */
  emit<K extends keyof E & string>(
    type: K,
    detail?: E[K]["detail"],
    options?: EmitOptions,
  ): boolean;
}

/**
 * A document-level delegated listener. One native listener per event type is shared by every
 * component; it calls `handle` with the closest element matching `selector`.
 */
export interface DelegatedHandler {
  readonly event: keyof DocumentEventMap;
  readonly selector: string;
  /** Listen in the capture phase (needed for non-bubbling events such as focus or toggle). */
  readonly capture?: boolean;
  handle(target: Element, event: Event, runtime: Runtime): void;
}

export interface ComponentDefinition<I extends ComponentInstance = ComponentInstance> {
  /** Unique, lowercase name. Events are named `ok:<name>:<type>`. */
  readonly name: string;
  /** Root selector. Every match is mounted automatically. */
  readonly selector: string;
  setup(element: HTMLElement, context: SetupContext): I;
  readonly delegate?: readonly DelegatedHandler[];
}

export interface StartOptions {
  /** Mount/destroy components automatically as the DOM changes. Default `true`. */
  observe?: boolean;
}

export interface Runtime {
  readonly version: string;
  readonly protocol: number;
  /** `false` for a copy that refused to start because another protocol already owns the page. */
  readonly active: boolean;
  readonly supports: Supports;
  /** Registers definitions. Re-registering a name keeps the first definition. Chainable. */
  register(...definitions: ComponentDefinition[]): Runtime;
  /** Connects to `document`, mounts existing components and starts observing. Idempotent. */
  start(options?: StartOptions): Runtime;
  /** Removes every listener and observer and destroys every instance. `start()` works again. */
  stop(): void;
  /** Connects delegation and observation to a shadow root (components inside it then work). */
  connect(root: ShadowRoot): void;
  /** Mounts every registered component inside `root` (default: document). Idempotent. */
  init(root?: ParentNode): void;
  /** Destroys every instance inside `root` (inclusive). */
  destroy(root?: ParentNode): void;
  /** The instance of component `name` on `element`, if mounted. */
  get<I extends ComponentInstance>(element: Element | null, name: string): I | undefined;
  /** Like `get`, but mounts the component first when needed. */
  getOrCreate<I extends ComponentInstance>(element: Element | null, name: string): I | undefined;
}
