import { afterEach, describe, expect, it, vi } from "vitest";
import { createToastApi, createToastStore } from "./toast-store.js";
import {
  createToasterHotkey,
  createToastSwipe,
  matchesHotkey,
  parseHotkey,
  parseSwipeDirections,
  type SwipeDirection,
  toasterStyle,
  toastSwipeDirections,
} from "./toaster-controller.js";

afterEach(() => {
  document.body.replaceChildren();
});

const pointer = (type: string, x: number, y: number, extra: PointerEventInit = {}) =>
  new PointerEvent(type, {
    bubbles: true,
    clientX: x,
    clientY: y,
    pointerId: 1,
    button: 0,
    ...extra,
  });

function swipeSetup(directions: SwipeDirection[] = ["right"], enabled = true) {
  const toast = document.createElement("li");
  toast.innerHTML = "<span>Text</span><button type='button'>Undo</button>";
  document.body.append(toast);
  const onDismiss = vi.fn();
  const swipe = createToastSwipe(toast, {
    directions: () => directions,
    enabled: () => enabled,
    onDismiss,
  });
  return { toast, onDismiss, swipe, text: toast.firstElementChild as HTMLElement };
}

describe("toast history and promise options", () => {
  it("getHistory keeps dismissed toasts (last version); getToasts the shown ones", () => {
    const store = createToastStore<string>();
    const toast = createToastApi(store);
    const a = toast("A");
    toast("B");
    toast.success("A2", { id: a });
    toast.dismiss(a);
    expect(toast.getToasts().map((t) => t.title)).toEqual(["B"]);
    expect(toast.getHistory().map((t) => t.title)).toEqual(["A2", "B"]);
  });

  it("promise: unwrap() gives the result, finally runs after, options reach the toast", async () => {
    const store = createToastStore<string>();
    const toast = createToastApi(store);
    const after = vi.fn();
    const id = toast.promise(Promise.resolve(7), {
      loading: "l",
      success: "s",
      error: "e",
      position: "bottom-left",
      duration: 1000,
      finally: after,
    });
    expect(store.toasts[0]?.position).toBe("bottom-left");
    await expect(id.unwrap()).resolves.toBe(7);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(after).toHaveBeenCalledTimes(1);
    expect(store.toasts[0]).toMatchObject({ type: "success", duration: 1000 });
    // The boxed id works as an id.
    toast.dismiss(id);
    expect(store.toasts).toHaveLength(0);
    const failed = toast.promise(Promise.reject(new Error("no")), {
      loading: "l",
      success: "s",
      error: "e",
    });
    await expect(failed.unwrap()).rejects.toThrow("no");
  });
});

describe("swipe directions and hotkeys", () => {
  it("defaults follow the position; lists are validated", () => {
    expect(toastSwipeDirections("top-center")).toEqual(["top"]);
    expect(toastSwipeDirections("bottom-left")).toEqual(["bottom", "left"]);
    expect(parseSwipeDirections("left  top x")).toEqual(["left", "top"]);
    expect(parseSwipeDirections([])).toEqual([]);
    expect(parseSwipeDirections(" ")).toEqual([]);
    expect(parseSwipeDirections("x")).toBeUndefined();
    expect(parseSwipeDirections(null)).toBeUndefined();
  });

  it("matches modifiers by name and keys by code", () => {
    const event = new KeyboardEvent("keydown", { altKey: true, code: "KeyT" });
    expect(matchesHotkey(event, ["altKey", "KeyT"])).toBe(true);
    expect(matchesHotkey(event, ["shiftKey", "KeyT"])).toBe(false);
    expect(matchesHotkey(event, [])).toBe(false);
    expect(parseHotkey("ctrlKey + KeyM")).toEqual(["ctrlKey", "KeyM"]);
    expect(parseHotkey("<img>")).toEqual(["altKey", "KeyT"]);
    expect(parseHotkey(undefined)).toEqual(["altKey", "KeyT"]);
  });
});

