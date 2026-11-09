import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Manifest } from "./manifest.js";
import { MAX_EXAMPLES } from "./server.js";
import { connect, manifest, textOf } from "./test-utils.js";
import { MAX_MARKUP } from "./validate.js";

type Session = Awaited<ReturnType<typeof connect>>;
let session: Session;
beforeAll(async () => {
  session = await connect();
});
afterAll(async () => {
  await session.close();
});

const structured = <T = Record<string, unknown>>(result: { structuredContent?: unknown }) =>
  result.structuredContent as T;

describe("tools/list", () => {
  it("offers the six read-only tools of ADR-0046, with input and output schemas", async () => {
    const { tools } = await session.client.listTools();
    expect(tools.map((tool) => tool.name).sort()).toEqual([
      "get_component",
      "get_examples",
      "get_guide",
      "list_components",
      "search_tokens",
      "validate_markup",
    ]);
    for (const tool of tools) {
      expect(tool.description).toBeTruthy();
      expect(tool.inputSchema.type).toBe("object");
      expect(tool.outputSchema?.type).toBe("object");
      expect(tool.annotations).toMatchObject({ readOnlyHint: true, openWorldHint: false });
    }
  });

  it("introduces itself with the library version and instructions", () => {
    expect(session.client.getServerVersion()).toMatchObject({
      name: "owlky",
      version: manifest().version,
    });
    expect(session.client.getInstructions()).toContain("validate_markup");
  });
});

describe("list_components", () => {
  it("lists every component", async () => {
    const result = await session.call("list_components");
    const { components, count } = structured<{ components: { name: string }[]; count: number }>(
      result,
    );
    expect(count).toBe(manifest().components.length);
    expect(components.map((c) => c.name)).toContain("button");
    expect(textOf(result)).toContain("**Button** (`button`, `data-ok-button`; React: Button)");
  });

  it("filters by every word of the query", async () => {
    const result = await session.call("list_components", { query: "date picker" });
    const names = structured<{ components: { name: string }[] }>(result).components.map(
      (c) => c.name,
    );
    expect(names).toContain("date-picker");
    expect(names).not.toContain("button");
    expect(textOf(result)).toContain("matching");
    // Long React export lists are shortened in the text.
    expect(textOf(result)).toContain(", …");
  });

  it("says so when nothing matches", async () => {
    const result = await session.call("list_components", { query: "spaceship" });
    expect(structured<{ count: number }>(result).count).toBe(0);
    expect(textOf(result)).toContain('No component matches "spaceship"');
  });
});

