import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import * as z from "zod";
import { componentMarkdown, guideMarkdown, storyMarkdown } from "./format.js";
import {
  loadManifest,
  type Manifest,
  type ManifestComponent,
  type ManifestGuide,
  type ManifestSection,
  type ManifestToken,
  type ManifestUtility,
} from "./manifest.js";
import { matchesAll, normalizeName, suggest } from "./search.js";
import { createValidator, MAX_MARKUP } from "./validate.js";

/*
 * The Owlky MCP server (ADR-0046): six read-only tools, three resource kinds and two prompts,
 * all answered from the manifest. No network, no file access besides the manifest, no evaluation
 * of input.
 */

/** Without a `story`, `get_examples` lists the stories instead once their code is this long. */
export const MAX_EXAMPLES = 80_000;
/** Longest free-text query. */
const MAX_QUERY = 200;

const INSTRUCTIONS = `Owlky is an accessible UI component library used in plain HTML (data-ok-* attributes, one stylesheet, an optional runtime) or through framework packages such as @owlky/react. Look up the real API here instead of guessing: list_components to find a component, get_component for its options (React prop, HTML attribute, values, default), anatomy, states, keyboard and accessibility, get_examples for copyable HTML and React code, search_tokens for --ok-* CSS variables and Tailwind utilities, get_guide for foundations (colors, typography, shadows, grid, icons, settings) and component guides, and validate_markup to check HTML you wrote.`;

const READ_ONLY = { readOnlyHint: true, openWorldHint: false, idempotentHint: true } as const;

const text = (value: string) => ({ type: "text" as const, text: value });
const failure = (message: string): CallToolResult => ({ isError: true, content: [text(message)] });

const sectionOf = (sections: readonly ManifestSection[], prefix: string) =>
  sections.find((section) => section.id === prefix || section.id.startsWith(`${prefix}-`));
const NAMED_SECTIONS = {
  anatomy: "anatomy",
  states: "states",
  behavior: "behavior",
  keyboard: "keyboard",
  accessibility: "accessibility",
  events: "events",
  parityNotes: "parity",
} as const;

// Output schemas: what `structuredContent` holds.
const optionShape = z.object({
  prop: z.string(),
  attribute: z.string(),
  kind: z.string(),
  description: z.string(),
  values: z.array(z.string()).optional(),
  default: z.union([z.string(), z.number(), z.boolean()]).optional(),
  optional: z.boolean().optional(),
  when: z.string().optional(),
  children: z.string().optional(),
  min: z.number().optional(),
  units: z.array(z.string()).optional(),
  event: z.string().optional(),
});
const sectionShape = z.object({ id: z.string(), title: z.string(), body: z.string() });
const componentSummaryShape = z.object({
  name: z.string(),
  title: z.string(),
  summary: z.string(),
  react: z.array(z.string()),
  root: z.string().optional(),
});
const storyShape = z.object({
  id: z.string(),
  name: z.string(),
  html: z.string().optional(),
  react: z.string().optional(),
  snippets: z.array(z.string()).optional(),
  htmlLength: z.number().optional(),
  reactLength: z.number().optional(),
});
const tokenShape = z.object({
  name: z.string(),
  group: z.string(),
  value: z.string().optional(),
  light: z.string().optional(),
  dark: z.string().optional(),
});
const utilityShape = z.object({
  name: z.string(),
  value: z.string(),
  token: z.string().optional(),
  utilities: z.array(z.string()),
  note: z.string().optional(),
});
const guideSectionShape = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
  html: z.string().optional(),
  react: z.string().optional(),
});
const issueShape = z.object({
  severity: z.enum(["error", "warning"]),
  rule: z.string(),
  message: z.string(),
  line: z.number(),
  column: z.number(),
  tag: z.string().optional(),
  attribute: z.string().optional(),
  suggestions: z.array(z.string()).optional(),
});

export interface OwlkyServerOptions {
  /** Defaults to the manifest that ships with the package. */
  manifest?: Manifest;
}

