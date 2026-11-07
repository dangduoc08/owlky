import { createToastStore } from "@owlky/core";
import { act, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { expectNoAxeViolations } from "../test-utils.js";
import { Toaster, toast, toastStore } from "./snackbar.js";

afterEach(() => {
  act(() => toast.dismiss());
});

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
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
    expect(getComputedStyle(saved).backgroundColor).toBe("rgb(28, 37, 46)");
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
    await wait(250);
    expect(titles()).toEqual([]);
    act(() => {
      toast("Two", { duration: 400 });
    });
    const region = screen.getByRole("region");
    await userEvent.hover(region, { force: true });
    await wait(600);
    expect(titles()).toEqual(["Two"]);
    await userEvent.unhover(region);
    await wait(600);
    expect(titles()).toEqual([]);
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
});
