import { createToastStore } from "@owlky/core";
import { act, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { expectNoAxeViolations } from "../test-utils.js";
import { Toaster, toast, toastStore, useSonner } from "./snackbar.js";

afterEach(() => {
  act(() => toast.dismiss());
});

/** Counts the page's toasts through `useSonner()`. */
function Count() {
  const { toasts } = useSonner();
  return <output>{toasts.length}</output>;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
// Resolves once the toast titles read `expected` (a MutationObserver, never a poll).
const untilTitles = (expected: string[]) =>
  new Promise<void>((resolve) => {
    const done = () => JSON.stringify(titles()) === JSON.stringify(expected);
    if (done()) return resolve();
    const observer = new MutationObserver(() => {
      if (!done()) return;
      observer.disconnect();
      resolve();
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  });
const titles = () =>
  [...document.querySelectorAll("[data-ok-toast-title]")].map((t) => t.textContent);

describe("Toaster", () => {
  it("renders an empty polite region; only given options become attributes", () => {
    render(<Toaster />);
    const region = screen.getByRole("region", { name: "Notifications" });
    expect(region.dataset).toMatchObject({
      okToaster: "",
      okPosition: "top-right",
      okRuntime: "off",
    });
    expect(region.hasAttribute("data-ok-duration")).toBe(false);
    expect(region.querySelector("ol[data-ok-toaster-list]")?.getAttribute("aria-live")).toBe(
      "polite",
    );
  });

  it("toast() shows toasts newest first; types get icons; close removes one", async () => {
    render(<Toaster closeButton position="bottom-center" duration={10000} visibleToasts={5} />);
    act(() => {
      toast("Saved");
      toast.success("Created", { description: "Monday" });
      toast.loading("Loading");
    });
    expect(titles()).toEqual(["Loading", "Created", "Saved"]);
    const created = document.querySelector("[data-ok-type='success']") as HTMLElement;
    expect(created.querySelector("[data-ok-toast-icon] svg")).not.toBeNull();
    expect(created.querySelector("[data-ok-toast-description]")?.textContent).toBe("Monday");
    expect(
      document.querySelector("[data-ok-type='loading'] [data-ok-circular-progress]"),
    ).not.toBeNull();
    expect(document.querySelector("[data-ok-type='loading'] [data-ok-toast-close]")).toBeNull();
    const saved = document.querySelector("[data-ok-type='default']") as HTMLElement;
    expect(getComputedStyle(saved).backgroundColor).toBe("rgb(39, 39, 42)");
    expect(getComputedStyle(created).backgroundColor).toBe("rgb(255, 255, 255)");
    await expectNoAxeViolations();
    await userEvent.click(saved.querySelector("[data-ok-toast-close]") as HTMLElement, {
      force: true,
    });
    expect(titles()).toEqual(["Loading", "Created"]);
  });

  it("auto-closes after the duration, pausing while hovered; Escape closes a focused toast", async () => {
    render(<Toaster duration={150} />);
    act(() => {
      toast("One");
    });
    await untilTitles([]);
    act(() => {
      // Long enough that a loaded CI runner's click-to-hover delay can't use it up.
      toast("Two", { duration: 1500 });
    });
    const region = screen.getByRole("region");
    // Hover the toast once it has slid in: mid-animation it can sit outside the viewport.
    const two = region.querySelector("[data-ok-toast]") as HTMLElement;
    for (const animation of two.getAnimations({ subtree: true })) animation.finish();
    await userEvent.hover(two);
    await wait(2000);
    expect(titles()).toEqual(["Two"]);
    await userEvent.unhover(two);
    await untilTitles([]);
    act(() => {
      toast("Three", { action: { label: "Undo" } });
    });
    (region.querySelector("[data-ok-toast-action]") as HTMLElement).focus();
    await userEvent.keyboard("{Escape}");
    expect(titles()).toEqual([]);
    (document.body as HTMLElement).focus();
  });

  it("focus pauses the time until it leaves the toaster; leaving with focus inside keeps it paused", async () => {
    render(
      <>
        <Toaster duration={300} />
        <input aria-label="Outside" />
      </>,
    );
    act(() => {
      toast("Paused", { action: { label: "Act" } });
    });
    const region = screen.getByRole("region");
    const action = screen.getByRole("button", { name: "Act" });
    action.focus();
    await userEvent.hover(region, { force: true });
    await userEvent.unhover(region);
    await wait(500);
    expect(titles()).toEqual(["Paused"]);
    action.dispatchEvent(new FocusEvent("focusout", { bubbles: true, relatedTarget: region }));
    screen.getByRole("textbox").focus();
    await wait(500);
    expect(titles()).toEqual([]);
  });

  it("actions and cancel close it unless prevented; custom actions and content; dismissible", async () => {
    const onClick = vi.fn((event: Event) => event.preventDefault());
    render(<Toaster closeButton duration={10000} />);
    act(() => {
      toast("Prevented", { action: { label: "Undo", onClick } });
    });
    await userEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(onClick).toHaveBeenCalled();
    expect(titles()).toEqual(["Prevented"]);
    act(() => {
      toast.dismiss();
      toast("Cancel me", { cancel: { label: "No" } });
    });
    await userEvent.click(screen.getByRole("button", { name: "No" }));
    expect(titles()).toEqual([]);
    act(() => {
      toast.warning("Title", { action: <span data-testid="own">own</span> });
      toast.custom(<b data-testid="custom">custom</b>);
      toast("Stay", { dismissible: false });
    });
    expect(screen.getByTestId("own").parentElement?.hasAttribute("data-ok-toast-actions")).toBe(
      true,
    );
    expect(screen.getByTestId("custom").parentElement?.hasAttribute("data-ok-custom")).toBe(true);
    const stay = screen.getByText("Stay").closest("[data-ok-toast]") as HTMLElement;
    expect(stay.querySelector("[data-ok-toast-close]")).toBeNull();
    stay.tabIndex = 0;
    stay.focus();
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByText("Stay")).not.toBeNull();
  });

  it("promise updates in place and restarts the time; own store; visible count; SSR", async () => {
    render(<Toaster duration={10000} visibleToasts={2} />);
    await act(async () => {
      toast.promise(Promise.resolve(1), { loading: "Saving", success: "Saved", error: "Failed" });
      await wait(10);
    });
    expect(titles()).toEqual(["Saved"]);
    act(() => {
      toast("A");
      toast("B");
    });
    expect(titles()).toEqual(["B", "A"]);
    const store = createToastStore<ReactNode>();
    render(<Toaster store={store} aria-label="Own" />);
    act(() => {
      store.set({ id: "x", type: "info", title: "Own toast", icon: <i>i</i> });
    });
    expect(screen.getByRole("region", { name: "Own" }).textContent).toContain("Own toast");
    expect(toastStore.toasts.length).toBeGreaterThan(0);
    expect(renderToString(<Toaster />)).toContain("data-ok-toaster");
  });

  it("expand={false} stacks the toasts; hover and the hotkey expand them", async () => {
    render(<Toaster expand={false} duration={10000} gap={20} offset={{ top: 40 }} />);
    const region = screen.getByRole("region", { name: "Notifications" });
    expect(region.dataset["okExpand"]).toBe("false");
    expect(region.dataset["okGap"]).toBe("20");
    expect(region.style.getPropertyValue("--_ok-toaster-top")).toBe("40px");
    act(() => {
      toast("One");
      toast("Two");
      toast("Three");
      toast("Four");
    });
    const items = [...region.querySelectorAll<HTMLElement>("[data-ok-toast]")];
    expect(items).toHaveLength(3);
    const [front, second] = items as [HTMLElement, HTMLElement];
    expect(getComputedStyle(second).position).toBe("absolute");
    expect(second.getBoundingClientRect().height).toBeCloseTo(
      front.getBoundingClientRect().height,
      0,
    );
    expect(getComputedStyle(second.firstElementChild as Element).opacity).toBe("0");
    expect(getComputedStyle(region).top).toBe(window.innerWidth >= 600 ? "40px" : "16px");
    document.dispatchEvent(new KeyboardEvent("keydown", { altKey: true, code: "KeyT" }));
    expect(region.hasAttribute("data-ok-expanded")).toBe(true);
    expect(document.activeElement?.hasAttribute("data-ok-toaster-list")).toBe(true);
    expect(getComputedStyle(second).position).toBe("relative");
    expect(getComputedStyle(region.querySelector("ol") as Element).rowGap).toBe("20px");
    await userEvent.keyboard("{Escape}");
    expect(region.hasAttribute("data-ok-expanded")).toBe(false);
  });

  it("per-toast position, closeButton, invert and richColors; toastOptions and icons", () => {
    render(
      <Toaster
        richColors
        duration={10000}
        toastOptions={{ closeButton: true }}
        icons={{ success: <i data-testid="ok-icon" />, close: <i data-testid="x-icon" /> }}
      />,
    );
    act(() => {
      toast.success("Rich");
      toast("Bottom", { position: "bottom-left", invert: true, closeButton: false });
      toast.info("Plain", { richColors: false });
    });
    const region = screen.getByRole("region", { name: "Notifications" });
    const [main, other] = region.querySelectorAll("ol");
    expect(other?.dataset["okPosition"]).toBe("bottom-left");
    expect(getComputedStyle(other as Element).position).toBe("fixed");
    expect(getComputedStyle(other as Element).bottom).toBe("16px");
    const rich = screen.getByText("Rich").closest("li") as HTMLElement;
    expect(rich.querySelector("[data-testid='ok-icon']")).not.toBeNull();
    expect(rich.querySelector("[data-testid='x-icon']")).not.toBeNull();
    expect(getComputedStyle(rich).backgroundColor).toBe("rgb(220, 252, 231)");
    const plain = screen.getByText("Plain").closest("li") as HTMLElement;
    expect(plain.dataset["okRichColors"]).toBe("false");
    expect(getComputedStyle(plain).backgroundColor).not.toBe(
      getComputedStyle(rich).backgroundColor,
    );
    const bottom = screen.getByText("Bottom").closest("li") as HTMLElement;
    expect(bottom.dataset).toMatchObject({ okPosition: "bottom-left", okInvert: "" });
    expect(bottom.querySelector("[data-ok-toast-close]")).toBeNull();
    expect(main?.children).toHaveLength(2);
  });

  it("several toasters: toasterId picks one; useSonner; getHistory", () => {
    render(
      <>
        <Toaster aria-label="Main" />
        <Toaster id="side" aria-label="Side" />
        <Count />
      </>,
    );
    act(() => {
      toast("Everywhere?");
      toast("Side only", { toasterId: "side" });
    });
    expect(screen.getByRole("region", { name: "Main" }).textContent).toContain("Everywhere?");
    expect(screen.getByRole("region", { name: "Main" }).textContent).not.toContain("Side only");
    const side = screen.getByRole("region", { name: "Side" });
    expect(side.id).toBe("side");
    expect(side.textContent).toBe("Side only");
    expect(screen.getByRole("status").textContent).toBe("2");
    act(() => toast.dismiss());
    expect(toast.getToasts()).toHaveLength(0);
    expect(toast.getHistory().map((t) => t.title)).toEqual(expect.arrayContaining(["Side only"]));
  });

  it("swipe toward the edge dismisses; not dismissible toasts stay", () => {
    render(<Toaster duration={10000} />);
    act(() => {
      toast("Keep", { dismissible: false });
      toast("Swipe me");
    });
    const swipe = (text: string, x: number, y: number) => {
      const item = screen.getByText(text).closest("li") as HTMLElement;
      const at = (type: string, cx: number, cy: number) =>
        new PointerEvent(type, { bubbles: true, clientX: cx, clientY: cy, pointerId: 1 });
      act(() => {
        item.dispatchEvent(at("pointerdown", 0, 0));
        item.dispatchEvent(at("pointermove", x / 2, y / 2));
        item.dispatchEvent(at("pointerup", x, y));
      });
    };
    // Swipeable toasts get a close button by default (the single-pointer path).
    expect(
      screen.getByText("Swipe me").closest("li")?.querySelector("[data-ok-toast-close]"),
    ).not.toBeNull();
    expect(
      screen.getByText("Keep").closest("li")?.querySelector("[data-ok-toast-close]"),
    ).toBeNull();
    swipe("Swipe me", 80, 0);
    swipe("Keep", 0, -80);
    expect(titles()).toEqual(["Keep"]);
  });
});