export function createOwlkyServer(options: OwlkyServerOptions = {}): McpServer {
  const manifest = options.manifest ?? loadManifest();
  const validator = createValidator(manifest);

  // Lookups: names, titles, React exports, schema names and roots all lead to a component.
  const components = new Map(manifest.components.map((c) => [c.name, c]));
  const aliases = new Map<string, ManifestComponent>();
  for (const component of manifest.components) {
    const keys = [
      component.title,
      ...component.react,
      ...component.schemas.flatMap((schema) => [schema.name, schema.root.slice("data-ok-".length)]),
    ];
    for (const key of keys) {
      const alias = normalizeName(key);
      if (!components.has(alias) && !aliases.has(alias)) aliases.set(alias, component);
    }
  }
  const findComponent = (input: string) => {
    const key = normalizeName(input.replace(/^data-ok-/, ""));
    return components.get(key) ?? aliases.get(key);
  };
  const lookupKeys = [...components.keys(), ...aliases.keys()];
  const unknownComponent = (input: string) => {
    const close = [
      ...new Set(
        suggest(normalizeName(input), lookupKeys, 10).map((key) => findComponent(key)?.name),
      ),
    ].slice(0, 5);
    return failure(
      `Unknown component "${input}".${close.length ? ` Did you mean ${close.map((name) => `"${name}"`).join(", ")}?` : ""} Call list_components to see every component.`,
    );
  };

  const guides = new Map(manifest.guides.map((guide) => [guide.id, guide]));
  const findGuide = (input: string): ManifestGuide | undefined => {
    const key = normalizeName(input);
    const component = findComponent(input);
    return (
      guides.get(key) ??
      guides.get(`foundations-${key.replace(/^foundations-/, "")}`) ??
      (component?.guide !== undefined ? guides.get(component.guide) : undefined)
    );
  };

  const server = new McpServer(
    { name: "owlky", title: "Owlky", version: manifest.version },
    { instructions: INSTRUCTIONS },
  );

  // ── list_components ──────────────────────────────────────────────────────────────────────────
  server.registerTool(
    "list_components",
    {
      title: "List components",
      description:
        "Lists every Owlky component with its name, title, summary, React exports and HTML root attribute. Pass `query` to filter (every word must match).",
      inputSchema: {
        query: z
          .string()
          .max(MAX_QUERY)
          .optional()
          .describe('Words to filter by, such as "date" or "dialog"'),
      },
      outputSchema: {
        version: z.string(),
        count: z.number(),
        components: z.array(componentSummaryShape),
      },
      annotations: READ_ONLY,
    },
    ({ query }) => {
      const found = manifest.components
        .filter(
          (c) => !query || matchesAll(query, [c.name, c.title, c.summary, c.root, ...c.react]),
        )
        .map((c) => ({
          name: c.name,
          title: c.title,
          summary: c.summary,
          react: [...c.react],
          ...(c.root ? { root: c.root } : {}),
        }));
      const lines = found.map(
        (c) =>
          `- **${c.title}** (\`${c.name}\`${c.root ? `, \`${c.root}\`` : ""}${c.react.length ? `; React: ${c.react.slice(0, 6).join(", ")}${c.react.length > 6 ? ", …" : ""}` : ""}): ${c.summary}`,
      );
      return {
        content: [
          text(
            found.length
              ? `${found.length} Owlky ${manifest.version} components${query ? ` matching "${query}"` : ""}:\n\n${lines.join("\n")}`
              : `No component matches "${query}". Call list_components without a query to see all.`,
          ),
        ],
        structuredContent: { version: manifest.version, count: found.length, components: found },
      };
    },
  );

  // ── get_component ────────────────────────────────────────────────────────────────────────────
  server.registerTool(
    "get_component",
    {
      title: "Get a component",
      description:
        "Returns one component's API: options (React prop, HTML data-ok-* attribute, values, default), anatomy, states, behavior, keyboard, accessibility, events, parity notes, required parts, related components and its example stories. Accepts a name, title or React export (`icon-button`, `Icon button`, `IconButton`).",
      inputSchema: {
        name: z
          .string()
          .min(1)
          .max(MAX_QUERY)
          .describe('Component, such as "button" or "DatePicker"'),
      },
      outputSchema: {
        name: z.string(),
        title: z.string(),
        summary: z.string(),
        referenceUrl: z.string().optional(),
        root: z.string().optional(),
        react: z.array(z.string()),
        options: z.array(
          z.object({ schema: z.string(), root: z.string(), options: z.array(optionShape) }),
        ),
        anatomy: z.string().optional(),
        states: z.string().optional(),
        behavior: z.string().optional(),
        keyboard: z.string().optional(),
        accessibility: z.string().optional(),
        events: z.string().optional(),
        parityNotes: z.string().optional(),
        otherSections: z.array(sectionShape),
        requiredParts: z.record(z.string(), z.array(z.string())),
        related: z.array(z.string()),
        guide: z.string().optional(),
        stories: z.array(z.object({ id: z.string(), name: z.string() })),
      },
      annotations: READ_ONLY,
    },
    ({ name }) => {
      const component = findComponent(name);
      if (!component) return unknownComponent(name);
      const named: Record<string, string> = {};
      const used = new Set<ManifestSection>();
      for (const [key, prefix] of Object.entries(NAMED_SECTIONS)) {
        const section = sectionOf(component.sections, prefix);
        if (!section) continue;
        named[key] = section.body;
        used.add(section);
      }
      const other = component.sections.filter(
        (section) => !used.has(section) && section.id !== "purpose",
      );
      const structured = {
        name: component.name,
        title: component.title,
        summary: component.summary,
        ...(component.referenceUrl ? { referenceUrl: component.referenceUrl } : {}),
        ...(component.root ? { root: component.root } : {}),
        react: [...component.react],
        options: component.schemas.map((schema) => ({
          schema: schema.name,
          root: schema.root,
          options: schema.options.map(({ name: prop, attr, ...rest }) => ({
            prop,
            attribute: attr,
            ...rest,
            ...(rest.values ? { values: [...rest.values] } : {}),
            ...(rest.units ? { units: [...rest.units] } : {}),
          })),
        })),
        ...named,
        otherSections: other.map((section) => ({ ...section })),
        requiredParts: Object.fromEntries(
          Object.entries(component.requiredParts).map(([root, parts]) => [root, [...parts]]),
        ),
        related: [...component.related],
        ...(component.guide ? { guide: component.guide } : {}),
        stories: component.stories.map((story) => ({ id: story.id, name: story.name })),
      };
      const ordered = [
        ...Object.values(NAMED_SECTIONS)
          .map((prefix) => sectionOf(component.sections, prefix))
          .filter((section): section is ManifestSection => section !== undefined),
        ...other,
      ];
      return {
        content: [text(componentMarkdown(component, ordered))],
        structuredContent: structured,
      };
    },
  );

  // ── get_examples ─────────────────────────────────────────────────────────────────────────────
  server.registerTool(
    "get_examples",
    {
      title: "Get examples",
      description: `Returns a component's example stories as copyable code: the HTML snippet (with the stylesheet and script it needs) and / or the React source. Pass \`story\` (id or name) for one story; without it, components whose code is longer than ${MAX_EXAMPLES} characters return the list of stories instead.`,
      inputSchema: {
        component: z.string().min(1).max(MAX_QUERY).describe('Component, such as "dialog"'),
        framework: z
          .enum(["html", "react", "both"])
          .default("both")
          .describe("Which code to return"),
        story: z
          .string()
          .min(1)
          .max(MAX_QUERY)
          .optional()
          .describe('Story id or name, such as "Basic"'),
      },
      outputSchema: {
        component: z.string(),
        framework: z.enum(["html", "react", "both"]),
        stories: z.array(storyShape),
        listOnly: z.boolean(),
        unlistedSnippets: z.array(z.object({ file: z.string(), html: z.string() })).optional(),
      },
      annotations: READ_ONLY,
    },
    ({ component: name, framework, story: wanted }) => {
      const component = findComponent(name);
      if (!component) return unknownComponent(name);
      const html = framework !== "react";
      const react = framework !== "html";
      let stories = component.stories;
      if (wanted !== undefined) {
        const key = normalizeName(wanted);
        const match = stories.find(
          (story) =>
            story.id === wanted ||
            normalizeName(story.name) === key ||
            story.id.endsWith(`--${key}`),
        );
        if (!match) {
          const close = suggest(
            wanted,
            stories.map((story) => story.name),
          );
          return failure(
            `${component.title} has no story "${wanted}".${close.length ? ` Did you mean ${close.map((s) => `"${s}"`).join(", ")}?` : ""} Stories: ${stories.map((story) => story.name).join(", ") || "none"}.`,
          );
        }
        stories = [match];
      }
      const size = stories.reduce(
        (total, story) => total + (html ? story.html.length : 0) + (react ? story.react.length : 0),
        0,
      );
      const listOnly = wanted === undefined && size > MAX_EXAMPLES;
      const entries = stories.map((story) =>
        listOnly
          ? {
              id: story.id,
              name: story.name,
              htmlLength: story.html.length,
              reactLength: story.react.length,
            }
          : {
              id: story.id,
              name: story.name,
              ...(html ? { html: story.html, snippets: [...story.snippets] } : {}),
              ...(react ? { react: story.react } : {}),
            },
      );
      const unlisted = Object.entries(component.snippets).map(([file, markup]) => ({
        file,
        html: markup,
      }));
      const includeUnlisted = html && !listOnly && wanted === undefined && unlisted.length > 0;
      const body = listOnly
        ? `${component.title} has ${stories.length} stories (${size} characters of code). Call get_examples again with \`story\` set to one of:\n\n${stories.map((story) => `- ${story.name} (\`${story.id}\`)`).join("\n")}`
        : [
            stories.length
              ? `# ${component.title} examples`
              : `${component.title} has no stories of its own; it is shown inside ${component.related.join(", ") || "other components"}.`,
            ...entries.map(storyMarkdown),
            ...(includeUnlisted
              ? unlisted.map(
                  (snippet) =>
                    `## Snippet ${snippet.file}\n\n\`\`\`html\n${snippet.html.trim()}\n\`\`\``,
                )
              : []),
          ].join("\n\n");
      return {
        content: [text(body)],
        structuredContent: {
          component: component.name,
          framework,
          stories: entries,
          listOnly,
          ...(includeUnlisted ? { unlistedSnippets: unlisted } : {}),
        },
      };
    },
  );

  // ── search_tokens ────────────────────────────────────────────────────────────────────────────
  const tokenText = (token: ManifestToken) => {
    const schemes = [
      token.light !== undefined ? `light ${token.light}` : "",
      token.dark !== undefined ? `dark ${token.dark}` : "",
    ].filter(Boolean);
    return `- \`${token.name}\`${token.value !== undefined ? `: ${token.value}` : ""}${schemes.length ? ` (${schemes.join(", ")})` : ""}`;
  };
  const utilityText = (utility: ManifestUtility) =>
    `- ${utility.utilities.map((u) => `\`${u}\``).join(", ")} → ${utility.token ? `\`${utility.token}\`` : utility.value}${utility.note ? ` (${utility.note})` : ""}`;
  server.registerTool(
    "search_tokens",
    {
      title: "Search tokens",
      description:
        'Searches the design tokens: --ok-* CSS variables (group, value, light / dark values) and the Tailwind utilities of @owlky/styles/theme.css. Every word of `query` must match a name, group, value or utility, such as "primary main", "shadow card", "radius" or "bg-primary".',
      inputSchema: {
        query: z.string().min(1).max(MAX_QUERY).describe("Words to search for"),
        limit: z.number().int().min(1).max(200).default(50).describe("Results per kind"),
      },
      outputSchema: {
        query: z.string(),
        total: z.number(),
        variables: z.array(tokenShape),
        tailwind: z.array(utilityShape),
      },
      annotations: READ_ONLY,
    },
    ({ query, limit }) => {
      const key = query.trim().toLowerCase();
      const rank = (name: string) => (name === key ? 0 : name.includes(key) ? 1 : 2);
      const variables = manifest.tokens.variables
        .filter((t) => matchesAll(query, [t.name, t.group, t.value, t.light, t.dark]))
        .sort((a, b) => rank(a.name) - rank(b.name));
      const tailwind = manifest.tokens.tailwind
        .filter((u) => matchesAll(query, [u.name, u.value, u.token, ...u.utilities]))
        .sort((a, b) => rank(a.name) - rank(b.name));
      const total = variables.length + tailwind.length;
      const shownVariables = variables.slice(0, limit).map((t) => ({ ...t }));
      const shownTailwind = tailwind
        .slice(0, limit)
        .map((u) => ({ ...u, utilities: [...u.utilities] }));
      const body = total
        ? [
            `${total} matches for "${query}"${variables.length > limit || tailwind.length > limit ? ` (showing up to ${limit} per kind)` : ""}.`,
            shownVariables.length
              ? `## CSS variables\n\n${shownVariables.map(tokenText).join("\n")}`
              : "",
            shownTailwind.length
              ? `## Tailwind utilities (@owlky/styles/theme.css)\n\n${shownTailwind.map(utilityText).join("\n")}`
              : "",
          ]
            .filter(Boolean)
            .join("\n\n")
        : `No token matches "${query}". Groups: ${[...new Set(manifest.tokens.variables.map((t) => t.group))].join(", ")}.`;
      return {
        content: [text(body)],
        structuredContent: { query, total, variables: shownVariables, tailwind: shownTailwind },
      };
    },
  );

  // ── get_guide ────────────────────────────────────────────────────────────────────────────────
  server.registerTool(
    "get_guide",
    {
      title: "Get a guide",
      description:
        'Returns a usage guide section by section, with HTML and React code: the Introduction, a foundation ("colors", "typography", "shadows", "grid", "icons", "settings", "illustrations") or a component guide ("button"). Without `id`, lists the guides. Pass `section` for one section.',
      inputSchema: {
        id: z.string().min(1).max(MAX_QUERY).optional().describe('Guide id, such as "colors"'),
        section: z.string().min(1).max(MAX_QUERY).optional().describe("Section id or title"),
      },
      outputSchema: {
        guides: z
          .array(z.object({ id: z.string(), title: z.string(), kind: z.string() }))
          .optional(),
        id: z.string().optional(),
        title: z.string().optional(),
        kind: z.string().optional(),
        component: z.string().optional(),
        sections: z.array(guideSectionShape).optional(),
      },
      annotations: READ_ONLY,
    },
    ({ id, section }) => {
      if (id === undefined) {
        const list = manifest.guides.map((g) => ({ id: g.id, title: g.title, kind: g.kind }));
        return {
          content: [
            text(
              `${list.length} guides:\n\n${list.map((g) => `- ${g.title} (\`${g.id}\`, ${g.kind})`).join("\n")}`,
            ),
          ],
          structuredContent: { guides: list },
        };
      }
      const guide = findGuide(id);
      if (!guide) {
        const close = [
          ...new Set(
            suggest(normalizeName(id), [
              ...guides.keys(),
              ...[...guides.keys()].map((key) => key.replace(/^foundations-/, "")),
            ]).map((key) => findGuide(key)?.id),
          ),
        ];
        return failure(
          `Unknown guide "${id}".${close.length ? ` Did you mean ${close.map((g) => `"${g}"`).join(", ")}?` : ""} Call get_guide without an id to list the guides.`,
        );
      }
      let sections = guide.sections;
      if (section !== undefined) {
        const key = normalizeName(section);
        const match = sections.find((s) => s.id === section || normalizeName(s.title) === key);
        if (!match) {
          return failure(
            `${guide.title} has no section "${section}". Sections: ${sections.map((s) => `${s.title} (${s.id})`).join(", ")}.`,
          );
        }
        sections = [match];
      }
      return {
        content: [text(guideMarkdown(guide, sections))],
        structuredContent: {
          id: guide.id,
          title: guide.title,
          kind: guide.kind,
          ...(guide.component ? { component: guide.component } : {}),
          sections: sections.map((s) => ({ ...s })),
        },
      };
    },
  );

  // ── validate_markup ──────────────────────────────────────────────────────────────────────────
  server.registerTool(
    "validate_markup",
    {
      title: "Validate markup",
      description: `Checks Owlky HTML against the anatomy: unknown data-ok-* names, values outside an option's allowlist, missing required parts, parts outside their root and presence attributes with values. Pass \`component\` to also require one of its roots. The markup is only scanned as text (never rendered or executed); at most ${MAX_MARKUP} characters.`,
      inputSchema: {
        markup: z.string().min(1).max(MAX_MARKUP).describe("HTML to check"),
        component: z
          .string()
          .min(1)
          .max(MAX_QUERY)
          .optional()
          .describe("Component the markup must contain"),
      },
      outputSchema: {
        valid: z.boolean(),
        errorCount: z.number(),
        warningCount: z.number(),
        elementCount: z.number(),
        truncated: z.boolean(),
        issues: z.array(issueShape),
      },
      annotations: READ_ONLY,
    },
    ({ markup, component: name }) => {
      let roots: string[] = [];
      if (name !== undefined) {
        const component = findComponent(name);
        if (!component) return unknownComponent(name);
        roots = [...new Set(component.schemas.map((schema) => schema.root))];
      }
      const result = validator.validate(markup, roots);
      const lines = result.issues.map(
        (issue) =>
          `- ${issue.severity} ${issue.rule}${issue.line ? ` (line ${issue.line}, column ${issue.column}, <${issue.tag}>)` : ""}: ${issue.message}`,
      );
      const summary = result.valid
        ? `Valid: ${result.elementCount} elements, no errors${result.warningCount ? `, ${result.warningCount} warnings` : ""}.`
        : `Invalid: ${result.errorCount} errors and ${result.warningCount} warnings in ${result.elementCount} elements.`;
      return {
        content: [
          text(
            [summary, ...lines, result.truncated ? "(More issues were found than listed.)" : ""]
              .filter(Boolean)
              .join("\n"),
          ),
        ],
        structuredContent: {
          ...result,
          issues: result.issues.map((issue) => ({
            ...issue,
            ...(issue.suggestions ? { suggestions: [...issue.suggestions] } : {}),
          })),
        },
      };
    },
  );

  // ── Resources ────────────────────────────────────────────────────────────────────────────────
  server.registerResource(
    "component",
    new ResourceTemplate("owlky://components/{name}", {
      list: () => ({
        resources: manifest.components.map((c) => ({
          uri: `owlky://components/${c.name}`,
          name: c.name,
          title: c.title,
          description: c.summary,
          mimeType: "text/markdown",
        })),
      }),
      complete: { name: (value) => suggest(value, components.keys(), 20) },
    }),
    {
      title: "Owlky component",
      description: "A component's options, spec sections and example list (Markdown).",
      mimeType: "text/markdown",
    },
    (uri, { name }) => {
      const component = components.get(String(name));
      if (!component) throw new Error(`Unknown component resource ${uri.href}.`);
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "text/markdown",
            text: componentMarkdown(component, component.sections),
          },
        ],
      };
    },
  );
  server.registerResource(
    "tokens",
    "owlky://tokens",
    {
      title: "Owlky tokens",
      description: "Every --ok-* CSS variable and the Tailwind theme utilities (JSON).",
      mimeType: "application/json",
    },
    (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify({ version: manifest.version, ...manifest.tokens }),
        },
      ],
    }),
  );
  server.registerResource(
    "guide",
    new ResourceTemplate("owlky://guides/{id}", {
      list: () => ({
        resources: manifest.guides.map((g) => ({
          uri: `owlky://guides/${g.id}`,
          name: g.id,
          title: g.title,
          mimeType: "text/markdown",
        })),
      }),
      complete: { id: (value) => suggest(value, guides.keys(), 20) },
    }),
    {
      title: "Owlky guide",
      description: "A usage guide with HTML and React code (Markdown).",
      mimeType: "text/markdown",
    },
    (uri, { id }) => {
      const guide = guides.get(String(id));
      if (!guide) throw new Error(`Unknown guide resource ${uri.href}.`);
      return {
        contents: [
          { uri: uri.href, mimeType: "text/markdown", text: guideMarkdown(guide, guide.sections) },
        ],
      };
    },
  );

  // ── Prompts ──────────────────────────────────────────────────────────────────────────────────
  const steps = (framework: "html" | "react") =>
    [
      "Use the Owlky MCP tools instead of guessing names, props, attributes or tokens:",
      "1. Call list_components (with a query) to find the components the page needs.",
      `2. Call get_component for each one: use only the ${framework === "html" ? "data-ok-* attributes and values" : "React props and values"} it lists, and follow its anatomy, keyboard and accessibility notes.`,
      `3. Call get_examples with framework "${framework}" and start from the closest example${framework === "html" ? " (it shows the stylesheet and the runtime script the page needs)" : " (imports come from @owlky/react, styles from @owlky/styles/owlky.css)"}.`,
      "4. Call search_tokens for colors, spacing, radius and shadows: use --ok-* variables (or the Tailwind utilities it lists), never hard-coded values.",
      '5. Call get_guide for foundations when you need them (for example "colors", "typography" or "settings" for themes).',
      framework === "html"
        ? "6. Call validate_markup on the HTML you wrote and fix every error before you finish."
        : "6. Keep every interactive part labeled; call validate_markup on any plain HTML you write.",
    ].join("\n");
  server.registerPrompt(
    "build-html-page",
    {
      title: "Build a page with Owlky (HTML)",
      description: "Build a page in plain HTML with Owlky's data-ok-* markup.",
      argsSchema: { task: z.string().max(2000).describe("What the page should do") },
    },
    ({ task }) => ({
      messages: [
        {
          role: "user",
          content: text(
            `Build this with Owlky in plain HTML (data-ok-* markup, owlky.css, owlky.js where a component needs behavior):\n\n${task}\n\n${steps("html")}`,
          ),
        },
      ],
    }),
  );
  server.registerPrompt(
    "build-react-page",
    {
      title: "Build a page with Owlky (React)",
      description: "Build a page in React with @owlky/react components.",
      argsSchema: { task: z.string().max(2000).describe("What the page should do") },
    },
    ({ task }) => ({
      messages: [
        {
          role: "user",
          content: text(
            `Build this with Owlky in React (@owlky/react components, @owlky/styles/owlky.css):\n\n${task}\n\n${steps("react")}`,
          ),
        },
      ],
    }),
  );

  return server;
}
