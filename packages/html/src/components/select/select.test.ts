import { afterEach, describe, expect, it, vi } from "vitest";
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
import type { TablePaginationInstance } from "../table-pagination/table-pagination.js";
import type { SelectInstance } from "./select.js";

const snippets = Object.entries(
  import.meta.glob("./examples/*.html", { query: "?raw", import: "default", eager: true }),
) as [string, string][];
const snippet = (name: string) =>
  snippets.find(([path]) => path.endsWith(`/${name}.html`))?.[1] as string;

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
const trigger = (host: Element, id: string) => host.querySelector(`#${id}`) as HTMLElement;
const rootOf = (host: Element, id: string) =>
  trigger(host, id).closest("[data-ok-select]") as HTMLElement;
const instance = (rt: Runtime, host: Element, id: string) =>
  rt.get<SelectInstance>(rootOf(host, id), "select") as SelectInstance;
const option = (host: Element, id: string, text: string) =>
  [...host.querySelectorAll<HTMLElement>(`#${id}-listbox [role="option"]`)].find(
    (o) => o.textContent?.trim() === text,
  ) as HTMLElement;
const paperOpen = (host: Element, id: string) =>
  host.querySelector(`#${id}-menu`)?.hasAttribute("data-ok-open");

describe("select snippets", () => {
  it("covers every story group", () => expect(snippets).toHaveLength(15));

  it.each(snippets)("%s: valid anatomy, CSP-safe", (_, html) => {
    const host = mount(html);
    expectNamedButtons(host);
    expectCspSafe(host, html);
    for (const root of host.querySelectorAll("[data-ok-select]")) {
      const native = root.querySelector(":scope > select");
      if (native) continue;
      const display = root.querySelector(":scope > [data-ok-select-display]") as HTMLElement;
      expect(display.getAttribute("role")).toBe("combobox");
      const listbox = host.querySelector(
        `#${display.getAttribute("aria-controls")}`,
      ) as HTMLElement;
      expect(listbox.getAttribute("role")).toBe("listbox");
      expect(root.querySelector(":scope > [data-ok-select-input]")).not.toBeNull();
    }
  });

  it.each(snippets)("%s: no axe violations", async (_, html) => {
    const host = mount(html);
    start();
    await expectNoAxeViolations(host);
  });
});