describe("get_component", () => {
  it("returns the options table, spec sections, parts, related components and stories", async () => {
    const result = await session.call("get_component", { name: "switch" });
    const data = structured<{
      name: string;
      root: string;
      react: string[];
      options: { schema: string; options: { prop: string; attribute: string }[] }[];
      anatomy: string;
      keyboard: string;
      accessibility: string;
      requiredParts: Record<string, string[]>;
      stories: { id: string }[];
      otherSections: { id: string }[];
    }>(result);
    expect(data.name).toBe("switch");
    expect(data.root).toBe("data-ok-switch");
    expect(data.react).toContain("Switch");
    expect(data.options[0]?.options).toContainEqual(
      expect.objectContaining({ prop: "color", attribute: "data-ok-color" }),
    );
    expect(data.anatomy).toContain("data-ok-switch-input");
    expect(data.keyboard).toBeTruthy();
    expect(data.accessibility).toBeTruthy();
    expect(data.requiredParts["data-ok-switch"]).toContain("data-ok-switch-thumb");
    expect(data.stories.length).toBeGreaterThan(0);
    expect(data.otherSections.map((s) => s.id)).not.toContain("anatomy");
    const markdown = textOf(result);
    expect(markdown).toContain("| React prop | HTML | Kind | Values | Default | Description |");
    expect(markdown).toContain("## Required parts");
    expect(markdown).toContain("Call get_examples");
  });

  it.each([
    ["Icon button", "icon-button"],
    ["IconButton", "icon-button"],
    ["data-ok-icon-button", "icon-button"],
    ["DateTimePicker", "date-picker"],
    ["list-item", "list"],
    ["toaster", "snackbar"],
  ])("finds %s", async (name, expected) => {
    const result = await session.call("get_component", { name });
    expect(structured<{ name: string }>(result).name).toBe(expected);
  });

  it("renders every kind of option (state events, numbers, behaviors, children)", async () => {
    const texts = await Promise.all(
      ["dialog", "circular-progress", "tabs", "slider", "carousel", "date-picker", "button"].map(
        async (name) => textOf(await session.call("get_component", { name })),
      ),
    );
    const all = texts.join("\n");
    expect(all).toMatch(/· event `ok:[a-z-]+:[a-z]+`/);
    expect(all).toContain('="false"` turns it off');
    expect(all).toMatch(/\| number( ≥ \d+)? \|/);
    expect(all).toContain("number (px) or");
    expect(all).toContain("(with `loading`)");
    expect(all).toContain(" on each `");
  });

  it("suggests close names for an unknown component", async () => {
    const result = await session.call("get_component", { name: "buton" });
    expect(result.isError).toBe(true);
    expect(textOf(result)).toContain('Did you mean "button"');
    const far = await session.call("get_component", { name: "zzzzzzzzzzzz" });
    expect(textOf(far)).not.toContain("Did you mean");
    expect(textOf(far)).toContain("list_components");
  });
});

describe("get_examples", () => {
  it("returns HTML and React code with the snippets each story shows", async () => {
    const result = await session.call("get_examples", { component: "button" });
    const data = structured<{
      listOnly: boolean;
      stories: { html: string; react: string; snippets: string[] }[];
    }>(result);
    expect(data.listOnly).toBe(false);
    expect(data.stories[0]?.html).toContain("data-ok-button");
    expect(data.stories[0]?.react).toContain('from "@owlky/react"');
    expect(data.stories[0]?.snippets.length).toBeGreaterThan(0);
    expect(textOf(result)).toContain("```tsx");
  });

  it("returns one framework", async () => {
    const react = structured<{ stories: Record<string, unknown>[] }>(
      await session.call("get_examples", { component: "button", framework: "react" }),
    );
    expect(react.stories[0]).not.toHaveProperty("html");
    const html = structured<{ stories: Record<string, unknown>[] }>(
      await session.call("get_examples", { component: "button", framework: "html" }),
    );
    expect(html.stories[0]).not.toHaveProperty("react");
  });

  it("lists the stories of a large component and returns one on request", async () => {
    const list = await session.call("get_examples", { component: "date-picker" });
    const data = structured<{ listOnly: boolean; stories: { id: string; htmlLength: number }[] }>(
      list,
    );
    expect(data.listOnly).toBe(true);
    expect(data.stories[0]?.htmlLength).toBeGreaterThan(0);
    expect(textOf(list)).toContain(`characters of code`);
    const total = manifest()
      .components.find((c) => c.name === "date-picker")
      ?.stories.reduce((n, s) => n + s.html.length + s.react.length, 0);
    expect(total).toBeGreaterThan(MAX_EXAMPLES);

    const id = data.stories[0]?.id as string;
    const byId = await session.call("get_examples", { component: "date-picker", story: id });
    expect(structured<{ stories: { id: string }[] }>(byId).stories.map((s) => s.id)).toEqual([id]);
    const name = manifest().components.find((c) => c.name === "date-picker")?.stories[1]?.name;
    const byName = await session.call("get_examples", {
      component: "date-picker",
      story: (name as string).toUpperCase(),
      framework: "react",
    });
    expect(structured<{ stories: { name: string }[] }>(byName).stories[0]?.name).toBe(name);
  });

  it("reports unknown stories and components", async () => {
    const story = await session.call("get_examples", { component: "button", story: "Contaned" });
    expect(story.isError).toBe(true);
    expect(textOf(story)).toContain('Did you mean "Contained"');
    const none = await session.call("get_examples", { component: "button", story: "qqqqqqqq" });
    expect(textOf(none)).not.toContain("Did you mean");
    const component = await session.call("get_examples", { component: "buttn" });
    expect(component.isError).toBe(true);
  });

  it("explains a component without stories of its own", async () => {
    const result = await session.call("get_examples", { component: "form-control-label" });
    expect(textOf(result)).toContain("has no stories of its own");
  });

  it("adds snippets that no story shows", async () => {
    const base = manifest();
    const custom: Manifest = {
      ...base,
      components: base.components.map((c) =>
        c.name === "label"
          ? { ...c, snippets: { "extra.html": '<span data-ok-label="">New</span>' } }
          : c.name === "form-control-label"
            ? { ...c, related: [] }
            : c,
      ),
    };
    const other = await connect({ manifest: custom });
    try {
      const result = await other.call("get_examples", { component: "label", framework: "html" });
      expect(structured<{ unlistedSnippets: { file: string }[] }>(result).unlistedSnippets).toEqual(
        [{ file: "extra.html", html: '<span data-ok-label="">New</span>' }],
      );
      expect(textOf(result)).toContain("## Snippet extra.html");
      const lonely = await other.call("get_examples", { component: "form-control-label" });
      expect(textOf(lonely)).toContain("inside other components");
    } finally {
      await other.close();
    }
  });
});

