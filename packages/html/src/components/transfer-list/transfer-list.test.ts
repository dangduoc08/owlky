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
import type { TransferListInstance } from "./transfer-list.js";

const snippets = Object.entries(
  import.meta.glob("./examples/*.html", { query: "?raw", import: "default", eager: true }),
) as [string, string][];
const snippet = (name: string) =>
  snippets.find(([path]) => path.includes(`/${name}-`))?.[1] as string;

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
const side = (host: Element, name: "left" | "right") =>
  [...host.querySelectorAll(`[data-ok-side="${name}"] [data-ok-value]`)].map((r) =>
    r.getAttribute("data-ok-value"),
  );
const move = (host: Element, direction: string) =>
  host.querySelector(`[data-ok-transfer-list-move="${direction}"]`) as HTMLButtonElement;
const check = (host: Element, value: string) =>
  host.querySelector(`[data-ok-value="${value}"] input`) as HTMLInputElement;

describe("transfer list snippets", () => {
  it("covers every story group", () => expect(snippets).toHaveLength(2));

  it.each(snippets)("%s: valid anatomy", (_, html) => {
    const host = mount(html);
    expectNamedButtons(host);
    const root = host.querySelector("[data-ok-transfer-list]") as HTMLElement;
    for (const name of ["left", "right"]) {
      const panel = root.querySelector(
        `[data-ok-transfer-list-panel][data-ok-side="${name}"]`,
      ) as HTMLElement;
      const area = panel.querySelector(":scope > [data-ok-scrollbar]") as HTMLElement;
      expect(area.getAttribute("aria-label")).toBeTruthy();
      for (const row of panel.querySelectorAll("[data-ok-list] > li")) {
        expect(row.hasAttribute("data-ok-value")).toBe(true);
        expect(row.querySelector("label input[type=checkbox]")).not.toBeNull();
      }
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

describe("transfer list runtime", () => {
  it("checking enables the move; moving unchecks; ok:transfer-list:change reports it", async () => {
    const host = mount(snippet("simple"));
    start();
    const root = host.querySelector("[data-ok-transfer-list]") as HTMLElement;
    const seen: unknown[] = [];
    root.addEventListener("ok:transfer-list:change", (e) => seen.push((e as CustomEvent).detail));
    expect(move(host, "right").disabled).toBe(true);
    await userEvent.click(check(host, "fruit-2"));
    expect(move(host, "right").disabled).toBe(false);
    await userEvent.click(move(host, "right"));
    expect(side(host, "left")).toEqual(["fruit-1", "fruit-3", "fruit-4"]);
    expect(side(host, "right")).toEqual(["fruit-5", "fruit-6", "fruit-7", "fruit-8", "fruit-2"]);
    expect(check(host, "fruit-2").checked).toBe(false);
    expect(seen.at(-1)).toMatchObject({
      direction: "right",
      left: ["fruit-1", "fruit-3", "fruit-4"],
    });
    await userEvent.click(move(host, "all-left"));
    expect(side(host, "right")).toEqual([]);
    expect(move(host, "all-left").disabled).toBe(true);
  });

  it("enhanced: select-all checks a side, shows mixed, counts follow", async () => {
    const host = mount(snippet("enhanced"));
    start();
    const header = host.querySelector(
      '[data-ok-side="left"] [data-ok-transfer-list-header]',
    ) as HTMLElement;
    const all = header.querySelector("input") as HTMLInputElement;
    const count = header.querySelector("[data-ok-transfer-list-count]") as HTMLElement;
    await userEvent.click(check(host, "fruit-1"));
    expect(all.indeterminate).toBe(true);
    expect(header.querySelector("[data-ok-checkbox]")?.hasAttribute("data-ok-indeterminate")).toBe(
      true,
    );
    expect(count.textContent).toBe("1/4 selected");
    await userEvent.click(all);
    expect(side(host, "left").every((v) => check(host, v as string).checked)).toBe(true);
    expect(count.textContent).toBe("4/4 selected");
    await userEvent.click(move(host, "right"));
    expect(side(host, "left")).toEqual([]);
    expect(all.disabled).toBe(true);
    expect(count.textContent).toBe("0/0 selected");
  });

  it("move is cancelable; the instance reads and moves; a custom count template", () => {
    const host = mount(
      snippet("enhanced").replace(
        "<div data-ok-transfer-list ",
        '<div data-ok-transfer-list data-ok-label-count="{checked} of {total}" ',
      ),
    );
    const rt = start();
    const root = host.querySelector("[data-ok-transfer-list]") as HTMLElement;
    const instance = rt.get<TransferListInstance>(root, "transfer-list") as TransferListInstance;
    expect(host.querySelector("[data-ok-transfer-list-count]")?.textContent).toBe("0 of 4");
    expect(instance.move("right")).toBe(false);
    root.addEventListener("ok:transfer-list:change", (e) => e.preventDefault(), { once: true });
    expect(instance.move("all-right")).toBe(false);
    expect(instance.value.left).toHaveLength(4);
    expect(instance.move("all-right")).toBe(true);
    expect(instance.value).toEqual({
      left: [],
      right: [
        "fruit-5",
        "fruit-6",
        "fruit-7",
        "fruit-8",
        "fruit-1",
        "fruit-2",
        "fruit-3",
        "fruit-4",
      ],
    });
  });

  it("tolerates partial markup: no lists, rows without checkboxes, headers without counts", async () => {
    const host = mount(`
      <div data-ok-transfer-list id="empty"></div>
      <div data-ok-transfer-list data-ok-variant="enhanced" id="partial">
        <section data-ok-transfer-list-panel data-ok-side="left">
          <div data-ok-transfer-list-header><input type="checkbox" aria-label="All"></div>
          <ul data-ok-list><li data-ok-value="x">X</li></ul>
        </section>
        <div data-ok-transfer-list-actions><button type="button" data-ok-transfer-list-move="all-right">Move</button></div>
        <section data-ok-transfer-list-panel data-ok-side="right">
          <div data-ok-transfer-list-header><input type="checkbox" aria-label="All right"></div>
          <ul data-ok-list><li data-ok-value="y"><input type="checkbox" aria-label="Y"></li></ul>
        </section>
      </div>`);
    const rt = start();
    const empty = rt.get<TransferListInstance>(
      host.querySelector("#empty"),
      "transfer-list",
    ) as TransferListInstance;
    expect(empty.value).toEqual({ left: [], right: [] });
    expect(empty.move("all-right")).toBe(false);
    const partial = host.querySelector("#partial") as HTMLElement;
    await userEvent.click(partial.querySelector('[aria-label="All right"]') as HTMLElement);
    expect((partial.querySelector('[aria-label="Y"]') as HTMLInputElement).checked).toBe(true);
    await userEvent.click(partial.querySelector('[aria-label="All"]') as HTMLElement);
    await userEvent.click(partial.querySelector("button") as HTMLElement);
    expect(rt.get<TransferListInstance>(partial, "transfer-list")?.value.right).toEqual(["y", "x"]);
  });

  it("disabled: every checkbox and button off; clicks elsewhere ignored", async () => {
    const host = mount(
      snippet("simple").replace(
        "<div data-ok-transfer-list ",
        "<div data-ok-transfer-list data-ok-disabled ",
      ),
    );
    start();
    expect([...host.querySelectorAll("button")].every((b) => b.disabled)).toBe(true);
    expect([...host.querySelectorAll("input")].every((i) => i.disabled)).toBe(true);
    await userEvent.click(host.querySelector("[data-ok-transfer-list-panel]") as HTMLElement);
    expect(side(host, "left")).toHaveLength(4);
  });
});