describe("createToastSwipe", () => {
  it("a long swipe in an allowed direction dismisses; the toast follows meanwhile", () => {
    const { toast, onDismiss, text } = swipeSetup(["right"]);
    text.dispatchEvent(pointer("pointerdown", 0, 0));
    toast.dispatchEvent(pointer("pointermove", 30, 2));
    expect(toast.hasAttribute("data-ok-swiping")).toBe(true);
    expect(toast.style.getPropertyValue("--_ok-swipe-x")).toBe("30px");
    toast.dispatchEvent(pointer("pointerup", 60, 2));
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(toast.hasAttribute("data-ok-swiping")).toBe(false);
    expect(toast.style.getPropertyValue("--_ok-swipe-x")).toBe("");
  });

  it("short or wrong-way swipes spring back; buttons, other pointers and disabled toasts don't swipe", () => {
    const { toast, onDismiss, text, swipe } = swipeSetup(["right"]);
    text.dispatchEvent(pointer("pointerdown", 0, 0));
    toast.dispatchEvent(pointer("pointermove", 2, 1));
    expect(toast.hasAttribute("data-ok-swiping")).toBe(false);
    toast.dispatchEvent(pointer("pointermove", -60, 0));
    // Against the allowed direction it barely moves.
    expect(Number.parseFloat(toast.style.getPropertyValue("--_ok-swipe-x"))).toBeGreaterThan(-15);
    toast.dispatchEvent(pointer("pointerup", -60, 0));
    text.dispatchEvent(pointer("pointerdown", 0, 0));
    toast.dispatchEvent(pointer("pointermove", 0, 30, { pointerId: 2 }));
    toast.dispatchEvent(pointer("pointerup", 0, 30, { pointerId: 2 }));
    toast.dispatchEvent(pointer("pointercancel", 0, 0));
    (toast.querySelector("button") as HTMLElement).dispatchEvent(pointer("pointerdown", 0, 0));
    toast.dispatchEvent(pointer("pointermove", 80, 0));
    toast.dispatchEvent(pointer("pointerup", 80, 0));
    expect(onDismiss).not.toHaveBeenCalled();
    swipe.destroy();
    text.dispatchEvent(pointer("pointerdown", 0, 0));
    toast.dispatchEvent(pointer("pointermove", 80, 0));
    toast.dispatchEvent(pointer("pointerup", 80, 0));
    expect(onDismiss).not.toHaveBeenCalled();
    const off = swipeSetup(["right"], false);
    off.text.dispatchEvent(pointer("pointerdown", 0, 0));
    off.toast.dispatchEvent(pointer("pointermove", 80, 0));
    off.toast.dispatchEvent(pointer("pointerup", 80, 0));
    expect(off.onDismiss).not.toHaveBeenCalled();
    const none = swipeSetup([]);
    none.text.dispatchEvent(pointer("pointerdown", 0, 0));
    none.toast.dispatchEvent(pointer("pointermove", 0, -80));
    none.toast.dispatchEvent(pointer("pointerup", 0, -80));
    expect(none.onDismiss).not.toHaveBeenCalled();
  });

  it("a fast vertical flick dismisses", () => {
    const { toast, onDismiss, text } = swipeSetup(["top"]);
    text.dispatchEvent(pointer("pointerdown", 0, 0));
    toast.dispatchEvent(pointer("pointermove", 0, -20));
    expect(toast.style.getPropertyValue("--_ok-swipe-y")).toBe("-20px");
    toast.dispatchEvent(pointer("pointerup", 0, -20));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});

describe("createToasterHotkey", () => {
  it("expands and focuses the toasts; Escape and leaving collapse", () => {
    const toaster = document.createElement("section");
    toaster.innerHTML =
      "<ol data-ok-toaster-list></ol><ol data-ok-toaster-list><li data-ok-toast>Hi</li></ol>";
    const outside = document.createElement("button");
    document.body.append(toaster, outside);
    let keys: readonly string[] = ["altKey", "KeyT"];
    const hotkey = createToasterHotkey(toaster, { hotkey: () => keys });
    document.dispatchEvent(new KeyboardEvent("keydown", { altKey: true, code: "KeyT" }));
    expect(toaster.hasAttribute("data-ok-expanded")).toBe(true);
    expect(document.activeElement).toBe(toaster.children[1]);
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(toaster.hasAttribute("data-ok-expanded")).toBe(false);
    document.dispatchEvent(new KeyboardEvent("keydown", { altKey: true, code: "KeyT" }));
    outside.focus();
    expect(toaster.hasAttribute("data-ok-expanded")).toBe(false);
    keys = [];
    document.dispatchEvent(new KeyboardEvent("keydown", { altKey: true, code: "KeyT" }));
    expect(toaster.hasAttribute("data-ok-expanded")).toBe(false);
    keys = ["altKey", "KeyT"];
    toaster.children[1]?.replaceChildren();
    document.dispatchEvent(new KeyboardEvent("keydown", { altKey: true, code: "KeyT" }));
    expect(toaster.hasAttribute("data-ok-expanded")).toBe(false);
    hotkey.destroy();
  });
});

describe("toasterStyle", () => {
  it("offsets per side, lengths and the gap; invalid values dropped", () => {
    expect(toasterStyle({ offset: 24, gap: 8 })).toEqual({
      "--_ok-toaster-top": "24px",
      "--_ok-toaster-right": "24px",
      "--_ok-toaster-bottom": "24px",
      "--_ok-toaster-left": "24px",
      "--_ok-toast-gap": "8px",
    });
    expect(toasterStyle({ offset: { top: "2rem", left: 4 }, mobileOffset: "10" })).toEqual({
      "--_ok-toaster-top": "2rem",
      "--_ok-toaster-left": "4px",
      "--_ok-toaster-mobile-top": "10px",
      "--_ok-toaster-mobile-right": "10px",
      "--_ok-toaster-mobile-bottom": "10px",
      "--_ok-toaster-mobile-left": "10px",
    });
    expect(toasterStyle({ offset: "1px; color: red", mobileOffset: Number.NaN, gap: -1 })).toEqual(
      {},
    );
    expect(toasterStyle({ offset: null, gap: "6" })).toEqual({ "--_ok-toast-gap": "6px" });
  });
});
