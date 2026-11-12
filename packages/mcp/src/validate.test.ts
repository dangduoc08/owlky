import { describe, expect, it } from "vitest";
import type { Manifest } from "./manifest.js";
import { manifest } from "./test-utils.js";
import { createValidator, MAX_ISSUES } from "./validate.js";

const validator = createValidator(manifest());
const rules = (markup: string, roots?: string[]) =>
  validator.validate(markup, roots).issues.map((issue) => issue.rule);

describe("canonical markup", () => {
  it("every story's HTML code validates without errors or warnings", () => {
    const failures: string[] = [];
    for (const component of manifest().components) {
      const sources = [
        ...component.stories.map((story) => [story.id, story.html] as const),
        ...Object.entries(component.snippets),
      ];
      for (const [id, html] of sources) {
        const result = validator.validate(html);
        if (result.issues.length > 0)
          failures.push(`${id}: ${result.issues.map((i) => i.message).join("; ")}`);
      }
    }
    expect(failures).toEqual([]);
  });

  // Guides shorten markup with "…" (parts left out on purpose): only names and values count.
  it("every guide's HTML code uses known names and valid values", () => {
    const failures: string[] = [];
    for (const guide of manifest().guides)
      for (const section of guide.sections) {
        if (!section.html) continue;
        const issues = validator
          .validate(section.html)
          .issues.filter((i) => i.rule === "unknown-attribute" || i.rule === "invalid-value");
        if (issues.length > 0)
          failures.push(`${guide.id}#${section.id}: ${issues.map((i) => i.message).join("; ")}`);
      }
    expect(failures).toEqual([]);
  });
});

describe("rules", () => {
  it("unknown-attribute suggests close names", () => {
    const result = validator.validate("<div data-ok-dialgo></div>");
    expect(result.issues[0]).toMatchObject({
      severity: "error",
      rule: "unknown-attribute",
      attribute: "data-ok-dialgo",
    });
    expect(result.issues[0]?.suggestions).toContain("data-ok-dialog");
    expect(
      validator.validate("<div data-ok-qqqqqqqqqqqqqqqqqqqqqq></div>").issues[0],
    ).not.toHaveProperty("suggestions");
  });

  it("invalid-value lists the allowed values of style options", () => {
    const result = validator.validate(
      '<button data-ok-button data-ok-size="huge"><span data-ok-button-label>A</span></button>',
    );
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]).toMatchObject({ rule: "invalid-value", attribute: "data-ok-size" });
    expect(result.issues[0]?.message).toContain('expects one of "sm", "md", "lg", "xl"');
    expect(result.issues[0]?.suggestions).toEqual(["sm", "md", "lg", "xl"]);
  });

  it("accepts a value that any root on the element allows", () => {
    // Card is built on Paper: both roots on one element.
    expect(
      rules(
        '<div data-ok-paper data-ok-card data-ok-variant="outlined" data-ok-elevation="0"></div>',
      ),
    ).toEqual([]);
  });

  it("checks numbers, units and minimums", () => {
    const progress = (attr: string) =>
      rules(
        `<span data-ok-circular-progress ${attr}><svg data-ok-circular-progress-svg><circle data-ok-circular-progress-circle></circle></svg></span>`,
      );
    expect(progress('data-ok-size="40"')).toEqual([]);
    expect(progress('data-ok-size="3rem"')).toEqual([]);
    expect(progress('data-ok-size="big"')).toEqual(["invalid-value"]);
    expect(progress('data-ok-thickness="-2"')).toEqual(["invalid-value"]);
    const slider = validator.validate(
      '<span data-ok-slider data-ok-step="abc"><span data-ok-slider-rail></span><span data-ok-slider-track></span></span>',
    );
    expect(slider.issues[0]?.message).toContain("expects a number");
    expect(slider.issues[0]?.message).not.toContain("length");
  });

  it("accepts style values that match an option's pattern", () => {
    const image = (ratio: string) =>
      rules(`<span data-ok-image data-ok-ratio="${ratio}"><img src="a.png" alt=""></span>`);
    expect(image("16/9")).toEqual([]);
    expect(image("16/10")).toEqual([]);
    expect(image("1.6")).toEqual([]);
    expect(image("wide")).toEqual(["invalid-value"]);
  });

  it("checks behavior options", () => {
    const code = (value: string) =>
      rules(
        `<div data-ok-code-editor data-ok-save-view-state="${value}"><div data-ok-code-editor-loading></div><textarea data-ok-code-editor-value></textarea></div>`,
      );
    expect(code("false")).toEqual([]);
    expect(code("")).toEqual([]);
    expect(code("nope")).toEqual(["invalid-value"]);
  });

  it("flag-value warns about presence attributes with a value", () => {
    const result = validator.validate(
      '<button data-ok-button data-ok-full-width="yes"><span data-ok-button-label>A</span></button>',
    );
    expect(result.valid).toBe(true);
    expect(result.issues[0]).toMatchObject({ severity: "warning", rule: "flag-value" });
    expect(result.issues[0]?.message).not.toContain("remove it");
  });

  it("missing-part and orphan-part follow the anatomy", () => {
    expect(rules("<span data-ok-switch><input data-ok-switch-input></span>")).toEqual([
      "missing-part",
      "missing-part",
    ]);
    expect(rules("<span data-ok-switch-track></span>")).toEqual(["orphan-part"]);
  });

  it("missing-root reports a component that isn't there", () => {
    const result = validator.validate("<p>Text</p>", ["data-ok-tabs"]);
    expect(result.issues[0]).toMatchObject({ rule: "missing-root", line: 0, column: 0 });
    expect(rules("<p></p>")).toEqual([]);
  });

  it("caps the issue list", () => {
    const markup = "<i data-ok-nothing-here></i>".repeat(MAX_ISSUES + 5);
    const result = validator.validate(markup);
    expect(result.issues).toHaveLength(MAX_ISSUES);
    expect(result.errorCount).toBe(MAX_ISSUES + 5);
    expect(result.truncated).toBe(true);
  });

  it("skips options written on children", () => {
    const custom: Manifest = {
      ...manifest(),
      components: [
        {
          ...(manifest().components[0] as Manifest["components"][number]),
          schemas: [
            {
              name: "demo",
              root: "data-ok-demo",
              options: [
                {
                  name: "size",
                  kind: "style",
                  attr: "data-ok-size",
                  values: ["sm"],
                  default: "sm",
                  description: "",
                  children: ":scope > li",
                },
              ],
            },
          ],
          requiredParts: {},
        },
      ],
      attributes: ["data-ok-demo", "data-ok-size"],
      parts: {},
    };
    expect(
      createValidator(custom).validate('<ul data-ok-demo data-ok-size="xl"></ul>').issues,
    ).toEqual([]);
  });
});
