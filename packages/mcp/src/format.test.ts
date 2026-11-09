import { describe, expect, it } from "vitest";
import { componentMarkdown, guideMarkdown, optionsTable, storyMarkdown } from "./format.js";
import type { ManifestComponent, ManifestSchema } from "./manifest.js";

const schema: ManifestSchema = {
  name: "demo",
  root: "data-ok-demo",
  options: [
    { name: "tone", kind: "style", attr: "data-ok-tone", description: "A | B", default: "a" },
    {
      name: "shape",
      kind: "style",
      attr: "data-ok-shape",
      description: "Optional.",
      values: ["round"],
      default: "round",
      optional: true,
      children: ":scope > li",
    },
    { name: "open", kind: "state", attr: "open", description: "No event." },
    { name: "auto", kind: "behavior", attr: "data-ok-auto", description: "On.", default: true },
    {
      name: "manual",
      kind: "behavior",
      attr: "data-ok-manual",
      description: "Off.",
      default: false,
    },
    { name: "count", kind: "number", attr: "data-ok-count", description: "Plain.", min: 0 },
    {
      name: "size",
      kind: "number",
      attr: "data-ok-size",
      description: "Length.",
      default: 4,
      units: ["px", "rem"],
    },
    { name: "dense", kind: "flag", attr: "data-ok-dense", description: "Flag.", children: "li" },
    { name: "disabled", kind: "native", attr: "disabled", description: "Native." },
  ],
};

describe("optionsTable", () => {
  it("renders every kind of option", () => {
    const table = optionsTable(schema);
    expect(table).toContain('| `tone` | `data-ok-tone="…"` | style |  | `a` | A \\| B |');
    expect(table).toContain('`data-ok-shape="…"` on each `li` | style | `round` | — |');
    expect(table).toContain("| `open` | `open` | state | — | — | No event. |");
    expect(table).toContain('`data-ok-auto="false"` turns it off | behavior | boolean | on |');
    expect(table).toContain("| behavior | boolean | off |");
    expect(table).toContain("| number ≥ 0 | — |");
    expect(table).toContain("| number (px) or `px` `rem` length | `4` |");
    expect(table).toContain("| `dense` | `data-ok-dense` on each `li` | flag | boolean | off |");
    expect(table).toContain("| `disabled` | `disabled` | native | boolean | off |");
  });
});

describe("componentMarkdown", () => {
  it("leaves out what a component doesn't have", () => {
    const bare: ManifestComponent = {
      name: "bare",
      title: "Bare",
      summary: "Nothing else.",
      react: [],
      schemas: [],
      sections: [],
      requiredParts: {},
      related: [],
      stories: [],
      snippets: {},
    };
    expect(componentMarkdown(bare, [])).toBe("# Bare (`bare`)\n\nNothing else.");
  });
});

describe("storyMarkdown and guideMarkdown", () => {
  it("renders only the code that is there", () => {
    expect(storyMarkdown({ id: "a--b", name: "B" })).toBe("## B (`a--b`)");
    expect(guideMarkdown({ id: "g", title: "G" }, [{ id: "s", title: "S", body: "Text." }])).toBe(
      "# G (`g`)\n\n## S\n\nText.",
    );
  });
});
