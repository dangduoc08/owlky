import type {
  ManifestApi,
  ManifestApiEntry,
  ManifestApiPart,
  ManifestComponent,
  ManifestGuide,
  ManifestGuideSection,
  ManifestOption,
  ManifestSchema,
  ManifestSection,
  ManifestStory,
} from "./manifest.js";

/* Markdown renderings of manifest entries: the text content of tool results and resources. */

const code = (value: string | number | boolean) => `\`${value}\``;
const cell = (value: string) => value.replaceAll("|", "\\|").replaceAll("\n", " ");

function htmlCell(option: ManifestOption): string {
  const where = option.children ? ` on each ${code(option.children.replace(":scope > ", ""))}` : "";
  switch (option.kind) {
    case "style":
    case "number":
      return `${code(`${option.attr}="…"`)}${where}`;
    case "behavior":
      return `${code(`${option.attr}="false"`)} turns it off`;
    case "state":
      return `${code(option.attr)}${option.event ? ` · event ${code(option.event)}` : ""}`;
    default:
      return `${code(option.attr)}${where}`;
  }
}

function valuesCell(option: ManifestOption): string {
  if (option.kind === "style") return (option.values ?? []).map(code).join(" ");
  if (option.kind === "number") {
    const min = option.min !== undefined ? ` ≥ ${option.min}` : "";
    return option.units
      ? `number (px) or ${option.units.map(code).join(" ")} length${min}`
      : `number${min}`;
  }
  return option.kind === "state" ? "—" : "boolean";
}

function defaultCell(option: ManifestOption): string {
  if (option.kind === "style") return option.optional ? "—" : code(String(option.default));
  if (option.kind === "behavior") return option.default ? "on" : "off";
  if (option.kind === "number") return option.default === undefined ? "—" : code(option.default);
  return option.kind === "state" ? "—" : "off";
}

/** The options table of one schema: React prop ↔ HTML attribute ↔ values ↔ default. */
export function optionsTable(schema: ManifestSchema): string {
  const rows = schema.options.map(
    (option) =>
      `| ${code(option.name)} | ${htmlCell(option)} | ${option.kind}${option.when ? ` (with ${code(option.when)})` : ""} | ${valuesCell(option)} | ${defaultCell(option)} | ${cell(option.description)} |`,
  );
  return [
    `### ${code(schema.name)} (root ${code(schema.root)})`,
    "",
    "| React prop | HTML | Kind | Values | Default | Description |",
    "|---|---|---|---|---|---|",
    ...rows,
  ].join("\n");
}

const sectionBlock = (section: ManifestSection | ManifestGuideSection) =>
  `## ${section.title}\n\n${section.body}`;