describe("search_tokens", () => {
  it("finds CSS variables with their light and dark values", async () => {
    const result = await session.call("search_tokens", { query: "palette primary text" });
    const data = structured<{ variables: { name: string; light?: string; dark?: string }[] }>(
      result,
    );
    const token = data.variables.find((t) => t.name === "--ok-palette-primary-text");
    expect(token?.light).toBeDefined();
    expect(token?.dark).toBeDefined();
    expect(textOf(result)).toContain("(light ");
  });

  it("ranks an exact name first", async () => {
    const result = await session.call("search_tokens", { query: "--ok-palette-primary-main" });
    const data = structured<{ variables: { name: string }[] }>(result);
    expect(data.variables[0]?.name).toBe("--ok-palette-primary-main");
  });

  it("finds Tailwind utilities", async () => {
    const result = await session.call("search_tokens", { query: "bg-primary" });
    const data = structured<{ tailwind: { utilities: string[]; token?: string }[] }>(result);
    expect(data.tailwind[0]?.utilities).toContain("bg-primary");
    expect(data.tailwind[0]?.token).toBe("--ok-palette-primary-main");
    expect(textOf(result)).toContain("## Tailwind utilities");
    const spacing = await session.call("search_tokens", { query: "spacing" });
    expect(textOf(spacing)).toContain("Spacing scale");
  });

  it("applies the limit per kind and reports misses", async () => {
    const result = await session.call("search_tokens", { query: "ok", limit: 3 });
    const data = structured<{ total: number; variables: unknown[] }>(result);
    expect(data.variables).toHaveLength(3);
    expect(data.total).toBeGreaterThan(3);
    expect(textOf(result)).toContain("showing up to 3 per kind");
    const none = await session.call("search_tokens", { query: "unicorn" });
    expect(textOf(none)).toContain("Groups:");
  });

  it("formats values that only exist in one scheme", async () => {
    const tokens = manifest().tokens.variables;
    const darkOnly = { name: "--ok-test-dark", group: "test", dark: "#000" };
    const lightOnly = { name: "--ok-test-light", group: "test", light: "#fff" };
    const other = await connect({
      manifest: {
        ...manifest(),
        tokens: { ...manifest().tokens, variables: [...tokens, darkOnly, lightOnly] },
      },
    });
    try {
      const text = textOf(await other.call("search_tokens", { query: "--ok-test" }));
      expect(text).toContain("`--ok-test-dark` (dark #000)");
      expect(text).toContain("`--ok-test-light` (light #fff)");
    } finally {
      await other.close();
    }
  });
});

