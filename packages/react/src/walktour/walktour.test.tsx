import type { WalktourApi } from "@owlky/core";
import { act, render, screen } from "@testing-library/react";
import { createRef, type RefObject, StrictMode, useRef, useState } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { expectNoAxeViolations } from "../test-utils.js";
import { Walktour, type WalktourProps, type WalktourStep } from "./walktour.js";

const open = () => document.querySelector<HTMLElement>("[data-ok-walktour-step][data-ok-open]");
const openTitle = () => open()?.querySelector("[data-ok-walktour-title]")?.textContent ?? null;
const button = (action: string) =>
  open()?.querySelector(`[data-ok-walktour-action="${action}"]`) as HTMLButtonElement;
const beacon = () => document.querySelector("[data-ok-walktour-beacon]") as HTMLButtonElement;
/** DOM clicks: the overlay covers the page (pointer clicks can't reach it), the beacon pulses. */
const press = (element: HTMLElement) =>
  act(() => {
    element.click();
  });
/** Real keys; the state set from the controller's listeners flushes in the act() after. */
const keys = async (text: string) => {
  await userEvent.keyboard(text);
  await act(async () => {});
};

function Page({ steps, ...props }: Partial<WalktourProps> & { steps?: WalktourStep[] }) {
  const second = useRef<HTMLDivElement>(null);
  const all: WalktourStep[] = steps ?? [
    { target: "#first", title: "First", content: "One" },
    { target: second, title: "Second", content: "Two", placement: "top" },
    { target: () => document.getElementById("third"), title: "Third", content: "Three" },
  ];
  return (
    <>
      <button type="button" id="outside">
        Outside
      </button>
      <div id="first">First card</div>
      <div ref={second}>Second card</div>
      <div id="third">Third card</div>
      <Walktour id="tour" steps={all} {...props} />
    </>
  );
}

function Controlled({
  refuse = false,
  onStepChange,
}: {
  refuse?: boolean;
  onStepChange: (index: number, details: unknown) => void;
}) {
  const [index, setIndex] = useState(1);
  return (
    <>
      <button type="button" onClick={() => setIndex(0)}>
        Go first
      </button>
      <button type="button" onClick={() => setIndex(9)}>
        Go nowhere
      </button>
      <Page
        run
        continuous
        disableBeacon
        stepIndex={index}
        onStepChange={(next, details) => {
          onStepChange(next, details);
          if (!refuse) setIndex(next);
        }}
      />
    </>
  );
}

function Paused() {
  const [run, setRun] = useState(false);
  const [index, setIndex] = useState(0);
  return (
    <>
      <button type="button" onClick={() => setIndex(2)}>
        Third
      </button>
      <button type="button" onClick={() => setRun(true)}>
        Run
      </button>
      <Page run={run} stepIndex={index} disableBeacon continuous />
    </>
  );
}

function Runner({ api }: { api: RefObject<WalktourApi | null> }) {
  const [run, setRun] = useState(true);
  return (
    <>
      <button type="button" onClick={() => setRun((value) => !value)}>
        Toggle
      </button>
      <Page run={run} apiRef={api} continuous />
    </>
  );
}

