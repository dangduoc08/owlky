// Runs after `next build` (ADR-0040, ADR-0046), on the static output in out/:
//   - one Markdown copy per page (`/components/button.md`…), `llms.txt` (an index of them) and
//     `llms-full.txt` (all of them), written from the same content data as the pages;
//   - the Pagefind search index (out/pagefind/), built from the pages' HTML.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { app, loadContent, root } from "./content.mjs";

const out = join(app, "out");
if (!existsSync(join(out, "index.html"))) {
  console.error("website: out/ has no index.html. Run `next build` first.");
  process.exit(1);
}

const { PAGES, SITE } = await loadContent("site.ts");
const manifest = JSON.parse(readFileSync(join(root, "packages/mcp/manifest.json"), "utf8"));

// ── Markdown ───────────────────────────────────────────────────────────────────────────────────
const cell = (text) => String(text).replaceAll("|", "\\|").replaceAll("\n", " ");
const table = (head, rows) =>
  [
    `| ${head.join(" | ")} |`,
    `| ${head.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map(cell).join(" | ")} |`),
  ].join("\n");
const code = (value) => (value ? `\`${value}\`` : "None");

function optionsTable(name) {
  const component = manifest.components.find((entry) => entry.name === name);
  return component.schemas
    .map((schema) =>
      table(
        ["React prop", "HTML attribute", "Values", "Default", "Description"],
        schema.options.map((option) => [
          code(option.name),
          code(option.attr),
          option.values
            ? option.values.map(code).join(" ")
            : option.kind === "number"
              ? "Number"
              : "Boolean",
          option.default === undefined || option.optional ? "None" : code(option.default),
          `${option.description}${option.when ? ` Only with \`${option.when}\`.` : ""}`,
        ]),
      ),
    )
    .join("\n\n");
}

const fence = (language, text) => `\`\`\`${language}\n${text.trim()}\n\`\`\``;

function pageMarkdown(page) {
  const parts = [`# ${page.title}`, `> ${page.description}`];
  for (const section of page.sections ?? []) {
    parts.push(`## ${section.title}`, section.body.trim());
    for (const sample of section.code ?? [])
      parts.push(`${sample.label}:`, fence(sample.language, sample.code));
  }
  const guide = page.guide;
  for (const section of guide?.sections ?? []) {
    parts.push(`## ${section.title}`, (section.bodyByHost?.website ?? section.body).trim());
    if (section.id === "options" && guide.component) parts.push(optionsTable(guide.component));
    if (section.id === "props" && guide.props)
      parts.push(
        table(
          ["React prop", "HTML", "Type", "Description"],
          guide.props.map((row) => [
            code(row.react),
            code(row.html),
            code(row.type),
            row.description,
          ]),
        ),
      );
    if (section.id === "keyboard" && guide.keyboard)
      parts.push(
        table(
          ["Key", "Action"],
          guide.keyboard.map(([keys, action]) => [keys, action]),
        ),
      );
    if (section.html !== undefined) parts.push("HTML:", fence("html", section.html));
    if (section.react !== undefined) parts.push("React:", fence("tsx", section.react));
  }
  return `${parts.join("\n\n")}\n`;
}

const documents = PAGES.map((page) => ({ page, text: pageMarkdown(page) }));
for (const { page, text } of documents) {
  const file = join(out, page.markdown);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, text);
}

const url = (path) => `${SITE.url}${path}`;
const groups = [...new Set(PAGES.map((page) => page.group))];
const index = [
  `# ${SITE.name}`,
  `> ${SITE.description}`,
  `Owlky ${manifest.version === "0.0.0" ? "isn't published yet" : `${manifest.version}`}. Every page is also available as Markdown at the URLs below. Coding agents can query the exact components, options, examples and tokens offline with the \`@owlky/mcp\` server (\`npx -y @owlky/mcp\`).`,
  ...groups.map(
    (group) =>
      `## ${group}\n\n${PAGES.filter((page) => page.group === group)
        .map((page) => `- [${page.title}](${url(page.markdown)}): ${page.description}`)
        .join("\n")}`,
  ),
  `## Optional\n\n- [Everything in one file](${url("/llms-full.txt")}): every page above, in order.\n- [Source code](${SITE.github}): the repository, with the component specs.`,
];
writeFileSync(join(out, "llms.txt"), `${index.join("\n\n")}\n`);
writeFileSync(
  join(out, "llms-full.txt"),
  documents.map(({ page, text }) => `<!-- ${url(page.path)} -->\n\n${text}`).join("\n---\n\n"),
);

// ── Search index ───────────────────────────────────────────────────────────────────────────────
execFileSync(join(app, "node_modules/.bin/pagefind"), ["--site", out, "--silent"], {
  stdio: "inherit",
});

console.log(`website: wrote ${documents.length} Markdown pages, llms.txt and the search index`);