describe("get_guide", () => {
  it("lists the guides without an id", async () => {
    const result = await session.call("get_guide");
    const { guides } = structured<{ guides: { id: string; kind: string }[] }>(result);
    expect(guides.map((g) => g.id)).toEqual(
      expect.arrayContaining(["introduction", "foundations-colors", "button"]),
    );
  });

  it.each([
    ["foundations-colors", "foundations-colors"],
    ["colors", "foundations-colors"],
    ["Foundations/Shadows", "foundations-shadows"],
    ["IconButton", "icon-button"],
    ["introduction", "introduction"],
  ])("returns %s section by section", async (id, expected) => {
    const result = await session.call("get_guide", { id });
    const data = structured<{ id: string; sections: { body: string }[] }>(result);
    expect(data.id).toBe(expected);
    expect(data.sections.length).toBeGreaterThan(0);
  });

  it("returns one section with its code", async () => {
    const guide = manifest().guides.find((g) => g.id === "button");
    const section = guide?.sections.find((s) => s.html && s.react);
    const result = await session.call("get_guide", { id: "button", section: section?.title });
    const data = structured<{ component: string; sections: { id: string }[] }>(result);
    expect(data.component).toBe("button");
    expect(data.sections.map((s) => s.id)).toEqual([section?.id]);
    expect(textOf(result)).toContain("```html");
    expect(textOf(result)).toContain("```tsx");
  });

  it("reports unknown guides and sections", async () => {
    const guide = await session.call("get_guide", { id: "colours" });
    expect(guide.isError).toBe(true);
    expect(textOf(guide)).toContain("Did you mean");
    const far = await session.call("get_guide", { id: "qqqqqqqqqqqqq" });
    expect(textOf(far)).not.toContain("Did you mean");
    const section = await session.call("get_guide", { id: "button", section: "nope" });
    expect(section.isError).toBe(true);
    expect(textOf(section)).toContain("Sections:");
  });
});

describe("validate_markup", () => {
  it("accepts canonical markup", async () => {
    const result = await session.call("validate_markup", {
      markup:
        '<button type="button" data-ok-button data-ok-variant="contained"><span data-ok-button-label>Save</span></button>',
      component: "Button",
    });
    expect(structured<{ valid: boolean }>(result)).toMatchObject({ valid: true, errorCount: 0 });
    expect(textOf(result)).toContain("Valid: 2 elements");
  });

  it("reports every rule with positions", async () => {
    const result = await session.call("validate_markup", {
      markup: [
        '<button data-ok-button data-ok-variant="filled" data-ok-full-width="false">',
        "  <span data-ok-buton-label>Save</span>",
        "</button>",
        "<span data-ok-switch-thumb></span>",
      ].join("\n"),
    });
    const data = structured<{ valid: boolean; issues: { rule: string; line: number }[] }>(result);
    expect(data.valid).toBe(false);
    expect(data.issues.map((issue) => issue.rule).sort()).toEqual([
      "flag-value",
      "invalid-value",
      "missing-part",
      "orphan-part",
      "unknown-attribute",
    ]);
    expect(data.issues.find((i) => i.rule === "unknown-attribute")?.line).toBe(2);
    expect(textOf(result)).toContain("Invalid: 3 errors and 2 warnings");
    expect(textOf(result)).toContain("(line 1, column 1, <button>)");
  });

  it("requires the component's root when asked", async () => {
    const result = await session.call("validate_markup", {
      markup: "<p>Hello</p>",
      component: "dialog",
    });
    expect(structured<{ issues: { rule: string }[] }>(result).issues[0]?.rule).toBe("missing-root");
    const list = await session.call("validate_markup", { markup: "<p></p>", component: "list" });
    expect(textOf(list)).toContain("any of data-ok-list, data-ok-list-item");
    const unknown = await session.call("validate_markup", { markup: "<p></p>", component: "x1" });
    expect(unknown.isError).toBe(true);
  });

  it("refuses markup over the size limit", async () => {
    const result = await session.call("validate_markup", { markup: "a".repeat(MAX_MARKUP + 1) });
    expect(result.isError).toBe(true);
    expect(textOf(result)).toMatch(/200000|too_big|Too big|at most/i);
  });
});

