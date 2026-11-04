import { afterEach, describe, expect, it } from "vitest";
import { sharedState } from "../shared-state.js";
import { cleanupDom } from "../test-utils.js";
import { isScrollLocked, lockScroll } from "./scroll-lock.js";

afterEach(cleanupDom);

describe("sharedState", () => {
  it("returns the same object for the same key and protocol", () => {
    const a = sharedState("test-key", 1, () => ({ n: 1 }));
    const b = sharedState("test-key", 1, () => ({ n: 2 }));
    expect(b).toBe(a);
  });

  it("isolates different protocol versions", () => {
    const v1 = sharedState("test-proto", 1, () => ({ v: 1 }));
    const v2 = sharedState("test-proto", 2, () => ({ v: 2 }));
    expect(v2).not.toBe(v1);
  });

  it("is visible to another library copy through Symbol.for", () => {
    const state = sharedState("test-visible", 1, () => ({ ok: true }));
    const raw = (globalThis as unknown as Record<symbol, unknown>)[
      Symbol.for("minimal-tailwind.test-visible@1")
    ];
    expect(raw).toBe(state);
  });
});

describe("lockScroll", () => {
  it("is reference counted and restores the original inline styles", () => {
    document.documentElement.style.overflow = "scroll";
    const releaseA = lockScroll();
    const releaseB = lockScroll();
    expect(document.documentElement.style.overflow).toBe("hidden");
    releaseA();
    releaseA();
    expect(isScrollLocked()).toBe(true);
    releaseB();
    expect(isScrollLocked()).toBe(false);
    expect(document.documentElement.style.overflow).toBe("scroll");
  });
});
