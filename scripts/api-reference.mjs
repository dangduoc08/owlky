// Writes the API reference of every component (ADR-0049): apps/docs-content/src/api/<spec>.json,
// one file per spec, read by the docs pages (both hosts) and by scripts/manifest.mjs (the MCP
// server's `get_component`). Sources of truth, never prose:
//   - React props: the TypeScript compiler API (TypeScript 7's `typescript/unstable/sync`) on
//     packages/react/src; JSDoc is the description, `@default` or "Default `x`." the default;
//     props the option schema documents fall back to the schema's description and default;
//   - HTML options: the option schemas (built @owlky/core, ADR-0015);
//   - parts, states, values and triggers: the `<Spec>Parts` interfaces in
//     packages/core/src/anatomy/parts.ts (type only);
//   - events: each runtime's event map (`defineComponent<Instance, Events>`, `EventSpec`);
//   - methods: each runtime's instance interface;
//   - CSS variables: the `--ok-*` variables packages/styles/src/components/<folder>.css reads.
// Output is deterministic (sorted). Run after `pnpm build` (reads packages/core/dist):
//   node scripts/api-reference.mjs           write the files
//   node scripts/api-reference.mjs --check   fail when a file is out of date or a name, prop,
//                                            event or method has no description (CI)
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { API, SignatureKind, SymbolFlags } from "typescript/unstable/sync";
import { folderSpec as sharedFolderSpec } from "./component-folders.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(root, "apps/docs-content/src/api");
const CHECK = process.argv.includes("--check");
/** Bumped when the shape changes (docs-content's `ApiReference` type and the MCP server read it). */
const FORMAT = 1;

const read = (path) => readFileSync(join(root, path), "utf8");
const byName = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const problems = [];
const problem = (message) => problems.push(message);
const ATTRIBUTE = /data-ok-[a-z0-9]+(?:-[a-z0-9]+)*/g;
const kebab = (name) => name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
const pascal = (name) => name.replace(/(^|-)([a-z0-9])/g, (_, __, c) => c.toUpperCase());

const { optionSchemas } = await import(
  pathToFileURL(join(root, "packages/core/dist/index.js")).href
);

// ── Specs and their schemas ────────────────────────────────────────────────────────────────────
const specNames = readdirSync(join(root, "specs/components"))
  .filter((file) => file.endsWith(".md"))
  .map((file) => file.slice(0, -3))
  .sort(byName);
const specs = new Map();
for (const name of specNames) {
  const text = read(`specs/components/${name}.md`);
  specs.set(name, {
    title: /^#\s+(.+)$/m.exec(text)?.[1]?.trim() ?? name,
    schemas: [...text.matchAll(/<!-- options:([a-z-]+) /g)].map((match) => match[1]),
    anatomy: /## Anatomy\n([\s\S]*?)\n## /.exec(text)?.[1] ?? "",
  });
}
const folderSpec = (folder) => sharedFolderSpec(folder, specs);
const optionAttrs = new Set();
const schemaRoots = new Map(); // root → schema name
for (const schema of Object.values(optionSchemas)) {
  if (!schemaRoots.has(schema.root)) schemaRoots.set(schema.root, schema.name);
  for (const spec of Object.values(schema.options)) optionAttrs.add(spec.attr);
}

// ── TypeScript ─────────────────────────────────────────────────────────────────────────────────
const api = new API({ cwd: root });
const projects = ["react", "html", "core"].map((name) => `${root}/packages/${name}/tsconfig.json`);
const snapshot = api.updateSnapshot({ openProjects: projects });
const project = (name) => snapshot.getProject(`${root}/packages/${name}/tsconfig.json`);
const OWN = /\/packages\/(react|core|html)\/(src|dist)\//;

/** `string | undefined` → `string`; whitespace collapsed. */
const cleanType = (text) =>
  text
    .replace(/\s+/g, " ")
    .replace(/ \| undefined$/, "")
    .replace(/^undefined \| /, "")
    .trim();

function declaredTypeText(symbol, proj) {
  const node = symbol.valueDeclaration?.resolve(proj);
  const typeNode = node?.type;
  if (!typeNode) return undefined;
  return node.getSourceFile().text.slice(typeNode.pos, typeNode.end).trim();
}

/**
 * JSDoc written for maintainers, made fit for the docs: no "Name — spec: specs/….md (ADR-…)."
 * lead, and no sentence about specs, ADRs, snippets, parity or private `--_ok-*` variables.
 */
