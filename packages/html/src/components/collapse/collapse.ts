import {
  type CollapsePhase,
  type CollapseStatus,
  collapseStyle,
  createCollapseController,
  readCollapseOptions,
} from "@owlky/core";
import { defineComponent } from "../../runtime/define.js";
import { syncCustomProperties } from "../../runtime/style.js";
import type { ComponentInstance, EventSpec, Runtime } from "../../runtime/types.js";

/** Events of this component (`ok:<name>:<event>` on the root). */
export interface CollapseEvents {
  /** Before the opening animation starts (`in` is `true`). */
  enter: EventSpec<{ in: boolean }>;
  /** When the opening animation starts. */
  entering: EventSpec<{ in: boolean }>;
  /** After the opening animation ended. */
  entered: EventSpec<{ in: boolean }>;
  /** Before the closing animation starts (`in` is `false`). */
  exit: EventSpec<{ in: boolean }>;
  /** When the closing animation starts. */
  exiting: EventSpec<{ in: boolean }>;
  /** After the closing animation ended. */
  exited: EventSpec<{ in: boolean }>;
}

export interface CollapseInstance extends ComponentInstance {
  /** `true` while the element has no `hidden`. */
  readonly in: boolean;
  /** `entering`, `entered`, `exiting` or `exited`. */
  readonly status: CollapseStatus;
  /** Opens it (removes `hidden`). */
  show(): void;
  /** Closes it (adds `hidden`). */
  hide(): void;
  /** Opens it when closed, closes it when open; `force` picks the state. */
  toggle(force?: boolean): void;
}

const TOGGLE = "data-ok-collapse-toggle";
const PHASES: readonly CollapsePhase[] = [
  "enter",
  "entering",
  "entered",
  "exit",
  "exiting",
  "exited",
];
/** Option attributes: a change applies to the next animation. */
const OPTIONS = [
  "data-ok-orientation",
  "data-ok-collapsed-size",
  "data-ok-timeout",
  "data-ok-timeout-exit",
  "data-ok-easing",
  "data-ok-easing-exit",
];

/** The collapses a trigger names (space-separated ids). */
const targets = (trigger: Element, runtime: Runtime): CollapseInstance[] => {
  const root = trigger.getRootNode() as Document | ShadowRoot;
  const found: CollapseInstance[] = [];
  for (const id of (trigger.getAttribute(TOGGLE) as string).split(/\s+/)) {
    const target = id ? root.getElementById(id) : null;
    if (!target?.hasAttribute("data-ok-collapse")) continue;
    const instance = runtime.getOrCreate<CollapseInstance>(target, "collapse");
    if (instance) found.push(instance);
  }
  return found;
};

/**
 * Collapse — spec: specs/components/collapse.md, ADR-0044
 *
 * Markup:  <div id="c" data-ok-collapse [hidden] [data-ok-orientation="horizontal"]
 *               [data-ok-collapsed-size="40"] [data-ok-timeout="300|auto"] [data-ok-timeout-exit]
 *               [data-ok-easing] [data-ok-easing-exit] [data-ok-disable-prefers-reduced-motion]>…</div>
 * Behavior: `hidden` is the state (written by this runtime's API and triggers, or by another
 *          owner such as the List or Tree view runtime); core `createCollapseController` animates
 *          the size whenever it changes. Without JavaScript the markup's state is shown as is.
 * Triggers: [data-ok-collapse-toggle="<ids>"] — a checkbox opens the collapses while checked; a
 *          button toggles them and mirrors `aria-expanded`.
 * Events:  ok:collapse:enter, entering, entered, exit, exiting, exited.
 */
export const collapse = defineComponent<CollapseInstance, CollapseEvents>({
  name: "collapse",
  selector: "[data-ok-collapse]",

  setup(element, { emit }) {
    let written: string[] = [];
    const callbacks = Object.fromEntries(
      PHASES.map((phase) => [
        `on${phase[0]?.toUpperCase()}${phase.slice(1)}`,
        () => emit(phase, { in: !element.hidden }),
      ]),
    );
    const read = () => {
      const options = readCollapseOptions(element);
      written = syncCustomProperties(
        element,
        collapseStyle(options) as Partial<Record<`--_ok-${string}`, string>>,
        written,
      );
      return { ...options, ...callbacks };
    };
    const controller = createCollapseController(element, read());
    const options = new MutationObserver(() => controller.update(read()));
    options.observe(element, { attributes: true, attributeFilter: OPTIONS });

    const instance: CollapseInstance = {
      get in() {
        return !element.hidden;
      },
      get status() {
        return controller.status;
      },
      show() {
        element.hidden = false;
      },
      hide() {
        element.hidden = true;
      },
      toggle(force) {
        element.hidden = !(force ?? element.hidden);
      },
      destroy() {
        options.disconnect();
        controller.destroy();
        syncCustomProperties(element, {}, written);
      },
    };
    return instance;
  },

  delegate: [
    {
      event: "change",
      selector: `input[type="checkbox"][${TOGGLE}]`,
      handle(trigger, _event, runtime) {
        const checked = (trigger as HTMLInputElement).checked;
        for (const instance of targets(trigger, runtime)) instance.toggle(checked);
      },
    },
    {
      event: "click",
      selector: `button[${TOGGLE}]`,
      handle(trigger, _event, runtime) {
        const found = targets(trigger, runtime);
        const first = found[0];
        if (!first) return;
        const open = !first.in;
        for (const instance of found) instance.toggle(open);
        trigger.setAttribute("aria-expanded", String(open));
      },
    },
  ],
});
