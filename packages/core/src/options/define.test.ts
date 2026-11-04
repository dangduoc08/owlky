import { describe, expect, it } from "vitest";
import { optionSchemas } from "../anatomy/anatomy.js";
import {
  behavior,
  defineOptions,
  flag,
  native,
  optionAttributes,
  readBehavior,
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

describe("component schemas", () => {
  it.each(Object.entries(optionSchemas))("%s: well-formed", (name, schema) => {
    expect(schema.name).toBe(name);
    expect(schema.root).toMatch(/^data-ok-[a-z-]+$/);
    for (const [key, spec] of Object.entries(schema.options)) {
      expect(spec.description, `${name}.${key}`).not.toBe("");
      if (spec.kind === "style") expect(spec.values).toContain(spec.default);
      if (spec.kind !== "native" && spec.kind !== "state") expect(spec.attr).toMatch(/^data-ok-/);
    }
  });
});