describe("invalid input", () => {
  it.each([
    ["get_component", {}],
    ["get_component", { name: 42 }],
    ["get_component", { name: "" }],
    ["get_examples", { component: "button", framework: "vue" }],
    ["search_tokens", { query: "a", limit: 0 }],
    ["search_tokens", { query: "a", limit: 500 }],
    ["list_components", { query: "x".repeat(201) }],
    ["validate_markup", {}],
  ])("%s rejects %j", async (name, args) => {
    const result = await session.call(name, args);
    expect(result.isError).toBe(true);
    expect(textOf(result)).toMatch(/invalid|validation/i);
  });

  it("treats hostile names and markup as plain text", async () => {
    for (const name of ["__proto__", "constructor", "toString", '"><img src=x onerror=alert(1)>'])
      expect((await session.call("get_component", { name })).isError).toBe(true);
    expect((await session.call("get_guide", { id: "__proto__" })).isError).toBe(true);
    const markup =
      '<img src=x onerror="globalThis.owned=1"><script>globalThis.owned=1</script><div data-ok-__proto__="1" data-ok-button="constructor"></div>';
    const result = await session.call("validate_markup", { markup });
    expect(result.isError).toBeFalsy();
    expect((globalThis as { owned?: number }).owned).toBeUndefined();
    expect(({} as Record<string, unknown>)["1"]).toBeUndefined();
  });

  it("rejects unknown tools", async () => {
    const result = await session.call("delete_everything");
    expect(result.isError).toBe(true);
  });
});

describe("resources", () => {
  it("lists components and guides through templates, plus the tokens", async () => {
    const { resources } = await session.client.listResources();
    const uris = resources.map((r) => r.uri);
    expect(uris).toContain("owlky://tokens");
    expect(uris).toContain("owlky://components/button");
    expect(uris).toContain("owlky://guides/foundations-colors");
    const { resourceTemplates } = await session.client.listResourceTemplates();
    expect(resourceTemplates.map((t) => t.uriTemplate).sort()).toEqual([
      "owlky://components/{name}",
      "owlky://guides/{id}",
    ]);
  });

  it("reads a component, a guide and the tokens", async () => {
    const read = async (uri: string) => {
      const [content] = (await session.client.readResource({ uri })).contents;
      return {
        mimeType: content?.mimeType,
        text: content && "text" in content ? content.text : "",
      };
    };
    const component = await read("owlky://components/dialog");
    expect(component.mimeType).toBe("text/markdown");
    expect(component.text).toContain("# Dialog");
    expect((await read("owlky://guides/foundations-colors")).text).toContain("# Colors");
    const tokens = await read("owlky://tokens");
    expect(tokens.mimeType).toBe("application/json");
    const data = JSON.parse(tokens.text);
    expect(data.variables.length).toBe(manifest().tokens.variables.length);
    expect(data.version).toBe(manifest().version);
  });

  it("refuses unknown resources", async () => {
    await expect(session.client.readResource({ uri: "owlky://components/nope" })).rejects.toThrow(
      /Unknown component/,
    );
    await expect(session.client.readResource({ uri: "owlky://guides/nope" })).rejects.toThrow(
      /Unknown guide/,
    );
    await expect(session.client.readResource({ uri: "file:///etc/passwd" })).rejects.toThrow();
  });

  it("completes template variables", async () => {
    const names = await session.client.complete({
      ref: { type: "ref/resource", uri: "owlky://components/{name}" },
      argument: { name: "name", value: "butt" },
    });
    expect(names.completion.values).toContain("button");
    const ids = await session.client.complete({
      ref: { type: "ref/resource", uri: "owlky://guides/{id}" },
      argument: { name: "id", value: "colors" },
    });
    expect(ids.completion.values).toContain("foundations-colors");
  });
});

