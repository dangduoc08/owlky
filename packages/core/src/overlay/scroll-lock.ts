import { sharedState } from "../shared-state.js";

/**
 * Reference-counted page scroll lock shared by every overlay and every library copy on the page:
 * the first lock saves and sets the styles, the last release restores them.
 *
 * Shared-state shape — bump the protocol if it changes.
 */
interface ScrollLockState {
  count: number;
  saved: { overflow: string; paddingRight: string } | null;
}

const PROTOCOL = 1;
const state = () =>
  sharedState<ScrollLockState>("scroll-lock", PROTOCOL, () => ({ count: 0, saved: null }));

/** Locks page scrolling. Returns an idempotent release function. */
export function lockScroll(doc: Document = document): () => void {
  const lock = state();
  const html = doc.documentElement;
  if (lock.count === 0) {
    const scrollbar = (doc.defaultView?.innerWidth ?? html.clientWidth) - html.clientWidth;
    lock.saved = { overflow: html.style.overflow, paddingRight: html.style.paddingRight };
    if (scrollbar > 0) {
      const current = Number.parseFloat(getComputedStyle(html).paddingRight) || 0;
      html.style.paddingRight = `${current + scrollbar}px`;
    }
    html.style.overflow = "hidden";
  }
  lock.count += 1;

  let released = false;
  return () => {
    if (released) return;
    released = true;
    lock.count = Math.max(0, lock.count - 1);
    if (lock.count === 0 && lock.saved) {
      html.style.overflow = lock.saved.overflow;
      html.style.paddingRight = lock.saved.paddingRight;
      lock.saved = null;
    }
  };
}

export const isScrollLocked = (): boolean => state().count > 0;
