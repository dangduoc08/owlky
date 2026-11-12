// Moves the option descriptions out of the built schemas (ADR-0068 §4, roadmap-size.md S3).
// Authors write each description next to its option in src/anatomy/<name>.ts; after tsc, this
// script:
//   1. imports dist/anatomy/anatomy.js and writes dist/option-docs.json
//      (`{ "<schema name>": { "<option>": { "description": "…" } } }`, keys sorted), exported as
//      `@owlky/core/option-docs.json`; every option must have a description;
//   2. blanks the description argument of every option factory call (`style`, `flag`, `native`,
//      `behavior`, `state`, `number`) in dist/anatomy/*.js, found through the AST (acorn). The
//      literal becomes `""` padded with spaces to its old length, so every line and column, and
//      so tsc's source maps, stay exact (minifiers drop the spaces);
//   3. checks in a fresh Node process that no built schema keeps a description.
// A description that isn't a string or template literal fails the build: the runtime would keep it.
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parse } from "acorn";

const dist = join(dirname(fileURLToPath(import.meta.url)), "../dist");
const anatomy = join(dist, "anatomy");
const entry = pathToFileURL(join(anatomy, "anatomy.js")).href;
const fail = (message) => {
  console.error(`option-docs: ${message}`);
  process.exit(1);
};
const byName = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

// 1. The descriptions, from the built schemas.
const schemasOf = (module) =>
  Object.values(module).filter(
    (value) =>
      value && typeof value === "object" && typeof value.root === "string" && "options" in value,
  );
const docs = {};
for (const schema of schemasOf(await import(entry)).sort((a, b) => byName(a.name, b.name))) {
  if (docs[schema.name]) fail(`two schemas are named "${schema.name}"`);
  docs[schema.name] = {};
  for (const key of Object.keys(schema.options).sort(byName)) {
    const { description } = schema.options[key];
    if (typeof description !== "string" || description.trim() === "")
      fail(`${schema.name}.${key} has no description`);
    docs[schema.name][key] = { description };
  }
}

// 2. Blank the description arguments. Index of the description in each factory's arguments.
const DESCRIPTION = { style: 3, flag: 1, native: 1, behavior: 2, state: 1, number: 2 };
const blank = (text) => `""${text.slice(2).replace(/[^\n]/g, " ")}`;
let blanked = 0;
for (const file of readdirSync(anatomy).filter((name) => name.endsWith(".js"))) {
  const path = join(anatomy, file);
  const code = readFileSync(path, "utf8");
  const ast = parse(code, { ecmaVersion: "latest", sourceType: "module", locations: true });
  const factories = new Map(); // local name → factory
  for (const node of ast.body)
    if (node.type === "ImportDeclaration" && node.source.value.endsWith("/options/define.js"))
      for (const specifier of node.specifiers)
        if (specifier.type === "ImportSpecifier" && specifier.imported.name in DESCRIPTION)
          factories.set(specifier.local.name, specifier.imported.name);
  if (factories.size === 0) continue;
  const spans = [];
  const visit = (node) => {
    if (!node || typeof node.type !== "string") return;
    if (
      node.type === "CallExpression" &&
      node.callee.type === "Identifier" &&
      factories.has(node.callee.name)
    ) {
      const argument = node.arguments[DESCRIPTION[factories.get(node.callee.name)]];
      const literal =
        argument &&
        ((argument.type === "Literal" && typeof argument.value === "string") ||
          argument.type === "TemplateLiteral");
      if (!literal)
        fail(
          `dist/anatomy/${file}:${node.loc.start.line}: the description of ${node.callee.name}() must be a string or template literal`,
        );
      spans.push([argument.start, argument.end]);
    }
    for (const value of Object.values(node))
      if (Array.isArray(value)) for (const child of value) visit(child);
      else if (value && typeof value === "object") visit(value);
  };
  visit(ast);
  let next = code;
  for (const [start, end] of spans.sort(([a], [b]) => b - a))
    next = next.slice(0, start) + blank(next.slice(start, end)) + next.slice(end);
  blanked += spans.length;
  if (next !== code) writeFileSync(path, next);
}

// 3. Nothing left at run time (a fresh process: this one cached the modules above).
const kept = execFileSync(
  process.execPath,
  [
    "--input-type=module",
    "-e",
    `const m = await import(${JSON.stringify(entry)});
     const kept = [];
     for (const s of Object.values(m))
       if (s && typeof s === "object" && typeof s.root === "string" && "options" in s)
         for (const [key, o] of Object.entries(s.options)) if (o.description) kept.push(s.name + "." + key);
     process.stdout.write(kept.join("\\n"));`,
  ],
  { encoding: "utf8" },
);
if (kept) fail(`descriptions left in the built schemas (not written through a factory?):\n${kept}`);

writeFileSync(join(dist, "option-docs.json"), `${JSON.stringify(docs, null, 1)}\n`);
const options = Object.values(docs).reduce((n, schema) => n + Object.keys(schema).length, 0);
console.log(
  `option-docs: ${options} descriptions of ${Object.keys(docs).length} schemas in dist/option-docs.json (${blanked} literals blanked)`,
);
