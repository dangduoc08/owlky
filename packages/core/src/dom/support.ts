/**
 * Feature detection for the native APIs components rely on (ADR-0006). Evaluated lazily, so
 * importing this module is safe during SSR. Components check these flags and switch to their
 * documented fallback instead of assuming support.
 */
export interface Supports {
  /** `HTMLDialogElement.prototype.showModal` — top layer, inert background, Esc handling. */
  readonly dialog: boolean;
  /** The Popover API (`popover` attribute, `showPopover()`). */
  readonly popover: boolean;
  /** The `inert` attribute. */
  readonly inert: boolean;
  /** Exclusive `<details name>` groups (one open at a time). */
  readonly detailsName: boolean;
}

const hasDom = () => typeof window !== "undefined" && typeof document !== "undefined";

export const supports: Supports = {
  get dialog() {
    return (
      hasDom() &&
      typeof HTMLDialogElement === "function" &&
      typeof HTMLDialogElement.prototype.showModal === "function"
    );
  },
  get popover() {
    return hasDom() && Object.hasOwn(HTMLElement.prototype, "popover");
  },
  get inert() {
    return hasDom() && "inert" in HTMLElement.prototype;
  },
  get detailsName() {
    return (
      hasDom() && typeof HTMLDetailsElement === "function" && "name" in HTMLDetailsElement.prototype
    );
  },
};
