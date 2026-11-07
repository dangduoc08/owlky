import { describe, expect, it } from "vitest";
import { optionSchemas } from "../anatomy/anatomy.js";
import {
  behavior,
  defineOptions,
  flag,
  native,
  number,
  optionAttributes,
  parseNumber,
  readBehavior,
  readNumber,
  readStyle,
  state,
  style,
} from "./define.js";

const demo = defineOptions("demo", "data-ok-demo", {
  size: style("data-ok-size", ["sm", "md"], "md", "Size."),
  wide: flag("data-ok-wide", "Wide."),
  extra: style("data-ok-extra", ["a", "b"], "a", "Only when wide.", { when: "wide" }),
  childSize: style("data-ok-size", ["sm", "md"], "md", "On children.", { children: "li" }),
  disabled: native("disabled", "Native."),
  closeOnEscape: behavior("data-ok-escape-close", true, "Behavior."),
  open: state("open", "State.", "close"),
  length: number("data-ok-length", 40, "Length.", { min: 0, units: ["px", "rem"] }),
  now: number("aria-valuenow", undefined, "ARIA number."),
});

describe("optionAttributes", () => {
  it("writes the root, every style with explicit defaults and flags that are on", () => {
    expect(optionAttributes(demo)).toEqual({ "data-ok-demo": "", "data-ok-size": "md" });
    expect(optionAttributes(demo, { size: "sm", wide: true, extra: "b" })).toEqual({
      "data-ok-demo": "",
      "data-ok-size": "sm",
      "data-ok-wide": "",
      "data-ok-extra": "b",
    });
  });

  it("writes valid data-ok-* numbers only, never ARIA ones", () => {
    expect(optionAttributes(demo, { length: 48, now: 5 })).toEqual({
      "data-ok-demo": "",
      "data-ok-size": "md",
      "data-ok-length": "48",
    });
    expect(optionAttributes(demo, { length: " 2.5rem " })["data-ok-length"]).toBe("2.5rem");
    expect(optionAttributes(demo, { length: -1 })).not.toHaveProperty("data-ok-length");
  });

  it("rejects unknown values and ignores native, behavior, state and child options", () => {
    expect(
      optionAttributes(demo, {
        size: '"><img onerror=x>',
        wide: "yes",
        disabled: true,
        closeOnEscape: false,
        open: true,
        childSize: "sm",
      }),
    ).toEqual({ "data-ok-demo": "", "data-ok-size": "md" });
  });
});

describe("reading options in HTML", () => {
  it("readBehavior: absent → default, 'false' → false, anything else → true", () => {
    const element = document.createElement("div");
    const spec = demo.options.closeOnEscape;
    expect(readBehavior(element, spec)).toBe(true);
    element.setAttribute(spec.attr, "false");
    expect(readBehavior(element, spec)).toBe(false);
    element.setAttribute(spec.attr, "");
    expect(readBehavior(element, spec)).toBe(true);
    expect(readBehavior(element, behavior("data-ok-x", false, "Off by default."))).toBe(false);
  });

  it("readStyle goes through the allowlist", () => {
    const element = document.createElement("div");
    expect(readStyle(element, demo.options.size)).toBe("md");
    element.setAttribute("data-ok-size", "sm");
    expect(readStyle(element, demo.options.size)).toBe("sm");
    element.setAttribute("data-ok-size", "../../etc");
    expect(readStyle(element, demo.options.size)).toBe("md");
  });
});

describe("number options", () => {
  const spec = demo.options.length;
  it.each([
    [40, 40],
    ["40", 40],
    [" 3.5 ", 3.5],
    [".5", 0.5],
    ["+2", 2],
    ["3rem", "3rem"],
    ["12px", "12px"],
    [0, 0],
  ] as const)("parses %j", (input, expected) => {
    expect(parseNumber(spec, input)).toBe(expected);
  });

  it.each([
    -1,
    "-1",
    "-1rem",
    Number.NaN,
    Number.POSITIVE_INFINITY,
    "1e999",
    "",
    "abc",
    "3em",
    "calc(1px)",
    '"><img src=x onerror=alert(1)>',
    "../",
    "9".repeat(40),
    null,
    undefined,
    {},
    true,
  ])("rejects %j", (input) => {
    expect(parseNumber(spec, input)).toBeUndefined();
  });

  it("no unit list: plain numbers only, any sign without min", () => {
    expect(parseNumber(demo.options.now, "-5")).toBe(-5);
    expect(parseNumber(demo.options.now, "5px")).toBeUndefined();
  });

  it("readNumber: absent or invalid → default", () => {
    const element = document.createElement("div");
    expect(readNumber(element, spec)).toBe(40);
    element.setAttribute("data-ok-length", "2rem");
    expect(readNumber(element, spec)).toBe("2rem");
    element.setAttribute("data-ok-length", "oops");
    expect(readNumber(element, spec)).toBe(40);
    expect(readNumber(element, demo.options.now)).toBeUndefined();
  });
});

describe("component schemas", () => {
  it.each(Object.entries(optionSchemas))("%s: well-formed", (name, schema) => {
    expect(schema.name).toBe(name);
    expect(schema.root).toMatch(/^data-ok-[a-z-]+$/);
    for (const [key, spec] of Object.entries(schema.options)) {
      expect(spec.description, `${name}.${key}`).not.toBe("");
      if (spec.kind === "style") expect(spec.values).toContain(spec.default);
      if (spec.kind !== "native" && spec.kind !== "state" && spec.kind !== "number")
        expect(spec.attr).toMatch(/^data-ok-/);
      if (spec.kind === "number") expect(spec.attr).toMatch(/^(data-ok-|aria-value)/);
    }
  });
});
