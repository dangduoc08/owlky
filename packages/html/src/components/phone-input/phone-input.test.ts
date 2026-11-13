import { phoneMetadata } from "@owlky/core/phone";
import { afterEach, describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { createRuntime } from "../../runtime/runtime.js";
import type { Runtime } from "../../runtime/types.js";
import { expectNoAxeViolations, mount, resetPage, settle } from "../../test-utils.js";
import { components } from "../index.js";
import {
  createPhoneInput,
  type PhoneInputInstance,
  phoneInput,
  setPhoneFlagsPath,
} from "./phone-input.js";

const snippets = import.meta.glob("./examples/*.html", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;
const snippet = (name: string) =>
  Object.entries(snippets).find(([path]) => path.endsWith(`/${name}.html`))?.[1] ?? "";

let runtime: Runtime | undefined;
const start = (definition = phoneInput) => {
  runtime = createRuntime()
    .register(...components, definition)
    .start();
  return runtime;
};
afterEach(() => {
  runtime?.stop();
  runtime = undefined;
  resetPage();
});

const parts = (host: HTMLElement) => {
  const root = host.querySelector<HTMLElement>("[data-ok-phone-input]") as HTMLElement;
  return {
    root,
    input: root.querySelector<HTMLInputElement>("input[type=tel]") as HTMLInputElement,
    trigger: root.querySelector<HTMLElement>("[role=combobox]"),
    hidden: root.querySelector<HTMLInputElement>("[data-ok-select-input]"),
    options: () => [...root.querySelectorAll<HTMLElement>("[role=option]")],
    instance: () => runtime?.get<PhoneInputInstance>(root, "phone-input") as PhoneInputInstance,
  };
};

type Detail = { value: string; national: string; country?: string; valid: boolean };
const record = (root: HTMLElement) => {
  const changes: Detail[] = [];
  const countries: (string | undefined)[] = [];
  root.addEventListener("ok:phone-input:change", (e) => changes.push((e as CustomEvent).detail));
  root.addEventListener("ok:phone-input:countrychange", (e) =>
    countries.push((e as CustomEvent).detail.country),
  );
  return { changes, countries };
};

async function pick(trigger: HTMLElement, code: string) {
  await userEvent.click(trigger);
  const option = document.querySelector<HTMLElement>(`[role="option"][data-ok-value="${code}"]`);
  await userEvent.click(option as HTMLElement);
}

describe("phone input runtime", () => {
  it("has nine story snippets, each without axe violations once mounted", async () => {
    expect(Object.keys(snippets)).toHaveLength(9);
    for (const path of Object.keys(snippets)) {
      const host = mount(snippets[path] as string);
      start();
      await settle();
      await expectNoAxeViolations(host);
      runtime?.stop();
      resetPage();
    }
  });

  it("fills the country list with the markup React renders", async () => {
    const host = mount(snippet("phone-input-auto"));
    start();
    await settle();
    const { options, trigger } = parts(host);
    expect(options().length).toBeGreaterThan(200);
    const [international, ...rest] = options();
    expect(international?.getAttribute("data-ok-value")).toBe("");
    expect(international?.querySelector("svg")).not.toBeNull();
    const au = rest.find((option) => option.getAttribute("data-ok-value") === "AU") as HTMLElement;
    expect(au.getAttribute("role")).toBe("option");
    expect(au.getAttribute("tabindex")).toBe("-1");
    expect(au.hasAttribute("data-ok-menu-item")).toBe(true);
    expect(au.querySelector("[data-ok-phone-input-flag]")?.textContent).toBe("🇦🇺");
    expect(au.querySelector("[data-ok-list-item-text-secondary]")?.textContent).toBe("AU (+61)");
    expect(trigger?.textContent?.trim()).toBe("International");
    // The empty value marks the International option, as React does.
    expect(international?.getAttribute("aria-selected")).toBe("true");
  });

  it("formats as you type, selects the number's country and fires events", async () => {
    const host = mount(snippet("phone-input-auto"));
    start();
    await settle();
    const { root, input, trigger, hidden, instance } = parts(host);
    const { changes, countries } = record(root);
    await userEvent.type(input, "84912345678");
    expect(input.value).toBe("+84 912 345 678");
    expect(countries).toEqual(["VN"]);
    expect(changes.at(-1)).toMatchObject({
      value: "+84912345678",
      national: "0912 345 678",
      country: "VN",
      valid: true,
    });
    expect(hidden?.value).toBe("VN");
    expect(trigger?.textContent).toContain("Vietnam");
    expect(instance().value).toBe("+84912345678");
    expect(instance().country).toBe("VN");
    expect(instance().details.international).toBe("+84 912 345 678");
    // Story script: the values under the field follow.
    expect(input.selectionStart).toBe(input.value.length);
  });

  it("reads the initial value and country from the markup", async () => {
    const host = mount(snippet("phone-input-default-value"));
    start();
    await settle();
    const { input, instance, options } = parts(host);
    expect(input.value).toBe("(02) 9876 5432");
    expect(instance().value).toBe("+61298765432");
    expect(instance().country).toBe("AU");
    const au = options().find((o) => o.getAttribute("data-ok-value") === "AU");
    expect(au?.getAttribute("aria-selected")).toBe("true");
  });

  it("changes the country from the list and moves the focus to the input", async () => {
    const host = mount(snippet("phone-input-default-country"));
    start();
    await settle();
    const { root, input, trigger, instance } = parts(host);
    const { countries } = record(root);
    expect(instance().country).toBe("DE");
    await pick(trigger as HTMLElement, "AU");
    expect(countries).toEqual(["AU"]);
    expect(document.activeElement).toBe(input);
    await userEvent.type(input, "0298765432");
    expect(input.value).toBe("(02) 9876 5432");
    await pick(trigger as HTMLElement, "");
    expect(input.value).toBe("+61 2 9876 5432");
    expect(instance().country).toBeUndefined();
  });

  it("keeps the focus on the select when asked", async () => {
    const host = mount(snippet("phone-input-default-country"));
    const { root } = parts(host);
    root.setAttribute("data-ok-focus-input-on-country-selection", "false");
    start();
    await settle();
    const { input, trigger } = parts(host);
    await pick(trigger as HTMLElement, "FR");
    expect(document.activeElement).not.toBe(input);
  });

  it("keeps a fixed country and its calling code", async () => {
    const host = mount(snippet("phone-input-fixed-international"));
    start();
    await settle();
    const { input, trigger, instance, options } = parts(host);
    expect(trigger?.getAttribute("aria-disabled")).toBe("true");
    expect(options()[0]?.getAttribute("data-ok-value")).not.toBe("");
    await userEvent.clear(input);
    expect(input.value).toBe("+61");
    instance().setCountry("VN");
    expect(instance().country).toBe("AU");
  });

  it("works without a country select", async () => {
    const host = mount(snippet("phone-input-hide-select"));
    start();
    await settle();
    const { input, trigger, instance } = parts(host);
    expect(trigger).toBeNull();
    expect(input.value).toBe("+61 2 9876 5432");
    instance().setValue("+61312345678");
    expect(input.value).toBe("+61 3 1234 5678");
  });

  it("validates after the field is left once", async () => {
    const host = mount(snippet("validation-invalid"));
    start();
    await settle();
    const { root, input } = parts(host);
    const helper = root.querySelector("[data-ok-text-field-helper]") as HTMLElement;
    await userEvent.type(input, "21");
    expect(root.hasAttribute("data-ok-error")).toBe(false);
    // Back to the country select (Firefox keeps the focus on a last control Tab leaves).
    await userEvent.tab({ shift: true });
    expect(root.hasAttribute("data-ok-error")).toBe(true);
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(helper.textContent).toBe("Enter a valid phone number");
    await userEvent.click(input);
    await userEvent.type(input, "33734253");
    expect(root.hasAttribute("data-ok-error")).toBe(false);
    expect(helper.textContent).toBe("We only call about your order");
    await expectNoAxeViolations(host);
  });

  it("keeps an error set by the page", async () => {
    const host = mount(snippet("validation-invalid"));
    const { root } = parts(host);
    root.setAttribute("data-ok-error", "");
    start();
    await settle();
    const { input } = parts(host);
    await userEvent.type(input, "2133734253");
    // Back to the country select (Firefox keeps the focus on a last control Tab leaves).
    await userEvent.tab({ shift: true });
    expect(root.hasAttribute("data-ok-error")).toBe(true);
  });

  it("limits the countries, their order and the length", async () => {
    const host = mount(snippet("validation-countries"));
    start();
    await settle();
    const { input, options } = parts(host);
    expect(options().map((o) => o.getAttribute("data-ok-value"))).toEqual([
      "",
      "VN",
      "AU",
      "CA",
      "GB",
      "US",
    ]);
    await userEvent.type(input, "09123456789999");
    // Digits past Vietnam's longest number were refused.
    expect(input.value.replace(/\D/g, "")).toBe("09123456789");
  });

  it("follows option attributes and the input's disabled state", async () => {
    const host = mount(snippet("phone-input-default-value"));
    start();
    await settle();
    const { root, input, hidden, trigger } = parts(host);
    root.setAttribute("data-ok-international", "");
    await settle();
    expect(input.value).toBe("+61 2 9876 5432");
    input.disabled = true;
    await settle();
    expect(hidden?.disabled).toBe(true);
    expect(trigger?.getAttribute("aria-disabled")).toBe("true");
    input.disabled = false;
    await settle();
    expect(hidden?.disabled).toBe(false);
  });

  it("sets the value and the country through the instance without events", async () => {
    const host = mount(snippet("phone-input-auto"));
    start();
    await settle();
    const { root, input, instance } = parts(host);
    const { changes } = record(root);
    instance().setValue("+33123456789");
    expect(input.value).toBe("01 23 45 67 89");
    expect(instance().country).toBe("FR");
    instance().setCountry(undefined);
    expect(input.value).toBe("+33 1 23 45 67 89");
    instance().setCountry("FR");
    expect(input.value).toBe("01 23 45 67 89");
    expect(changes).toEqual([]);
  });

  it("takes labels and metadata from createPhoneInput", async () => {
    const host = mount(snippet("validation-countries"));
    start(createPhoneInput({ metadata: phoneMetadata, labels: { VN: "Việt Nam", ZZ: "Quốc tế" } }));
    await settle();
    const { options } = parts(host);
    expect(options()[0]?.textContent).toBe("Quốc tế");
    expect(options()[1]?.textContent).toContain("Việt Nam");
  });

  it("leaves markup without an input alone", async () => {
    const host = mount('<div data-ok-phone-input id="empty"></div>');
    start();
    await settle();
    const instance = runtime?.get<PhoneInputInstance>(
      host.querySelector("#empty") as HTMLElement,
      "phone-input",
    ) as PhoneInputInstance;
    expect(instance.value).toBe("");
    expect(instance.country).toBeUndefined();
    instance.setValue("+61298765432");
    instance.setCountry("AU");
    expect(instance.details.value).toBe("");
  });

  it("keeps options already in the markup", async () => {
    const host = mount(snippet("phone-input-auto"));
    const listbox = host.querySelector("[data-ok-select-listbox]") as HTMLElement;
    const item = document.createElement("li");
    item.setAttribute("role", "option");
    item.setAttribute("data-ok-value", "AU");
    item.textContent = "Australia";
    listbox.append(item);
    start();
    await settle();
    expect(parts(host).options()).toHaveLength(1);
  });

  it("draws image flags from the root's folder, and from the default folder", async () => {
    const host = mount(snippet("phone-input-image-flags"));
    start();
    await settle();
    const { options, root } = parts(host);
    const images = () =>
      root.querySelectorAll<HTMLImageElement>("img[data-ok-phone-input-flag-image]");
    // The trigger and every country (the International option keeps its globe).
    expect(images().length).toBe(options().length);
    const au = root.querySelector<HTMLImageElement>('[data-ok-value="AU"] img');
    expect(au?.getAttribute("src")).toBe("flags/au.svg");
    expect(au?.getAttribute("alt")).toBe("");
    expect(au?.getAttribute("loading")).toBe("lazy");
    expect(au?.getAttribute("decoding")).toBe("async");
    expect(root.querySelector('[data-ok-value=""] img')).toBeNull();
    expect(root.querySelector('[data-ok-value=""] svg')).not.toBeNull();
    await expectNoAxeViolations(host);
    runtime?.stop();
    resetPage();

    setPhoneFlagsPath("https://example.test/f");
    try {
      const other = mount(
        snippet("phone-input-image-flags").replace(' data-ok-flags-path="flags/"', ""),
      );
      start();
      await settle();
      expect(other.querySelector('[data-ok-value="VN"] img')?.getAttribute("src")).toBe(
        "https://example.test/f/vn.svg",
      );
    } finally {
      setPhoneFlagsPath(undefined);
    }
  });

  it("keeps emoji flags without a safe folder", async () => {
    const markup = snippet("phone-input-image-flags").replace(' data-ok-flags-path="flags/"', "");
    for (const path of [null, "javascript:alert(1)"]) {
      const host = mount(
        path === null
          ? markup
          : markup.replace("data-ok-flags=", `data-ok-flags-path="${path}" data-ok-flags=`),
      );
      start();
      await settle();
      expect(host.querySelector("img")).toBeNull();
      expect(parts(host).options()[1]?.textContent).toMatch(/\p{Regional_Indicator}/u);
      runtime?.stop();
      resetPage();
    }
  });
});
