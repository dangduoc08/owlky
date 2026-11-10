import { afterEach, describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { createRuntime } from "../../runtime/runtime.js";
import type { Runtime } from "../../runtime/types.js";
import {
  expectCspSafe,
  expectNamedButtons,
  expectNoAxeViolations,
  mount,
  resetPage,
  settle,
} from "../../test-utils.js";
import { components } from "../index.js";
import type { MobileStepperInstance } from "../mobile-stepper/mobile-stepper.js";
import type { StepperInstance } from "./stepper.js";

const snippets = Object.entries(
  import.meta.glob("./examples/*.html", { query: "?raw", import: "default", eager: true }),
) as [string, string][];

let runtime: Runtime | undefined;
afterEach(() => {
  runtime?.stop();
  runtime = undefined;
  resetPage();
});

const start = () => {
  runtime = createRuntime()
    .register(...components)
    .start();
  return runtime;
};

const step = (label: string, first = false) =>
  `<li data-ok-step>${first ? "" : '<div data-ok-step-connector aria-hidden="true"><span data-ok-step-connector-line></span></div>'}<span data-ok-step-label><span data-ok-step-icon aria-hidden="true"><span data-ok-step-icon-text>1</span></span><span data-ok-step-label-text><span data-ok-step-label-title>${label}</span></span></span></li>`;

const stepper = (id: string, active = "0") => `
  <ol id="${id}" data-ok-stepper data-ok-orientation="horizontal" data-ok-variant="standard" data-ok-active-step="${active}" aria-label="${id}">
    ${step("A", true)}${step("B")}${step("C")}
  </ol>
  <p data-ok-stepper-panel="${id}">Panel A</p>
  <p data-ok-stepper-panel="${id}" hidden>Panel B</p>
  <p data-ok-stepper-panel="${id}" hidden>Panel C</p>
  <p data-ok-stepper-panel="${id}" data-ok-stepper-panel-step="3" hidden>Done</p>
  <button type="button" data-ok-stepper-back="${id}">Back</button>
  <button type="button" data-ok-stepper-next="${id}">Next</button>
  <button type="button" data-ok-stepper-reset="${id}">Reset</button>`;

const states = (root: Element) =>
  [...root.querySelectorAll("[data-ok-step]")].map((s) =>
    ["active", "completed", "disabled"].filter((name) => s.hasAttribute(`data-ok-${name}`)).join(),
  );
const shown = (host: Element) =>
  [...host.querySelectorAll<HTMLElement>("[data-ok-stepper-panel]")]
    .filter((p) => !p.hidden)
    .map((p) => p.textContent);
const button = (host: Element, name: string) =>
  [...host.querySelectorAll<HTMLButtonElement>("button")].find(
    (b) => b.textContent?.trim() === name,
  ) as HTMLButtonElement;

describe("stepper snippets", () => {
  it("covers every story group", () => expect(snippets).toHaveLength(8));

  it.each(snippets)("%s: valid anatomy", (_, html) => {
    const host = mount(html);
    expectNamedButtons(host);
    for (const list of host.querySelectorAll("[data-ok-stepper]")) {
      expect(list.localName).toBe("ol");
      expect(list.getAttribute("aria-label")).toBeTruthy();
      [...list.children].forEach((li, index) => {
        expect(li.localName).toBe("li");
        expect(li.hasAttribute("data-ok-step")).toBe(true);
        expect(li.querySelector(":scope > [data-ok-step-connector]") !== null).toBe(index > 0);
        expect(li.querySelector("[data-ok-step-icon]")?.getAttribute("aria-hidden")).toBe("true");
      });
    }
    for (const trigger of host.querySelectorAll(
      "[data-ok-stepper-next], [data-ok-stepper-back], [data-ok-stepper-reset]",
    )) {
      const ids = (
        trigger.getAttribute("data-ok-stepper-next") ??
        trigger.getAttribute("data-ok-stepper-back") ??
        trigger.getAttribute("data-ok-stepper-reset") ??
        ""
      ).split(" ");
      for (const id of ids)
        expect(host.querySelector(`#${id}`)?.hasAttribute("data-ok-stepper")).toBe(true);
    }
  });

  it.each(snippets)("%s: CSP-safe", (_, html) => expectCspSafe(mount(html), html));

  it.each(snippets)("%s: no axe violations", async (_, html) => {
    const host = mount(html);
    start();
    await settle();
    await expectNoAxeViolations(host);
  });
});

describe("stepper runtime", () => {
  it("derives step states and panels from data-ok-active-step", () => {
    const host = mount(stepper("s1", "1"));
    start();
    const list = host.querySelector("ol") as HTMLElement;
    expect(states(list)).toEqual(["completed", "active", "disabled"]);
    expect(list.querySelectorAll("[aria-current]")).toHaveLength(1);
    expect(list.children[1]?.getAttribute("aria-current")).toBe("step");
    expect(shown(host)).toEqual(["Panel B"]);
    expect(button(host, "Back").disabled).toBe(false);
  });

  it("Next, Back and Reset move it; Back is disabled on the first step; the done panel", async () => {
    const host = mount(stepper("s2"));
    start();
    const list = host.querySelector("ol") as HTMLElement;
    const seen: unknown[] = [];
    list.addEventListener("ok:stepper:change", (event) => seen.push((event as CustomEvent).detail));
    expect(button(host, "Back").disabled).toBe(true);
    await userEvent.click(button(host, "Next"));
    expect(states(list)).toEqual(["completed", "active", "disabled"]);
    expect(seen).toEqual([{ activeStep: 1, previous: 0 }]);
    await userEvent.click(button(host, "Back"));
    expect(states(list)).toEqual(["active", "disabled", "disabled"]);
    for (let i = 0; i < 4; i++) await userEvent.click(button(host, "Next"));
    expect(list.dataset["okActiveStep"]).toBe("3");
    expect(states(list)).toEqual(["completed", "completed", "completed"]);
    expect(shown(host)).toEqual(["Done"]);
    // Past the end: nothing more fires.
    expect(seen).toHaveLength(5);
    await userEvent.click(button(host, "Reset"));
    expect(states(list)).toEqual(["active", "disabled", "disabled"]);
    expect(shown(host)).toEqual(["Panel A"]);
  });

  it("one trigger moves several steppers (space-separated ids)", async () => {
    const host = mount(
      `${stepper("a")}${stepper("b")}<button type="button" data-ok-stepper-next="a b missing">Both</button>`,
    );
    start();
    await userEvent.click(button(host, "Both"));
    expect(host.querySelector("#a")?.getAttribute("data-ok-active-step")).toBe("1");
    expect(host.querySelector("#b")?.getAttribute("data-ok-active-step")).toBe("1");
  });

  it("change is cancelable; the instance clamps; triggers that name nothing are ignored", async () => {
    const host = mount(
      `${stepper("c")}<button type="button" data-ok-stepper-next="">Empty</button><button type="button" data-ok-stepper-next="panel-x">Wrong</button><p id="panel-x">x</p>`,
    );
    const rt = start();
    const list = host.querySelector("ol") as HTMLElement;
    const instance = rt.get<StepperInstance>(list, "stepper") as StepperInstance;
    list.addEventListener("ok:stepper:change", (event) => event.preventDefault(), { once: true });
    expect(instance.go(1)).toBe(false);
    expect(instance.activeStep).toBe(0);
    expect(instance.go(0)).toBe(false);
    instance.setActiveStep(9);
    expect(instance.activeStep).toBe(3);
    instance.setActiveStep(-2);
    expect(instance.activeStep).toBe(0);
    await userEvent.click(button(host, "Empty"));
    await userEvent.click(button(host, "Wrong"));
    expect(instance.activeStep).toBe(0);
  });

  it("invalid active steps → 0; a stepper without an id has no panels", () => {
    const host = mount(
      `<ol data-ok-stepper data-ok-active-step="&quot;&gt;&lt;img src=x&gt;" aria-label="x">${step("A", true)}${step("B")}</ol><p data-ok-stepper-panel="">Loose</p>`,
    );
    start();
    expect(states(host.querySelector("ol") as Element)).toEqual(["active", "disabled"]);
    expect(host.querySelector("img")).toBeNull();
    expect(shown(host)).toEqual(["Loose"]);
  });

  it("React-owned steppers are left alone", async () => {
    const host = mount(
      stepper("r").replace("data-ok-stepper ", 'data-ok-stepper data-ok-runtime="off" '),
    );
    start();
    await userEvent.click(button(host, "Next"));
    expect(host.querySelector("ol")?.getAttribute("data-ok-active-step")).toBe("0");
  });
});

describe("mobile stepper runtime", () => {
  const mobile = (variant: string, attrs = "", id = "m") => `
    <div id="${id}" data-ok-mobile-stepper data-ok-variant="${variant}" data-ok-position="static" data-ok-steps="3" data-ok-active-step="0" ${attrs}>
      <button type="button" data-ok-mobile-stepper-back>Back</button>
      ${variant === "text" ? "<span data-ok-mobile-stepper-text>1 / 3</span>" : ""}
      ${variant === "dots" ? '<span data-ok-mobile-stepper-dots role="img" aria-label="Step 1 of 3"><span data-ok-mobile-stepper-dot data-ok-active></span></span>' : ""}
      ${variant === "progress" ? '<span role="progressbar" aria-label="Step 1 of 3" data-ok-linear-progress data-ok-mobile-stepper-progress data-ok-variant="determinate" data-ok-color="inherit" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"><span data-ok-linear-progress-bar="1"></span></span>' : ""}
      <button type="button" data-ok-mobile-stepper-next>Next</button>
    </div>
    <p data-ok-mobile-stepper-panel="${id}">One</p><p data-ok-mobile-stepper-panel="${id}" hidden>Two</p><p data-ok-mobile-stepper-panel="${id}" hidden>Three</p>`;

  it("dots: fills the dots, moves with Back / Next, disables them at the ends", async () => {
    const host = mount(mobile("dots"));
    start();
    const dots = host.querySelector("[data-ok-mobile-stepper-dots]") as HTMLElement;
    expect(dots.children).toHaveLength(3);
    const root = host.querySelector("[data-ok-mobile-stepper]") as HTMLElement;
    const seen: unknown[] = [];
    root.addEventListener("ok:mobile-stepper:change", (e) => seen.push((e as CustomEvent).detail));
    expect(button(host, "Back").disabled).toBe(true);
    await userEvent.click(button(host, "Next"));
    expect(dots.getAttribute("aria-label")).toBe("Step 2 of 3");
    expect([...dots.children].map((d) => d.hasAttribute("data-ok-active"))).toEqual([
      false,
      true,
      false,
    ]);
    expect(seen).toEqual([{ activeStep: 1, previous: 0 }]);
    await userEvent.click(button(host, "Next"));
    expect(button(host, "Next").disabled).toBe(true);
    expect(
      [...host.querySelectorAll<HTMLElement>("[data-ok-mobile-stepper-panel]")].map(
        (p) => p.hidden,
      ),
    ).toEqual([true, true, false]);
    await userEvent.click(button(host, "Back"));
    expect(root.dataset["okActiveStep"]).toBe("1");
    await expectNoAxeViolations(host);
  });

  it("text and progress variants follow the step; a label template", async () => {
    const host = mount(
      mobile("text", "", "t") +
        mobile("progress", 'data-ok-label-step="Étape {step} sur {steps}"', "p"),
    );
    start();
    const [text, progress] = host.querySelectorAll<HTMLElement>(
      "[data-ok-mobile-stepper]",
    ) as unknown as HTMLElement[];
    await userEvent.click(button(text as HTMLElement, "Next"));
    expect(text?.querySelector("[data-ok-mobile-stepper-text]")?.textContent).toBe("2 / 3");
    const next = [...(progress as HTMLElement).querySelectorAll("button")][1] as HTMLElement;
    await userEvent.click(next);
    const bar = progress?.querySelector("[role=progressbar]") as HTMLElement;
    expect(bar.getAttribute("aria-valuenow")).toBe("50");
    expect(bar.getAttribute("aria-label")).toBe("Étape 2 sur 3");
  });

  it("external triggers name the stepper; dots shrink to the step count; the instance clamps", async () => {
    const host = mount(
      `${mobile("dots").replace('data-ok-steps="3"', 'data-ok-steps="2"')}<button type="button" data-ok-mobile-stepper-next="m">Outside</button><button type="button" data-ok-mobile-stepper-next="nope">Nope</button>`,
    );
    const rt = start();
    const root = host.querySelector("[data-ok-mobile-stepper]") as HTMLElement;
    const dots = root.querySelector("[data-ok-mobile-stepper-dots]") as HTMLElement;
    expect(dots.children).toHaveLength(2);
    await userEvent.click(button(host, "Outside"));
    expect(root.dataset["okActiveStep"]).toBe("1");
    expect(button(host, "Outside").disabled).toBe(true);
    await userEvent.click(button(host, "Nope"));
    const instance = rt.get<MobileStepperInstance>(root, "mobile-stepper") as MobileStepperInstance;
    instance.setActiveStep(-5);
    expect(instance.activeStep).toBe(0);
    root.addEventListener("ok:mobile-stepper:change", (e) => e.preventDefault(), { once: true });
    expect(instance.go(1)).toBe(false);
    expect(instance.go(0)).toBe(false);
    dots.remove();
    instance.setActiveStep(9);
    expect(instance.activeStep).toBe(1);
  });

  it("triggers that name a React-owned stepper do nothing", async () => {
    const host = mount(
      `${mobile("dots", 'data-ok-runtime="off"', "owned")}<button type="button" data-ok-mobile-stepper-next="owned">Owned</button>`,
    );
    start();
    await userEvent.click(button(host, "Owned"));
    expect(host.querySelector("#owned")?.getAttribute("data-ok-active-step")).toBe("0");
  });

  it("invalid step counts fall back to one step", () => {
    const host = mount(
      mobile("text").replace('data-ok-steps="3"', 'data-ok-steps="x"').replace(' id="m"', ""),
    );
    start();
    expect(host.querySelector("[data-ok-mobile-stepper-text]")?.textContent).toBe("1 / 1");
  });
});

describe("non-linear steppers", () => {
  const buttons = (label: string, attrs = "") =>
    `<li data-ok-step ${attrs}><button type="button" data-ok-step-button><span data-ok-step-label><span data-ok-step-label-text><span data-ok-step-label-title>${label}</span></span></span></button><div data-ok-step-content data-ok-collapse hidden>Content ${label}</div></li>`;

  it("step buttons move to their step; completed and disabled stay as written; expanded content stays", async () => {
    const host = mount(`
      <ol id="n" data-ok-stepper data-ok-orientation="vertical" data-ok-active-step="0" data-ok-non-linear aria-label="N">
        ${buttons("A")}${buttons("B", "data-ok-completed data-ok-expanded")}${buttons("C", "data-ok-disabled")}
      </ol>`);
    start();
    const root = host.querySelector("#n") as HTMLElement;
    expect(states(root)).toEqual(["active", "completed", "disabled"]);
    const [a, b, c] = [...host.querySelectorAll<HTMLButtonElement>("[data-ok-step-button]")];
    expect(c?.disabled).toBe(true);
    const content = (index: number) =>
      host.querySelectorAll<HTMLElement>("[data-ok-step-content]")[index] as HTMLElement;
    expect(content(1).hidden).toBe(false);
    await userEvent.click(b as HTMLElement);
    expect(states(root)).toEqual(["", "active,completed", "disabled"]);
    expect(content(0).hidden).toBe(true);
    (a as HTMLButtonElement).click();
    expect(root.getAttribute("data-ok-active-step")).toBe("0");
    expect(content(1).hidden).toBe(false);
    // Linear steppers still derive every state; their buttons follow `disabled`.
    root.removeAttribute("data-ok-non-linear");
    (a as HTMLButtonElement).click();
    const instance = runtime?.get<StepperInstance>(root, "stepper");
    instance?.go(1);
    expect(states(root)).toEqual(["completed", "active", "disabled"]);
    expect(c?.disabled).toBe(true);
  });
});