describe("prompts", () => {
  it("offers HTML and React prompts that point at the tools", async () => {
    const { prompts } = await session.client.listPrompts();
    expect(prompts.map((p) => p.name).sort()).toEqual(["build-html-page", "build-react-page"]);
    for (const name of ["build-html-page", "build-react-page"]) {
      const prompt = await session.client.getPrompt({
        name,
        arguments: { task: "A sign-in form" },
      });
      const message = prompt.messages[0]?.content;
      const body = message?.type === "text" ? message.text : "";
      expect(body).toContain("A sign-in form");
      for (const tool of ["list_components", "get_component", "get_examples", "search_tokens"])
        expect(body).toContain(tool);
      expect(body).toContain("validate_markup");
    }
  });
});

describe("sparse data", () => {
  const bare: Manifest["components"][number] = {
    name: "bare",
    title: "Bare",
    summary: "A component with nothing else.",
    react: [],
    schemas: [],
    sections: [],
    requiredParts: {},
    related: [],
    stories: [],
    snippets: {},
  };
  const custom = (): Manifest => ({
    ...manifest(),
    components: [...manifest().components, bare],
    tokens: {
      ...manifest().tokens,
      tailwind: [
        ...manifest().tokens.tailwind,
        { name: "--x-plain", value: "1px", utilities: ["x-plain"] },
      ],
    },
  });

  it("answers for a component without root, React exports, reference, guide or stories", async () => {
    const other = await connect({ manifest: custom() });
    try {
      const list = await other.call("list_components", { query: "nothing else" });
      expect(textOf(list)).toContain("- **Bare** (`bare`): A component with nothing else.");
      expect(structured<{ components: object[] }>(list).components[0]).not.toHaveProperty("root");
      const component = structured(await other.call("get_component", { name: "bare" }));
      expect(component).not.toHaveProperty("root");
      expect(component).not.toHaveProperty("referenceUrl");
      expect(component).not.toHaveProperty("guide");
      const story = await other.call("get_examples", { component: "bare", story: "x" });
      expect(textOf(story)).toContain("Stories: none.");
      const guide = await other.call("get_guide", { id: "bare" });
      expect(guide.isError).toBe(true);
      const tokens = await other.call("search_tokens", { query: "x-plain" });
      expect(textOf(tokens)).toContain("- `x-plain` → 1px");
    } finally {
      await other.close();
    }
  });

  it("lists the stories of a large component with both lengths", async () => {
    const result = await session.call("get_examples", {
      component: "data-grid",
      framework: "html",
    });
    const data = structured<{ stories: { htmlLength: number; reactLength: number }[] }>(result);
    expect(data.stories[0]?.reactLength).toBeGreaterThan(0);
  });

  it("reports warnings of valid markup and long issue lists", async () => {
    const warned = await session.call("validate_markup", {
      markup:
        '<button data-ok-button data-ok-full-width="false"><span data-ok-button-label>A</span></button>',
    });
    expect(textOf(warned)).toContain("no errors, 1 warnings");
    expect(textOf(warned)).toContain('remove it instead of writing "false"');
    const many = await session.call("validate_markup", {
      markup: "<i data-ok-nothing-here></i>".repeat(250),
    });
    expect(textOf(many)).toContain("(More issues were found than listed.)");
  });

  it("loads the shipped manifest by default", async () => {
    const { createOwlkyServer } = await import("./server.js");
    expect(createOwlkyServer().isConnected()).toBe(false);
  });
});