export function componentMarkdown(
  component: ManifestComponent,
  sections: readonly ManifestSection[],
): string {
  const facts = [
    component.root ? `HTML root: ${code(component.root)}` : undefined,
    component.react.length
      ? `React (\`@owlky/react\`): ${component.react.map(code).join(", ")}`
      : undefined,
    component.referenceUrl ? `Reference: ${component.referenceUrl}` : undefined,
    component.guide ? `Guide: ${code(component.guide)} (get_guide)` : undefined,
  ].filter(Boolean);
  const imports = component.imports;
  const importLines = imports
    ? [
        imports.react
          ? `- React: \`import { ${component.react.join(", ")} } from "${imports.react}"\``
          : "",
        imports.html ? `- HTML runtime (bundlers): ${code(imports.html)}` : "",
        imports.core ? `- Core: ${code(imports.core)}` : "",
        imports.css?.length
          ? `- CSS: ${imports.css.map(code).join(", ")}${imports.cdnModule ? " (the light components' sheet `@owlky/styles/owlky.css` lacks these: import them after it, or use `@owlky/styles/owlky-all.css`)" : ""}`
          : "",
        imports.cdnModule
          ? `- CDN: \`owlky.js\` loads \`modules/${imports.cdnModule}.css\` and then \`modules/${imports.cdnModule}.js\` when the page holds the component (\`data-ok-preload="${imports.cdnModule}"\` loads them ahead of use)`
          : "",
      ].filter(Boolean)
    : [];
  const parts = Object.entries(component.requiredParts).map(
    ([root, list]) => `- ${code(root)} needs ${list.map(code).join(", ")}`,
  );
  return [
    `# ${component.title} (${code(component.name)})`,
    component.summary,
    facts.map((fact) => `- ${fact}`).join("\n"),
    importLines.length ? `## Imports\n\n${importLines.join("\n")}` : "",
    component.schemas.length
      ? `## Options\n\nUnknown values fall back to the default.\n\n${component.schemas.map(optionsTable).join("\n\n")}`
      : "",
    ...sections.map(sectionBlock),
    parts.length ? `## Required parts\n\n${parts.join("\n")}` : "",
    component.related.length
      ? `## Related components\n\n${component.related.map(code).join(", ")}`
      : "",
    component.stories.length
      ? `## Examples\n\n${component.stories.map((story) => `- ${story.name} (${code(story.id)})`).join("\n")}\n\nCall get_examples with \`component: "${component.name}"\` for the code.`
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function storyMarkdown(
  story: Pick<ManifestStory, "id" | "name"> & Partial<ManifestStory>,
): string {
  return [
    `## ${story.name} (${code(story.id)})`,
    story.html !== undefined ? `### HTML\n\n\`\`\`html\n${story.html.trim()}\n\`\`\`` : "",
    story.react !== undefined ? `### React\n\n\`\`\`tsx\n${story.react.trim()}\n\`\`\`` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function guideMarkdown(
  guide: Pick<ManifestGuide, "id" | "title">,
  sections: readonly ManifestGuideSection[],
): string {
  return [
    `# ${guide.title} (${code(guide.id)})`,
    ...sections.map((section) =>
      [
        sectionBlock(section),
        section.html !== undefined ? `HTML:\n\n\`\`\`html\n${section.html.trim()}\n\`\`\`` : "",
        section.react !== undefined ? `React:\n\n\`\`\`tsx\n${section.react.trim()}\n\`\`\`` : "",
      ]
        .filter(Boolean)
        .join("\n\n"),
    ),
  ].join("\n\n");
}

const partKind = (part: ManifestApiPart) =>
  part.kind === "part"
    ? `element${part.elements?.length ? ` (${part.elements.map(code).join(" / ")})` : ""}`
    : part.kind === "value"
      ? `value: ${Array.isArray(part.value) ? part.value.map(code).join(" ") : "text"}`
      : part.kind === "trigger"
        ? "trigger (the target's id)"
        : "state";

const table = (head: readonly string[], rows: readonly string[]) =>
  [`| ${head.join(" | ")} |`, `|${head.map(() => "---|").join("")}`, ...rows].join("\n");

/** One entry of the API reference (a React component and its HTML part) as Markdown. */
export function apiEntryMarkdown(entry: ManifestApiEntry): string {
  const out = [`### ${entry.name}`];
  const description = entry.react?.description || entry.html?.description;
  if (description) out.push(description);
  const react = entry.react;
  if (react) {
    out.push(
      `React props${react.native ? ` (other props and the ref go to the native ${code(react.native)})` : ""}:`,
    );
    if (react.props.length)
      out.push(
        table(
          ["Prop", "Type", "Default", "Description"],
          react.props.map(
            (prop) =>
              `| ${code(prop.name)} | ${code(cell(prop.type))} | ${prop.required ? "required" : prop.default ? code(cell(prop.default)) : "—"} | ${cell(prop.description)} |`,
          ),
        ),
      );
  }
  const html = entry.html;
  if (html) {
    const on = html.elements?.length ? ` on ${html.elements.map(code).join(" / ")}` : "";
    const instance = html.runtime ? `; instance \`runtime.get(element, "${html.runtime}")\`` : "";
    out.push(`HTML: ${code(html.attribute)}${on}${instance}.`);
    if (html.options?.length)
      out.push(
        table(
          ["Attribute", "React prop", "Values", "Default", "Description"],
          html.options.map(
            (option) =>
              `| ${htmlCell(option)} | ${code(option.name)} | ${valuesCell(option)} | ${defaultCell(option)} | ${cell(option.description)} |`,
          ),
        ),
      );
    if (html.parts?.length)
      out.push(
        table(
          ["Part attribute", "Kind", "Description"],
          html.parts.map(
            (part) => `| ${code(part.name)} | ${partKind(part)} | ${cell(part.description)} |`,
          ),
        ),
      );
    if (html.events?.length)
      out.push(
        table(
          ["Event", "Detail", "Cancelable", "Description"],
          html.events.map(
            (event) =>
              `| ${code(event.name)} | ${code(cell(event.detail))} | ${event.cancelable === true ? "yes" : event.cancelable === false ? "no" : "sometimes"} | ${cell(event.description)} |`,
          ),
        ),
      );
    if (html.methods?.length)
      out.push(
        table(
          ["Member", "Type", "Description"],
          html.methods.map(
            (method) =>
              `| ${code(method.kind === "method" ? `${method.name}()` : method.name)} | ${code(cell(method.type))} | ${cell(method.description)} |`,
          ),
        ),
      );
  }
  return out.join("\n\n");
}

/** The API reference of a component (or of the entries given) as Markdown. */
export function apiMarkdown(
  api: ManifestApi,
  entries: readonly ManifestApiEntry[] = api.entries,
): string {
  const types = api.types ?? [];
  const css = api.css ?? [];
  return [
    "## API reference",
    ...entries.map(apiEntryMarkdown),
    types.length
      ? `### Types\n\n${table(
          ["Type", "Definition"],
          types.map(
            (type) =>
              `| ${code(type.name)}${type.framework ? ` (${type.framework})` : ""} | ${code(cell(type.type))} |`,
          ),
        )}`
      : "",
    css.length
      ? `### CSS variables\n\n${table(
          ["Variable", "Value", "Description"],
          css.map((variable) => {
            const value =
              variable.value !== undefined
                ? code(cell(variable.value))
                : variable.light !== undefined
                  ? `light ${code(cell(variable.light))}, dark ${code(cell(variable.dark ?? variable.light))}`
                  : "per color";
            return `| ${code(variable.name)} | ${value} | ${cell(variable.description ?? "")} |`;
          }),
        )}`
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}
