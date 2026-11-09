import type {
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
  const parts = Object.entries(component.requiredParts).map(
    ([root, list]) => `- ${code(root)} needs ${list.map(code).join(", ")}`,
  );
  return [
    `# ${component.title} (${code(component.name)})`,
    component.summary,
    facts.map((fact) => `- ${fact}`).join("\n"),
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