describe("Walktour", () => {
  it("renders the anatomy: overlay, beacon, one dialog per step, live region", () => {
    const { container } = render(<Page continuous showProgress />);
    const root = container.querySelector("[data-ok-walktour]") as HTMLElement;
    expect(root.getAttribute("data-ok-runtime")).toBe("off");
    expect(root.hasAttribute("data-ok-continuous")).toBe(true);
    expect(root.hasAttribute("data-ok-run")).toBe(false);
    expect(root.querySelector("[data-ok-backdrop][data-ok-walktour-overlay]")).not.toBeNull();
    expect(beacon().hidden).toBe(true);
    const steps = root.querySelectorAll("[data-ok-walktour-step]");
    expect(steps).toHaveLength(3);
    expect(steps[0]?.getAttribute("data-ok-target")).toBe("#first");
    expect(steps[1]?.hasAttribute("data-ok-target")).toBe(false);
    expect(steps[1]?.getAttribute("data-ok-placement")).toBe("top");
    expect(steps[0]?.getAttribute("aria-labelledby")).toBe("tour-step-1-title");
    expect(steps[0]?.getAttribute("aria-describedby")).toBe("tour-step-1-content");
    expect(steps[0]?.querySelector('[data-ok-walktour-action="primary"]')?.textContent).toBe(
      "Next (1/3)",
    );
    expect(steps[2]?.querySelector('[data-ok-walktour-action="primary"]')?.textContent).toBe(
      "Last",
    );
    expect(
      steps[2]?.querySelector('[data-ok-walktour-action="primary"]')?.getAttribute("data-ok-color"),
    ).toBe("primary");
    expect(
      steps[1]?.querySelector("[data-ok-linear-progress]")?.getAttribute("aria-valuenow"),
    ).toBe("67");
    expect(open()).toBeNull();
  });

  it("runs a continuous tour: Next, Back, the last step, focus return", async () => {
    const onStepChange = vi.fn();
    const onStatusChange = vi.fn();
    const onEvent = vi.fn();
    (document.body as HTMLElement).focus();
    render(
      <Page
        run
        continuous
        disableBeacon
        onStepChange={onStepChange}
        onStatusChange={onStatusChange}
        onEvent={onEvent}
      />,
    );
    expect(openTitle()).toBe("First");
    expect(document.activeElement).toBe(button("primary"));
    expect(onStatusChange).toHaveBeenCalledWith("running", { action: "start", index: 0 });
    expect(onEvent.mock.calls.map(([type]) => type)).toEqual([
      "tour:start",
      "step:before",
      "tooltip",
      "tour:status",
    ]);
    press(button("primary"));
    expect(openTitle()).toBe("Second");
    expect(onStepChange).toHaveBeenLastCalledWith(1, {
      action: "next",
      origin: "primary",
      status: "running",
      lifecycle: "tooltip",
    });
    press(button("back"));
    expect(openTitle()).toBe("First");
    press(button("primary"));
    press(button("primary"));
    expect(openTitle()).toBe("Third");
    press(button("primary"));
    expect(open()).toBeNull();
    expect(onStatusChange).toHaveBeenLastCalledWith("finished", { action: "next", index: 2 });
    expect(onEvent).toHaveBeenLastCalledWith(
      "tour:status",
      expect.objectContaining({ status: "finished", size: 3 }),
    );
  });

  it("shows beacons in a non-continuous tour: Close moves on to the next beacon", async () => {
    render(<Page run showSkipButton />);
    expect(open()).toBeNull();
    expect(beacon().hidden).toBe(false);
    expect(beacon().getAttribute("aria-label")).toBe("Open the dialog");
    press(beacon());
    expect(openTitle()).toBe("First");
    // The progress is in the markup, hidden without showProgress.
    expect(button("primary").textContent).toBe("Close (1/3)");
    expect(
      (button("primary").querySelector("[data-ok-walktour-progress]") as HTMLElement).hidden,
    ).toBe(true);
    expect(button("skip").hidden).toBe(false);
    press(button("primary"));
    expect(open()).toBeNull();
    expect(beacon().hidden).toBe(false);
    expect(document.activeElement).toBe(beacon());
    await keys("{Enter}");
    expect(openTitle()).toBe("Second");
    press(button("skip"));
    expect(open()).toBeNull();
    expect(beacon().hidden).toBe(true);
  });

  it("closes with Escape and the overlay unless turned off", async () => {
    const second = { target: "#first", title: "Second", content: "Two" };
    render(
      <Page
        run
        continuous
        steps={[
          { target: "#first", title: "First", content: "One", disableBeacon: true },
          second,
          { ...second, title: "Third" },
        ]}
      />,
    );
    expect(openTitle()).toBe("First");
    await keys("{Escape}");
    // Escape closes the step: the next one shows its beacon.
    expect(open()).toBeNull();
    press(beacon());
    expect(openTitle()).toBe("Second");
    const mask = document.querySelector("[data-ok-walktour-mask]") as SVGPathElement;
    act(() => {
      mask.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(open()).toBeNull();
  });

  it("lets steps override the tour's options", async () => {
    render(
      <Page
        run
        continuous
        disableBeacon
        steps={[
          { target: "#first", content: "One", disableCloseOnEsc: true, hideCloseButton: true },
          { target: "#third", title: "Third", content: "Three", continuous: false },
        ]}
      />,
    );
    // No title: named by the step count.
    expect(open()?.getAttribute("aria-label")).toBe("Step 1 of 2");
    expect(button("close").hidden).toBe(true);
    await keys("{Escape}");
    expect(open()).not.toBeNull();
    press(button("primary"));
    expect(openTitle()).toBe("Third");
  });

  it("is controlled with stepIndex", async () => {
    const onStepChange = vi.fn();
    const { unmount } = render(<Controlled onStepChange={onStepChange} />);
    expect(openTitle()).toBe("Second");
    press(button("primary"));
    expect(openTitle()).toBe("Third");
    press(screen.getByRole("button", { name: "Go first", hidden: true }));
    expect(openTitle()).toBe("First");
    // A step that doesn't exist shows nothing.
    press(screen.getByRole("button", { name: "Go nowhere", hidden: true }));
    expect(open()).toBeNull();
    unmount();
    render(<Controlled refuse onStepChange={onStepChange} />);
    press(button("primary"));
    expect(onStepChange).toHaveBeenLastCalledWith(2, expect.objectContaining({ action: "next" }));
    expect(openTitle()).toBe("Second");
  });

  it("shows a controlled step that changes while the tour isn't running", async () => {
    render(<Paused />);
    press(screen.getByRole("button", { name: "Third" }));
    press(screen.getByRole("button", { name: "Run" }));
    expect(openTitle()).toBe("Third");
  });

  it("pauses and resumes with run, and gives an API", async () => {
    const api = createRef<WalktourApi>();
    render(<Runner api={api} />);
    expect(open()).toBeNull();
    act(() => api.current?.open());
    expect(openTitle()).toBe("First");
    act(() => api.current?.next());
    expect(openTitle()).toBe("Second");
    press(screen.getByRole("button", { name: "Toggle", hidden: true }));
    expect(open()).toBeNull();
    expect(api.current?.state.status).toBe("paused");
    press(screen.getByRole("button", { name: "Toggle", hidden: true }));
    // Resuming shows the step's beacon again.
    expect(beacon().hidden).toBe(false);
    act(() => api.current?.open());
    expect(openTitle()).toBe("Second");
    act(() => api.current?.go(2));
    expect(openTitle()).toBe("Third");
    act(() => api.current?.prev());
    expect(openTitle()).toBe("Second");
    act(() => api.current?.close());
    expect(open()).toBeNull();
    act(() => api.current?.open());
    expect(openTitle()).toBe("Third");
    act(() => api.current?.stop());
    act(() => api.current?.start());
    expect(api.current?.state).toMatchObject({ index: 2, lifecycle: "beacon" });
    act(() => api.current?.skip());
    expect(api.current?.state.status).toBe("skipped");
    act(() => api.current?.reset(true));
    expect(api.current?.state).toMatchObject({ status: "running", index: 0 });
    act(() => api.current?.reset());
    expect(api.current?.state.status).toBe("idle");
  });

  it("skips steps whose target is missing and reports it", () => {
    const onEvent = vi.fn();
    render(
      <Page
        run
        continuous
        disableBeacon
        onEvent={onEvent}
        steps={[
          { target: "#missing", title: "Missing", content: "Gone" },
          { target: null, title: "Null", content: "Gone" },
          { target: () => undefined, title: "Undefined", content: "Gone" },
          { target: "#third", title: "Third", content: "Three" },
        ]}
      />,
    );
    expect(openTitle()).toBe("Third");
    expect(
      onEvent.mock.calls
        .filter(([type]) => type === "error:target-not-found")
        .map(([, d]) => d.index),
    ).toEqual([0, 1, 2]);
  });

  it("gets ids of its own without an id", () => {
    render(<Walktour steps={[{ target: "#a", title: "A", content: "A" }]} />);
    const step = document.querySelector("[data-ok-walktour-step]") as HTMLElement;
    const title = document.getElementById(step.getAttribute("aria-labelledby") as string);
    expect(title?.textContent).toBe("A");
    expect(document.querySelector("[data-ok-walktour]")?.hasAttribute("id")).toBe(false);
  });

  it("uses the locale, per tour and per step", () => {
    render(
      <Page
        locale={{
          next: "Suivant",
          last: "Terminé",
          progress: "{current} sur {total}",
          open: "Ouvrir",
        }}
        continuous
        steps={[
          { target: "#first", title: "A", content: "One", locale: { next: "Continuer" } },
          { target: "#third", title: "B", content: "Two" },
        ]}
      />,
    );
    const primaries = document.querySelectorAll('[data-ok-walktour-action="primary"]');
    expect(primaries[0]?.textContent).toBe("Continuer 1 sur 2");
    expect(primaries[1]?.textContent).toBe("Terminé");
    expect(beacon().getAttribute("aria-label")).toBe("Ouvrir");
  });

  it("passes stepProps and rest props through", () => {
    render(
      <Page
        className="my-tour"
        steps={[
          {
            target: "#first",
            title: "Dark",
            content: "One",
            width: 480,
            stepProps: { "data-ok-theme": "dark" } as Record<string, string>,
          },
        ]}
      />,
    );
    const step = document.querySelector("[data-ok-walktour-step]") as HTMLElement;
    expect(step.getAttribute("data-ok-theme")).toBe("dark");
    expect(step.getAttribute("data-ok-width")).toBe("480");
    expect(document.querySelector("[data-ok-walktour]")?.classList.contains("my-tour")).toBe(true);
  });

  it("has no axe violations while a step is open (light and dark)", async () => {
    render(<Page run continuous showProgress showSkipButton disableBeacon />);
    press(button("primary"));
    await expectNoAxeViolations();
    document.documentElement.setAttribute("data-ok-theme", "dark");
    await expectNoAxeViolations();
    document.documentElement.removeAttribute("data-ok-theme");
  });

  it("renders on the server like on the client, works in StrictMode and unmounts cleanly", () => {
    const html = renderToString(<Walktour id="tour" steps={[{ target: "#a", content: "A" }]} />);
    expect(html).toContain("data-ok-walktour-step");
    const { unmount } = render(
      <StrictMode>
        <Page run continuous disableBeacon />
      </StrictMode>,
    );
    expect(openTitle()).toBe("First");
    unmount();
    expect(open()).toBeNull();
  });
});