function publicText(text) {
  let lead = text
    .replace(/^[\w.]+ — spec: specs\/\S+\.md(?: \([^)]*\))?\.?\s*/, "")
    .replace(/\s*\([^)]*\bMinimals\b[^)]*\)/g, "");
  const named = /^[A-Z]\w+ — (.)/.exec(lead);
  if (named) lead = named[1].toUpperCase() + lead.slice(named[0].length);
  const sentences = lead.match(/[^.!?]+(?:[.!?](?=\s|$)|$)\s*/g) ?? [lead];
  return sentences
    .filter((sentence) => !/ADR-\d|specs\/|snippet|parity|--_ok-/i.test(sentence))
    .join("")
    .trim();
}

/** Description and default from JSDoc (`@default x`, or a "Default `x`." sentence). */
function docOf(symbol, checker) {
  let description = checker.getDocumentationCommentOfSymbol(symbol).replace(/\s+/g, " ").trim();
  let defaultValue;
  for (const tag of checker.getJsDocTagsOfSymbol(symbol) ?? []) {
    if (tag.name === "default" || tag.name === "defaultValue") {
      const text = Array.isArray(tag.text) ? tag.text.map((part) => part.text).join("") : tag.text;
      defaultValue = String(text ?? "")
        .trim()
        .replace(/^`|`$/g, "");
    }
  }
  const sentence = /\s*\(?\bDefault:? `([^`]+)`\)?[.:;]?/.exec(description);
  if (sentence && defaultValue === undefined) {
    defaultValue = sentence[1];
    description =
      `${description.slice(0, sentence.index)} ${description.slice(sentence.index + sentence[0].length)}`
        .replace(/\s+/g, " ")
        .trim();
    description = description.charAt(0).toUpperCase() + description.slice(1);
  }
  return { description: publicText(description), defaultValue };
}

// ── React components ───────────────────────────────────────────────────────────────────────────
const reactIndex = read("packages/react/src/index.ts");
const reactFolder = new Map(); // export → folder
for (const match of reactIndex.matchAll(
  /export\s+(type\s+)?\{([^}]*)\}\s+from\s+"\.\/([^/"]+)\//g,
)) {
  if (match[1]) continue;
  for (const item of match[2].split(",")) {
    const name = item.trim();
    if (name && !name.startsWith("type ")) reactFolder.set(name, match[3]);
  }
}
const reactByComponent = new Map(); // spec → components
/** Declarations of props without JSDoc (`--list-missing` prints them). */
const missingDoc = new Map();
{
  const proj = project("react");
  const { checker, program } = proj;
  const module = checker.getSymbolAtLocation(
    program.getSourceFile(`${root}/packages/react/src/index.ts`),
  );
  for (const exported of checker.getExportsOfModule(module)) {
    const folder = reactFolder.get(exported.name);
    if (!folder || !/^[A-Z]/.test(exported.name)) continue;
    const spec = folderSpec(folder);
    if (!spec) {
      problem(`React folder "${folder}" maps to no spec (extend scripts/component-folders.mjs)`);
      continue;
    }
    const symbol =
      exported.flags & SymbolFlags.Alias ? checker.getAliasedSymbol(exported) : exported;
    const type = checker.getTypeOfSymbol(symbol);
    if (!type) continue;
    const signatures = checker.getSignaturesOfType(type, SignatureKind.Call);
    if (signatures.length === 0) continue;
    // Overloads (Link): the signature with the most own props.
    let best;
    for (const signature of signatures) {
      const props = checker.getParameterType(signature, 0);
      if (!props) continue;
      const list = checker.getPropertiesOfType(props);
      const own = list.filter((p) => OWN.test(p.declarations?.[0]?.path ?? "")).length;
      if (!best || own > best.own) best = { list, own };
    }
    if (!best) continue;
    // forwardRef drops the named props of a type with an index signature (CardMedia): read the
    // exported `<Name>Props` type instead.
    if (best.own === 0) {
      const named = checker
        .getExportsOfModule(module)
        .find((symbol) => symbol.name === `${exported.name}Props`);
      if (named) {
        const target = named.flags & SymbolFlags.Alias ? checker.getAliasedSymbol(named) : named;
        const list = checker.getPropertiesOfType(checker.getDeclaredTypeOfSymbol(target));
        best = { list, own: list.length };
      }
    }
    const props = [];
    let native = false;
    let element;
    for (const prop of best.list) {
      const path = prop.declarations?.[0]?.path ?? "";
      const propType = checker.getTypeOfSymbol(prop);
      // The ref: named with the native attributes, never a row.
      if (prop.name === "ref") {
        element = /\b((?:HTML|SVG)\w*Element)\b/.exec(checker.typeToString(propType))?.[1];
        continue;
      }
      if (!OWN.test(path)) {
        native = true;
        continue;
      }
      if (prop.name === "key") continue;
      let typeText = cleanType(checker.typeToString(propType, undefined, 1));
      if (typeText.length > 160) typeText = cleanType(declaredTypeText(prop, proj) ?? typeText);
      const { description, defaultValue } = docOf(prop, checker);
      const entry = { name: prop.name, type: typeText, description };
      if (!description) {
        const node = prop.declarations?.[0]?.resolve(proj);
        if (node) {
          const text = node.getSourceFile().text;
          const line = text.slice(0, node.pos).split("\n").length;
          missingDoc.set(`${relative(root, path)}:${line}`, entry);
        }
      }
      if (defaultValue !== undefined) entry.default = defaultValue;
      if (!(prop.flags & SymbolFlags.Optional)) entry.required = true;
      props.push(entry);
    }
    props.sort((a, b) => byName(a.name, b.name));
    const component = {
      name: exported.name,
      description: docOf(symbol, checker).description,
      props,
    };
    if (native) component.native = element ?? "HTMLElement";
    else if (element) component.ref = element;
    if (!reactByComponent.has(spec)) reactByComponent.set(spec, []);
    reactByComponent.get(spec).push(component);
  }
}

// ── Parts (packages/core/src/anatomy/parts.ts) ─────────────────────────────────────────────────
const partsBySpec = new Map(); // spec → Map<attr, part>
const common = new Map();
{
  const file = `${root}/packages/core/src/anatomy/parts.ts`;
  const { checker, program } = project("core");
  const module = checker.getSymbolAtLocation(program.getSourceFile(file));
  const specOf = new Map([...specs.keys()].map((name) => [`${pascal(name)}Parts`, name]));
  for (const exported of checker.getExportsOfModule(module)) {
    if (!exported.name.endsWith("Parts")) continue;
    const spec = exported.name === "CommonParts" ? "common" : specOf.get(exported.name);
    if (!spec) {
      problem(`parts.ts: ${exported.name} names no spec`);
      continue;
    }
    const map = spec === "common" ? common : new Map();
    if (spec !== "common") partsBySpec.set(spec, map);
    const type = checker.getDeclaredTypeOfSymbol(exported);
    for (const member of checker.getPropertiesOfType(type)) {
      const text = cleanType(checker.typeToString(checker.getTypeOfSymbol(member)));
      const match = /^(Part|State|Value|Trigger)(?:<(.*)>)?$/.exec(text);
      if (!match) {
        problem(`parts.ts: ${exported.name}["${member.name}"] has type ${text}`);
        continue;
      }
      const kind = match[1].toLowerCase();
      const values = match[2] ? [...match[2].matchAll(/"([^"]*)"/g)].map((m) => m[1]) : [];
      const part = { name: member.name, kind, description: docOf(member, checker).description };
      if (kind === "part" && values.length) part.elements = values;
      if (kind === "value" || kind === "trigger")
        part.value = match[2] === "string" || !match[2] ? "string" : values;
      if (kind === "trigger" && !match[2]) part.value = ["id"];
      if (!part.description) problem(`parts.ts: ${exported.name}["${member.name}"] has no comment`);
      map.set(member.name, part);
    }
  }
}

// ── HTML runtimes (definitions, event maps, instance interfaces) ───────────────────────────────
const runtimesBySpec = new Map(); // spec → runtime[]
/** The placeholder of `listCalendar(kind)`'s template name and selector. */
const KIND = ["$", "{kind}"].join("");
{
  const proj = project("html");
  const { checker, program } = proj;
  const base = join(root, "packages/html/src/components");
  for (const folder of readdirSync(base, { withFileTypes: true })) {
    if (!folder.isDirectory()) continue;
    const spec = folderSpec(folder.name);
    for (const file of readdirSync(join(base, folder.name)).sort(byName)) {
      if (!/\.ts$/.test(file) || /\.test\.ts$/.test(file)) continue;
      const path = join(base, folder.name, file);
      const text = readFileSync(path, "utf8");
      for (const match of text.matchAll(
        /defineComponent(?:<\s*(\w+)\s*(?:,\s*(\w+)\s*)?>)?\(\{\s*name:\s*(?:"([a-z-]+)"|`([^`]+)`)/g,
      )) {
        const [, instanceName, eventsName, plainName, templateName] = match;
        if (!spec) {
          problem(`runtime folder "${folder.name}" maps to no spec`);
          continue;
        }
        // `listCalendar("month" | "year")`: one definition per kind.
        const names = plainName
          ? [plainName]
          : [...text.matchAll(/listCalendar\("(\w+)"\)/g)].map((m) => m[1]);
        const kinds = templateName?.includes(KIND)
          ? ["month", "year"].map((kind) => templateName.replace(KIND, kind))
          : names;
        const module = checker.getSymbolAtLocation(program.getSourceFile(path));
        const exports = module ? checker.getExportsOfModule(module) : [];
        const find = (name) => exports.find((symbol) => symbol.name === name);
        const events = [];
        if (eventsName) {
          const symbol = find(eventsName);
          if (!symbol) problem(`${relative(root, path)}: export the event map ${eventsName}`);
          else
            for (const member of checker.getPropertiesOfType(
              checker.getDeclaredTypeOfSymbol(symbol),
            )) {
              const type = checker.getTypeOfSymbol(member);
              const detail = checker.getTypeOfSymbol(checker.getPropertyOfType(type, "detail"));
              const cancelable = checker.typeToString(
                checker.getTypeOfSymbol(checker.getPropertyOfType(type, "cancelable")),
              );
              const { description } = docOf(member, checker);
              if (!description) problem(`${eventsName}.${member.name} has no comment`);
              events.push({
                name: member.name,
                detail: cleanType(checker.typeToString(detail)),
                cancelable:
                  cancelable === "true" ? true : cancelable === "false" ? false : "sometimes",
                description,
              });
            }
        } else if (/\bemit\(/.test(text.slice(match.index))) {
          problem(`${relative(root, path)}: declare an event map (defineComponent<I, Events>)`);
        }
        const methods = [];
        if (instanceName && instanceName !== "ComponentInstance") {
          const symbol = find(instanceName);
          if (!symbol) problem(`${relative(root, path)}: export the instance type ${instanceName}`);
          else
            for (const member of checker.getPropertiesOfType(
              checker.getDeclaredTypeOfSymbol(symbol),
            )) {
              if (member.name === "destroy") continue;
              const { description } = docOf(member, checker);
              if (!description) {
                problem(`${instanceName}.${member.name} has no comment`);
                const node = member.declarations?.[0]?.resolve(proj);
                const where = member.declarations?.[0]?.path ?? "";
                if (node)
                  missingDoc.set(
                    `${relative(root, where)}:${node.getSourceFile().text.slice(0, node.pos).split("\n").length}`,
                    { name: member.name },
                  );
              }
              methods.push({
                name: member.name,
                kind: member.flags & SymbolFlags.Method ? "method" : "property",
                type: cleanType(checker.typeToString(checker.getTypeOfSymbol(member))),
                description,
              });
            }
        }
        events.sort((a, b) => byName(a.name, b.name));
        methods.sort((a, b) => byName(a.name, b.name));
        const selectorAt = text.indexOf("selector:", match.index);
        const selector = /selector:\s*(?:"([^"]+)"|`([^`]+)`)/.exec(text.slice(selectorAt))?.[0];
        for (const name of kinds) {
          const attr =
            /\[(data-ok-[a-z0-9-]+)/.exec(selector?.replace(KIND, name.split("-")[0]) ?? "")?.[1] ??
            `data-ok-${name}`;
          if (!runtimesBySpec.has(spec)) runtimesBySpec.set(spec, []);
          runtimesBySpec.get(spec).push({ name, attr, events, methods });
        }
      }
    }
  }
}
// ── Type aliases the tables name (`DialogCloseReason`): their definitions ──────────────────────
const IN_TYPE_ALIAS = 8388608 | 1; // NodeBuilderFlags.InTypeAlias | NoTruncation
const aliasesOf = new Map(); // project → alias → definition
// HTML: every runtime module (the index re-exports only some of their types).
const runtimeModules = readdirSync(join(root, "packages/html/src/components"), {
  withFileTypes: true,
  recursive: true,
})
  .filter(
    (entry) => entry.isFile() && /^[a-z-]+\.ts$/.test(entry.name) && entry.name !== "index.ts",
  )
  .map((entry) => relative(root, join(entry.parentPath, entry.name)))
  .sort(byName);
