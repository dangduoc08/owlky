import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createToastApi,
  createToastStore,
  createToastTimer,
  isToastButton,
  toastDuration,
  toastPositions,
  toastTypes,
} from "./toast-store.js";

afterEach(() => vi.useRealTimers());

describe("toast store", () => {
  it("adds newest first, updates in place by id, notifies subscribers", () => {
    const store = createToastStore<string>();
    const seen: number[] = [];
    const off = store.subscribe((toasts) => seen.push(toasts.length));
    store.set({ id: 1, type: "default", title: "a" });
    store.set({ id: 2, type: "info", title: "b" });
    store.set({ id: 1, type: "success", title: "a2" });
    expect(store.toasts.map((t) => [t.id, t.type, t.title])).toEqual([
      [2, "info", "b"],
      [1, "success", "a2"],
    ]);
    off();
    store.dismiss(2);
    expect(seen).toEqual([1, 2, 2]);
  });

  it("dismiss one, all, or an unknown id; expire calls onAutoClose", () => {
    const store = createToastStore<string>();
    const onDismiss = vi.fn();
    const onAutoClose = vi.fn();
    store.set({ id: "a", type: "default", onDismiss, onAutoClose });
    store.set({ id: "b", type: "default", onDismiss });
    store.dismiss("missing");
    store.expire("a");
    expect(onAutoClose).toHaveBeenCalledTimes(1);
    expect(onDismiss).not.toHaveBeenCalled();
    store.set({ id: "c", type: "default", onDismiss });
    store.dismiss();
    expect(onDismiss).toHaveBeenCalledTimes(2);
    expect(store.toasts).toEqual([]);
  });
});

describe("toast api", () => {
  it("types, ids and custom content", () => {
    const store = createToastStore<string>();
    const toast = createToastApi(store);
    expect(toast("Default")).toBe(1);
    toast.message("Message", { description: "d" });
    toast.info("Info");
    toast.success("Success");
    toast.warning("Warning");
    toast.error("Error", { id: "e" });
    toast.loading("Loading");
    toast.custom("<custom>", { duration: 10 });
    toast.custom("x", { id: "c" });
    expect(store.toasts.map((t) => t.type).reverse()).toEqual([
      "default",
      "default",
      "info",
      "success",
      "warning",
      "error",
      "loading",
      "default",
      "default",
    ]);
    expect(store.toasts.find((t) => t.type === "loading")?.duration).toBe(Number.POSITIVE_INFINITY);
    expect(store.toasts.find((t) => t.custom === "<custom>")?.duration).toBe(10);
    expect(store.toasts.find((t) => t.id === "e")?.title).toBe("Error");
    toast.dismiss("e");
    toast.dismiss();
    expect(store.toasts).toEqual([]);
  });

  it("promise: loading, then success or error in the same toast", async () => {
    const store = createToastStore<string>();
    const toast = createToastApi(store);
    const ok = toast.promise(Promise.resolve(3), {
      loading: "Loading…",
      success: (value) => `Got ${value}`,
      error: "Failed",
      description: "wait",
    });
    const bad = toast.promise(() => Promise.reject(new Error("x")), {
      loading: "Loading…",
      success: "Done",
      error: (reason) => `Error: ${(reason as Error).message}`,
    });
    expect(store.toasts.find((t) => t.id === ok.valueOf())).toMatchObject({
      type: "loading",
      description: "wait",
    });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(store.toasts.find((t) => t.id === ok.valueOf())).toMatchObject({
      type: "success",
      title: "Got 3",
      duration: undefined,
      description: undefined,
    });
    expect(store.toasts.find((t) => t.id === bad.valueOf())).toMatchObject({
      type: "error",
      title: "Error: x",
    });
    const plain = toast.promise(Promise.resolve(1), { loading: "l", success: "Done", error: "e" });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(store.toasts.find((t) => t.id === plain.valueOf())?.title).toBe("Done");
  });
});

describe("isToastButton", () => {
  it("tells button descriptions from content", () => {
    expect(isToastButton({ label: "Undo" })).toBe(true);
    expect(isToastButton({ label: "x", $$typeof: Symbol.for("react.element") })).toBe(false);
    expect(isToastButton(document.createElement("button"))).toBe(false);
    expect(isToastButton({ onClick() {} })).toBe(false);
    expect(isToastButton(null)).toBe(false);
    expect(isToastButton("Undo")).toBe(false);
  });
});

describe("toast timer", () => {
  it("expires after the duration, pauses and resumes with the remaining time", () => {
    vi.useFakeTimers();
    const onExpire = vi.fn();
    const timer = createToastTimer(1000, onExpire);
    vi.advanceTimersByTime(600);
    timer.pause();
    timer.pause();
    vi.advanceTimersByTime(5000);
    expect(onExpire).not.toHaveBeenCalled();
    timer.resume();
    timer.resume();
    vi.advanceTimersByTime(399);
    expect(onExpire).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it("restart, stop, infinite durations; restart while paused waits for resume", () => {
    vi.useFakeTimers();
    const onExpire = vi.fn();
    const timer = createToastTimer(Number.POSITIVE_INFINITY, onExpire);
    vi.advanceTimersByTime(100000);
    timer.pause();
    timer.restart(100);
    vi.advanceTimersByTime(200);
    expect(onExpire).not.toHaveBeenCalled();
    timer.resume();
    vi.advanceTimersByTime(100);
    expect(onExpire).toHaveBeenCalledTimes(1);
    timer.restart(100);
    timer.stop();
    vi.advanceTimersByTime(200);
    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it("durations, types and positions", () => {
    expect(toastDuration(1000)).toBe(1000);
    expect(toastDuration(Number.POSITIVE_INFINITY)).toBe(Number.POSITIVE_INFINITY);
    expect(toastDuration(-1)).toBe(4000);
    expect(toastDuration("5", 10)).toBe(10);
    expect(toastDuration(Number.NaN)).toBe(4000);
    expect(toastTypes).toContain("loading");
    expect(toastPositions).toHaveLength(6);
  });
});