describe("select runtime", () => {
  it("opens on the selected option, picks with Enter, writes the value and closes", async () => {
    const host = mount(snippet("other-group"));
    const rt = start();
    const events: string[] = [];
    const root = rootOf(host, "select-error");
    for (const type of ["open", "close", "change"])
      root.addEventListener(`ok:select:${type}`, (e) =>
        events.push(`${type}:${JSON.stringify((e as CustomEvent).detail ?? null)}`),
      );
    const box = trigger(host, "select-error");
    box.focus();
    await userEvent.keyboard("{ArrowDown}");
    expect(paperOpen(host, "select-error")).toBe(true);
    expect(box.getAttribute("aria-expanded")).toBe("true");
    expect(document.activeElement).toBe(option(host, "select-error", "Ten"));
    await userEvent.keyboard("{ArrowDown}{Enter}");
    expect(box.textContent).toBe("Twenty");
    expect(option(host, "select-error", "Twenty").getAttribute("aria-selected")).toBe("true");
    expect(option(host, "select-error", "Twenty").hasAttribute("data-ok-selected")).toBe(true);
    expect(option(host, "select-error", "Ten").getAttribute("aria-selected")).toBe("false");
    expect((root.querySelector("[data-ok-select-input]") as HTMLInputElement).value).toBe("20");
    expect(paperOpen(host, "select-error")).toBe(false);
    expect(box.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(box);
    expect(events).toEqual(["open:null", 'change:{"value":"20"}', 'close:{"reason":"select"}']);
    expect(instance(rt, host, "select-error").value).toBe("20");
  });

  it("adornments in the field box: the start one before the value, the end one before the arrow", async () => {
    const host = mount(snippet("other-group"));
    const root = rootOf(host, "select-error");
    const adornment = (position: string, text: string) => {
      const span = document.createElement("span");
      span.setAttribute("data-ok-text-field-adornment", position);
      span.textContent = text;
      return span;
    };
    const box = trigger(host, "select-error");
    root.insertBefore(adornment("start", "$"), box);
    root.querySelector("[data-ok-select-icon]")?.after(adornment("end", "kg"));
    start();
    const r = (selector: string) =>
      (root.querySelector(selector) as HTMLElement).getBoundingClientRect();
    expect(r('[data-ok-text-field-adornment="start"]').right).toBeLessThanOrEqual(
      box.getBoundingClientRect().left + 0.5,
    );
    expect(r('[data-ok-text-field-adornment="end"]').left).toBeGreaterThanOrEqual(
      box.getBoundingClientRect().right - 0.5,
    );
    expect(r('[data-ok-text-field-adornment="end"]').right).toBeLessThanOrEqual(
      r("[data-ok-select-icon]").left + 0.5,
    );
    await userEvent.click(box);
    expect(paperOpen(host, "select-error")).toBe(true);
    await userEvent.click(option(host, "select-error", "Twenty"));
    expect(box.textContent).toBe("Twenty");
    await expectNoAxeViolations(host);
  });

  it("the empty option clears the field; the label floats only with a value", async () => {
    const host = mount(snippet("small-group"));
    start();
    const box = trigger(host, "select-small");
    await userEvent.click(box);
    await userEvent.click(option(host, "select-small", "Thirty"));
    expect(box.textContent).toBe("Thirty");
    await userEvent.click(box);
    await userEvent.click(option(host, "select-small", "None"));
    expect(box.textContent).toBe("");
    const input = rootOf(host, "select-small").querySelector("input") as HTMLInputElement;
    expect(input.value).toBe("");
    expect(input.matches(":placeholder-shown")).toBe(true);
  });

  it("displayEmpty shows the empty option's content", async () => {
    const host = mount(snippet("helper-group"));
    start();
    const box = trigger(host, "select-empty");
    expect(box.textContent).toBe("None");
    await userEvent.click(box);
    await userEvent.click(option(host, "select-empty", "Twenty"));
    await userEvent.click(box);
    await userEvent.click(option(host, "select-empty", "None"));
    expect(box.querySelector("em")?.textContent).toBe("None");
  });

  it("Escape, Tab and a press on the trigger close; outside presses too", async () => {
    const host = mount(snippet("basic-group"));
    const rt = start();
    const reasons: string[] = [];
    rootOf(host, "select-basic").addEventListener("ok:select:close", (e) =>
      reasons.push((e as CustomEvent<{ reason: string }>).detail.reason),
    );
    const box = trigger(host, "select-basic");
    await userEvent.click(box);
    await userEvent.keyboard("{Escape}");
    expect(document.activeElement).toBe(box);
    await userEvent.click(box);
    await userEvent.keyboard("{Tab}");
    expect(document.activeElement).toBe(box);
    await userEvent.click(box);
    await userEvent.click(box);
    await userEvent.click(box);
    await userEvent.click(document.body, { position: { x: 1, y: 1 } });
    expect(reasons).toEqual(["escape", "tab", "toggle", "backdrop"]);
    const api = instance(rt, host, "select-basic");
    expect(api.open()).toBe(true);
    expect(api.open()).toBe(true);
    expect(api.isOpen).toBe(true);
    expect(api.close()).toBe(true);
    expect(reasons.at(-1)).toBe("api");
  });

  it("typeahead, Home and End open on a matching option", async () => {
    const host = mount(snippet("basic-group"));
    start();
    const box = trigger(host, "select-basic");
    box.focus();
    await userEvent.keyboard("t");
    expect(document.activeElement).toBe(option(host, "select-basic", "Ten"));
    await userEvent.keyboard("{Escape}{End}");
    expect(document.activeElement).toBe(option(host, "select-basic", "Thirty"));
    await userEvent.keyboard("{Home}");
    expect(document.activeElement).toBe(option(host, "select-basic", "Ten"));
  });

  it("a refused change keeps the value and the list open", async () => {
    const host = mount(snippet("basic-group"));
    start();
    rootOf(host, "select-basic").addEventListener("ok:select:change", (e) => e.preventDefault());
    const box = trigger(host, "select-basic");
    await userEvent.click(box);
    await userEvent.click(option(host, "select-basic", "Twenty"));
    expect(box.textContent).toBe("");
    expect(paperOpen(host, "select-basic")).toBe(true);
  });

  it("disabled and read-only selects don't open", async () => {
    const host = mount(snippet("other-group"));
    start();
    trigger(host, "select-disabled").click();
    trigger(host, "select-readonly").click();
    expect(paperOpen(host, "select-disabled")).toBe(false);
    expect(paperOpen(host, "select-readonly")).toBe(false);
  });

  it("multiple: toggles, stays open, joins the texts", async () => {
    const host = mount(snippet("multiple-group"));
    const rt = start();
    const box = trigger(host, "select-multiple");
    expect(box.textContent).toBe("Oliver Hansen, April Tucker");
    await userEvent.click(box);
    await userEvent.click(option(host, "select-multiple", "Van Henry"));
    expect(paperOpen(host, "select-multiple")).toBe(true);
    await userEvent.click(option(host, "select-multiple", "Oliver Hansen"));
    expect(box.textContent).toBe("April Tucker, Van Henry");
    expect(instance(rt, host, "select-multiple").value).toEqual(["April Tucker", "Van Henry"]);
    instance(rt, host, "select-multiple").setValue([]);
    expect(box.textContent).toBe("");
    const paper = host.querySelector<HTMLElement>("#select-multiple-menu") as HTMLElement;
    expect(paper.style.getPropertyValue("--_ok-select-width")).toMatch(/px$/);
  });

  it("chips from the template; a placeholder for an empty value; checkboxes follow", async () => {
    const host = mount(
      snippet("chip-group") + snippet("placeholder-group") + snippet("checkmarks-group"),
    );
    const rt = start();
    const chips = trigger(host, "select-chip");
    await userEvent.click(chips);
    await userEvent.click(option(host, "select-chip", "Kelly Snyder"));
    await userEvent.keyboard("{Escape}");
    expect(
      [...chips.querySelectorAll("[data-ok-chip-label]")].map((label) => label.textContent),
    ).toEqual(["Oliver Hansen", "Van Henry", "Kelly Snyder"]);
    const placeholder = trigger(host, "select-placeholder");
    expect(placeholder.textContent).toBe("Placeholder");
    instance(rt, host, "select-placeholder").setValue(["Van Henry", "Kelly Snyder"]);
    expect(placeholder.textContent).toBe("Van Henry, Kelly Snyder");
    instance(rt, host, "select-placeholder").setValue([]);
    expect(placeholder.querySelector("em")?.textContent).toBe("Placeholder");
    const marks = trigger(host, "select-checkmarks");
    await userEvent.click(marks);
    await userEvent.click(option(host, "select-checkmarks", "April Tucker"));
    const box = option(host, "select-checkmarks", "April Tucker").querySelector("input");
    expect(box?.checked).toBe(true);
    expect(marks.textContent).toBe("Van Henry, April Tucker");
  });

  it("autoWidth leaves the menu's width to its options", async () => {
    const host = mount(snippet("auto-width-group"));
    start();
    await userEvent.click(trigger(host, "select-autowidth"));
    const paper = host.querySelector<HTMLElement>("#select-autowidth-menu") as HTMLElement;
    expect(paper.style.getPropertyValue("--_ok-select-width")).toBe("");
  });

  it("a button opens the select (data-ok-select-open)", async () => {
    const host = mount(snippet("open-group"));
    start();
    await userEvent.click(host.querySelector("#select-open-button") as HTMLElement);
    expect(paperOpen(host, "select-open")).toBe(true);
    expect(document.activeElement).toBe(option(host, "select-open", "None"));
    const missing = mount('<button type="button" data-ok-select-open="nope">Open</button>');
    (missing.querySelector("button") as HTMLElement).click();
  });

  it("grouping: subheaders are skipped; a select inside a dialog works", async () => {
    const host = mount(snippet("grouping-group") + snippet("dialog-group"));
    start();
    const box = trigger(host, "select-grouped");
    box.focus();
    await userEvent.keyboard("{ArrowDown}{ArrowDown}");
    expect(document.activeElement).toBe(option(host, "select-grouped", "Option 1"));
    await userEvent.keyboard("{Escape}");
    await userEvent.click(
      host.querySelector('[data-ok-dialog-open="select-dialog"]') as HTMLElement,
    );
    await settle();
    const inDialog = trigger(host, "select-dialog-age");
    await userEvent.click(inDialog);
    await userEvent.click(option(host, "select-dialog-age", "Twenty"));
    expect(inDialog.textContent).toBe("Twenty");
  });

  it("native selects need no runtime; the instance reads and writes them", () => {
    const host = mount(snippet("native-group") + snippet("native-multiple-group"));
    const rt = start();
    const single = rt.get<SelectInstance>(
      host.querySelector("#select-native")?.closest("[data-ok-select]") ?? null,
      "select",
    ) as SelectInstance;
    expect(single.value).toBe("30");
    single.setValue("10");
    expect(single.value).toBe("10");
    expect(single.isOpen).toBe(false);
    expect(single.open()).toBe(false);
    expect(single.close()).toBe(true);
    const many = rt.get<SelectInstance>(
      host.querySelector("#select-multiple-native")?.closest("[data-ok-select]") ?? null,
      "select",
    ) as SelectInstance;
    many.setValue(["Van Henry", "Kelly Snyder"]);
    expect(many.value).toEqual(["Van Henry", "Kelly Snyder"]);
    const empty = mount("<div data-ok-select></div>");
    const bare = rt.getOrCreate<SelectInstance>(
      empty.firstElementChild,
      "select",
    ) as SelectInstance;
    expect(bare.value).toBe("");
    bare.setValue("x");
  });

  it("unknown values: an empty single field, the raw text in a multiple one", () => {
    const host = mount(
      snippet("basic-group") + snippet("multiple-group") + snippet("helper-group"),
    );
    const rt = start();
    const single = instance(rt, host, "select-basic");
    expect(single.value).toBe("");
    single.setValue("ghost");
    expect(trigger(host, "select-basic").textContent).toBe("");
    expect(single.value).toBe("ghost");
    instance(rt, host, "select-multiple").setValue(["Ghost", "Van Henry"]);
    expect(trigger(host, "select-multiple").textContent).toBe("Ghost, Van Henry");
    // displayEmpty without a placeholder template: nothing selected shows nothing.
    instance(rt, host, "select-empty").setValue([]);
    expect(trigger(host, "select-empty").textContent).toBe("");
  });

  it("disabled on the hidden input turns the trigger off and on (as React renders it)", async () => {
    const host = mount(snippet("basic-group"));
    start();
    const box = trigger(host, "select-basic");
    const input = rootOf(host, "select-basic").querySelector("input") as HTMLInputElement;
    const changed = () =>
      new Promise<void>((resolve) =>
        new MutationObserver((_, observer) => {
          observer.disconnect();
          resolve();
        }).observe(box, { attributes: true }),
      );
    let done = changed();
    input.disabled = true;
    await done;
    expect(box.getAttribute("aria-disabled")).toBe("true");
    expect(box.tabIndex).toBe(-1);
    done = changed();
    input.disabled = false;
    await done;
    expect(box.hasAttribute("aria-disabled")).toBe(false);
    expect(box.tabIndex).toBe(0);
  });

  it("a hidden input disabled in the markup disables the trigger at setup", () => {
    const host = mount(
      snippet("basic-group").replace('placeholder=" "', 'placeholder=" " disabled'),
    );
    start();
    expect(trigger(host, "select-basic").getAttribute("aria-disabled")).toBe("true");
    expect(trigger(host, "select-basic").tabIndex).toBe(-1);
  });

  it("a nested popover's close isn't the select's", () => {
    const host = mount(snippet("basic-group"));
    start();
    const onClose = vi.fn();
    rootOf(host, "select-basic").addEventListener("ok:select:close", onClose);
    host
      .querySelector("#select-basic-listbox")
      ?.dispatchEvent(
        new CustomEvent("ok:popover:close", { bubbles: true, detail: { reason: "api" } }),
      );
    expect(onClose).not.toHaveBeenCalled();
  });

  it("a prevented popover open keeps it closed; destroy removes the listeners", async () => {
    const host = mount(snippet("basic-group"));
    const rt = start();
    const paper = host.querySelector("#select-basic-menu") as HTMLElement;
    const refuse = (e: Event) => e.preventDefault();
    paper.addEventListener("ok:popover:beforeopen", refuse);
    expect(instance(rt, host, "select-basic").open()).toBe(false);
    paper.removeEventListener("ok:popover:beforeopen", refuse);
    const onOpen = vi.fn();
    rootOf(host, "select-basic").addEventListener("ok:select:open", onOpen);
    rt.destroy(rootOf(host, "select-basic"));
    trigger(host, "select-basic").click();
    expect(onOpen).not.toHaveBeenCalled();
  });
});

describe("text field and table pagination composition", () => {
  it("TablePagination pages through a listbox Select; a refused change keeps the rows", async () => {
    const host = mount(`
      <table id="t"><tbody>${Array.from({ length: 12 }, (_, i) => `<tr><td>${i}</td></tr>`).join("")}</tbody></table>
      <div data-ok-table-pagination="t">
        <div data-ok-table-pagination-rows>
          <span id="rows-label">Rows per page:</span>
          <div data-ok-select>
            <div data-ok-select-display role="combobox" tabindex="0" id="rows" aria-haspopup="listbox" aria-expanded="false" aria-controls="rows-listbox" aria-labelledby="rows-label">5</div>
            <input data-ok-select-input aria-hidden="true" tabindex="-1" placeholder=" " value="5">
            <div popover="manual" data-ok-popover data-ok-placement="bottom-start" id="rows-menu" tabindex="-1">
              <ul data-ok-select-listbox role="listbox" id="rows-listbox" aria-labelledby="rows-label">
                <li role="option" tabindex="-1" data-ok-menu-item data-ok-selected aria-selected="true" data-ok-value="5">5</li>
                <li role="option" tabindex="-1" data-ok-menu-item aria-selected="false" data-ok-value="10">10</li>
              </ul>
            </div>
          </div>
        </div>
        <span data-ok-table-pagination-displayed aria-live="polite"></span>
      </div>`);
    const rt = start();
    const pagination = rt.get<TablePaginationInstance>(
      host.querySelector("[data-ok-table-pagination]"),
      "table-pagination",
    ) as TablePaginationInstance;
    expect(pagination.rowsPerPage).toBe(5);
    const box = trigger(host, "rows");
    await userEvent.click(box);
    await userEvent.click(option(host, "rows", "10"));
    expect(pagination.rowsPerPage).toBe(10);
    expect(box.textContent).toBe("10");
    host
      .querySelector("[data-ok-table-pagination]")
      ?.addEventListener("ok:table-pagination:change", (e) => e.preventDefault());
    await userEvent.click(box);
    await userEvent.click(option(host, "rows", "5"));
    expect(pagination.rowsPerPage).toBe(10);
    expect(box.textContent).toBe("10");
    expect(pagination.setRowsPerPage(5)).toBe(false);
    expect(box.textContent).toBe("10");
  });
});