for (const [name, files] of [
  ["react", ["packages/react/src/index.ts"]],
  ["html", ["packages/html/src/index.ts", ...runtimeModules]],
  ["core", ["packages/core/src/index.ts"]],
]) {
  const { checker, program } = project(name);
  const aliases = new Map();
  aliasesOf.set(name, aliases);
  for (const file of files) {
    const module = checker.getSymbolAtLocation(program.getSourceFile(`${root}/${file}`));
    if (!module) continue;
    for (const exported of checker.getExportsOfModule(module)) {
      if (aliases.has(exported.name)) continue;
      const symbol =
        exported.flags & SymbolFlags.Alias ? checker.getAliasedSymbol(exported) : exported;
      if (!(symbol.flags & SymbolFlags.TypeAlias)) continue;
      const text = cleanType(
        checker.typeToString(checker.getDeclaredTypeOfSymbol(symbol), undefined, IN_TYPE_ALIAS),
      );
      if (text && text !== exported.name && text.length <= 400) aliases.set(exported.name, text);
    }
  }
}
api.close();

// ── CSS variables ──────────────────────────────────────────────────────────────────────────────
const tokens = JSON.parse(read("packages/tokens/dist/tokens.json")).cssVariables;
const BINDINGS = {
  "--ok-c-main": "The main color of the element's `data-ok-color`.",
  "--ok-c-channel": "The main color of the element's `data-ok-color`, as RGB channels.",
  "--ok-c-contrast": "The text color on the main color.",
  "--ok-c-hover": "The hover color of the element's `data-ok-color`.",
  "--ok-c-text": "The accessible text tone of the element's `data-ok-color`.",
  "--ok-c-shadow": "The colored shadow of the element's `data-ok-color`.",
};
const cssBySpec = new Map();
for (const file of readdirSync(join(root, "packages/styles/src/components")).sort(byName)) {
  const spec = folderSpec(file.replace(/\.css$/, ""));
  if (!spec) {
    problem(`styles/src/components/${file} maps to no spec`);
    continue;
  }
  const names = cssBySpec.get(spec) ?? new Set();
  cssBySpec.set(spec, names);
  const text = read(`packages/styles/src/components/${file}`);
  for (const [, name] of text.matchAll(/var\((--ok-[a-z0-9-]+)/g)) names.add(name);
}
const cssEntry = (name) => {
  const entry = { name };
  for (const key of ["root", "light", "dark"])
    if (tokens[key][name] !== undefined) entry[key === "root" ? "value" : key] = tokens[key][name];
  if (entry.light !== undefined && entry.light === entry.dark) {
    entry.value = entry.light;
    delete entry.light;
    delete entry.dark;
  }
  if (BINDINGS[name]) entry.description = BINDINGS[name];
  else if (Object.keys(entry).length === 1) problem(`${name} is neither a token nor a binding`);
  return entry;
};

// ── Snippet, anatomy and stylesheet names (completeness) ───────────────────────────────────────
const declared = new Set([...common.keys(), ...schemaRoots.keys(), ...optionAttrs]);
for (const map of partsBySpec.values()) for (const name of map.keys()) declared.add(name);
const sourcesOfNames = [];
const examples = join(root, "packages/html/src/components");
for (const folder of readdirSync(examples, { withFileTypes: true })) {
  if (!folder.isDirectory()) continue;
  let files = [];
  try {
    files = readdirSync(join(examples, folder.name, "examples"));
  } catch {}
  for (const file of files)
    sourcesOfNames.push([
      `snippet ${folder.name}/${file}`,
      read(`packages/html/src/components/${folder.name}/examples/${file}`),
    ]);
}
for (const [name, spec] of specs)
  sourcesOfNames.push([`specs/components/${name}.md anatomy`, spec.anatomy]);
for (const file of readdirSync(join(root, "packages/styles/src/components")))
  sourcesOfNames.push([`styles ${file}`, read(`packages/styles/src/components/${file}`)]);
const undeclared = new Map();
for (const [where, text] of sourcesOfNames)
  for (const [name] of text.matchAll(ATTRIBUTE))
    if (!declared.has(name) && !undeclared.has(name)) undeclared.set(name, where);
for (const [name, where] of [...undeclared].sort(([a], [b]) => byName(a, b)))
  problem(`${name} (${where}) is declared nowhere: add it to packages/core/src/anatomy/parts.ts`);

// ── Entries ────────────────────────────────────────────────────────────────────────────────────
const optionEntry = (schema, key, spec) => {
  const description = spec.description.replace(/\s*\(ADR-\d+\)/g, "");
  const option = { name: key, kind: spec.kind, attr: spec.attr, description };
  for (const field of ["values", "default", "optional", "when", "children", "min", "units"])
    if (spec[field] !== undefined) option[field] = spec[field];
  if (spec.event !== undefined) option.event = `ok:${schema.name}:${spec.event}`;
  return option;
};

const references = new Map();
for (const [name, spec] of specs) {
  const schemas = spec.schemas.map((schemaName) => optionSchemas[schemaName]);
  const main =
    schemas.find((schema) => schema.name === name)?.root ?? schemas[0]?.root ?? `data-ok-${name}`;
  const entries = new Map(); // key (attribute or React name) → entry
  const entryFor = (attr) => {
    if (!entries.has(attr)) entries.set(attr, { attribute: attr, html: {} });
    return entries.get(attr);
  };
  for (const schema of schemas) {
    const entry = entryFor(schema.root);
    entry.html.options = Object.entries(schema.options).map(([key, option]) =>
      optionEntry(schema, key, option),
    );
  }
  const parts = partsBySpec.get(name) ?? new Map();
  for (const runtime of runtimesBySpec.get(name) ?? []) {
    const entry = entryFor(runtime.attr);
    entry.html.runtime = runtime.name;
    if (runtime.events.length)
      entry.html.events = runtime.events.map((event) => ({
        ...event,
        name: `ok:${runtime.name}:${event.name}`,
      }));
    if (runtime.methods.length) entry.html.methods = runtime.methods;
  }
  for (const component of reactByComponent.get(name) ?? []) {
    const attr = `data-ok-${kebab(component.name)}`;
    const known = entries.has(attr) || parts.get(attr)?.kind === "part";
    const entry = known ? entryFor(attr) : { react: undefined, html: undefined };
    if (!known) entries.set(component.name, entry);
    if (entry.react) {
      problem(`${name}: two React components map to ${attr}`);
      continue;
    }
    entry.name = component.name;
    entry.react = component;
  }
  // Parts go to the entry with the longest attribute prefix, else the main entry.
  const attrs = [...entries.keys()].filter((key) => key.startsWith("data-ok-"));
  const byLength = attrs.sort((a, b) => b.length - a.length || byName(a, b));
  for (const [attr, part] of parts) {
    if (entries.has(attr)) {
      const entry = entries.get(attr);
      entry.html.description = part.description;
      if (part.elements) entry.html.elements = part.elements;
      continue;
    }
    const owner = byLength.find((key) => attr.startsWith(`${key}-`)) ?? main;
    const entry = entryFor(owner);
    entry.html.parts ??= [];
    entry.html.parts.push(part);
  }
  const list = [...entries.values()].map((entry) => {
    const out = {};
    const attr = entry.attribute;
    out.name =
      entry.name ??
      (attr ? pascal(attr.slice("data-ok-".length)) : (entry.react?.name ?? "Unnamed"));
    if (entry.react) {
      const { name: _, ...react } = entry.react;
      out.react = react;
    }
    if (entry.html && attr) {
      const html = { attribute: attr, ...entry.html };
      if (html.parts) html.parts.sort((a, b) => byName(a.name, b.name));
      out.html = html;
    }
    return out;
  });
  list.sort((a, b) => {
    const am = a.html?.attribute === main ? 0 : 1;
    const bm = b.html?.attribute === main ? 0 : 1;
    return am - bm || byName(a.name, b.name);
  });
  // Props without a description.
  for (const entry of list)
    for (const prop of entry.react?.props ?? []) {
      if (prop.description) continue;
      const option = schemas
        .flatMap((schema) => (schema.options[prop.name] ? [schema.options[prop.name]] : []))
        .find(Boolean);
      if (option) {
        prop.description = option.description;
        if (prop.default === undefined && option.default !== undefined && option.kind !== "native")
          prop.default = String(option.default);
      } else if (prop.name === "children") prop.description = "The content.";
      else problem(`${entry.name}.${prop.name} (React) has no JSDoc`);
    }
  const css = [...(cssBySpec.get(name) ?? [])].sort(byName).map(cssEntry);
  // The aliases the type texts name (React props: React's exports, then core's; events and
  // methods: the HTML package's, then core's), and the aliases those name.
  const named = new Map(); // alias → Map<definition, Set<framework>>
  const scan = (text, framework, lookup) => {
    for (const [word] of String(text ?? "").matchAll(/\b[A-Z][A-Za-z0-9]+\b/g)) {
      const definition = lookup.map((key) => aliasesOf.get(key).get(word)).find(Boolean);
      if (!definition) continue;
      const seen = named.get(word) ?? new Map();
      named.set(word, seen);
      const frameworks = seen.get(definition) ?? new Set();
      if (frameworks.has(framework)) continue;
      seen.set(definition, frameworks.add(framework));
      scan(definition, framework, lookup);
    }
  };
  for (const entry of list) {
    for (const prop of entry.react?.props ?? []) scan(prop.type, "react", ["react", "core"]);
    for (const event of entry.html?.events ?? []) scan(event.detail, "html", ["html", "core"]);
    for (const method of entry.html?.methods ?? []) scan(method.type, "html", ["html", "core"]);
  }
  const types = [...named]
    .sort(([a], [b]) => byName(a, b))
    .flatMap(([alias, definitions]) =>
      [...definitions].map(([type, frameworks]) => {
        const entry = { name: alias, type };
        // Two packages define the name differently: say which one each row is.
        if (definitions.size > 1) entry.framework = [...frameworks].sort(byName).join(" ");
        return entry;
      }),
    );
  const reference = { format: FORMAT, name, title: spec.title, entries: list };
  if (css.length) reference.css = css;
  if (types.length) reference.types = types;
  references.set(name, reference);
}
// Every runtime lands in one reference.
for (const spec of runtimesBySpec.keys())
  if (!specs.has(spec)) problem(`runtimes of "${spec}" have no spec`);

// ── Output ─────────────────────────────────────────────────────────────────────────────────────
const sortKeys = (value) =>
  Array.isArray(value)
    ? value.map(sortKeys)
    : value && typeof value === "object"
      ? Object.fromEntries(
          Object.keys(value)
            .sort(byName)
            .map((key) => [key, sortKeys(value[key])]),
        )
      : value;
const files = new Map(
  [...references].map(([name, reference]) => [
    `${name}.json`,
    `${JSON.stringify(sortKeys(reference), null, 1)}\n`,
  ]),
);
const commonFile = `${JSON.stringify(sortKeys({ format: FORMAT, parts: [...common.values()].sort((a, b) => byName(a.name, b.name)) }), null, 1)}\n`;
files.set("common.json", commonFile);

if (process.argv.includes("--list-missing"))
  for (const [where, prop] of [...missingDoc]
    .sort(([a], [b]) => byName(a, b))
    .filter(([, p]) => !p.description))
    console.log(`${where} ${prop.name}`);
if (problems.length) {
  console.error(problems.join("\n"));
  console.error(`\napi-reference: ${problems.length} problem(s).`);
  if (CHECK || !process.argv.includes("--force")) process.exit(1);
}
if (CHECK) {
  const stale = [];
  let current = [];
  try {
    current = readdirSync(OUT).filter((file) => file.endsWith(".json"));
  } catch {}
  for (const file of new Set([...current, ...files.keys()])) {
    let text = "";
    try {
      text = readFileSync(join(OUT, file), "utf8");
    } catch {}
    if (text !== files.get(file)) stale.push(file);
  }
  if (stale.length) {
    console.error(
      `api-reference: out of date: ${stale.join(", ")}. Run \`pnpm build && pnpm api\`.`,
    );
    process.exit(1);
  }
  console.log(`api-reference: ${files.size} files up to date`);
} else {
  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });
  for (const [file, text] of files) writeFileSync(join(OUT, file), text);
  const kb = Math.round([...files.values()].reduce((n, text) => n + text.length, 0) / 1024);
  console.log(`api-reference: wrote ${files.size} files to ${relative(root, OUT)} (${kb} kB)`);
}
