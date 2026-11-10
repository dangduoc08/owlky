// Checks the code examples of every docs page (`*-docs.tsx` sections: `html` and `react`, in
// Storybook and in `apps/docs-content`, ADR-0040, plus the website's own pages), so what a reader
// copies works as written:
//   - no placeholders (`…`, or `...` that isn't a spread);
//   - HTML: every `data-ok-*` attribute and `ok:*:*` event exists in the packages;
//   - React: each example is a complete module (its imports included) that typechecks against
//     the built packages. Icon components come from any icon library: `lucide-react` is
//     declared as a stand-in.
// Run after `pnpm build` (types resolve from `dist`):
//   node apps/storybook/scripts/check-docs-code.mjs [page …]
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const here = dirname(fileURLToPath(import.meta.url));
const app = resolve(here, "..");
const root = resolve(app, "../..");
const only = process.argv.slice(2);

const docsPages = (base, pattern) =>
  ["components", "foundations"].flatMap((group) =>
    readdirSync(join(base, "src", group), { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .flatMap((entry) =>
        readdirSync(join(base, "src", group, entry.name))
          .filter((file) => pattern.test(file))
          .map((file) => join(base, "src", group, entry.name, file)),
      ),
  );
const website = join(root, "apps/website/src/content");
const pages = [
  ...docsPages(app, /-docs\.tsx$/),
  // Migrated guides: sections live next to their previews (`*-docs-examples.ts`).
  ...docsPages(join(root, "apps/docs-content"), /-docs(-examples)?\.tsx?$/),
  ...(existsSync(website) ? readdirSync(website) : [])
    .filter((file) => /\.ts$/.test(file))
    .map((file) => join(website, file)),
];

// Docs pages only build section arrays at module level: Storybook's blocks are never called.
const stub = "\0docs-stub";
const server = await createServer({
  configFile: false,
  root: app,
  logLevel: "error",
  server: { middlewareMode: true, hmr: false, ws: false },
  appType: "custom",
  ssr: { noExternal: [/storybook/] },
  optimizeDeps: { noDiscovery: true, include: [] },
  plugins: [
    {
      name: "docs-stub",
      enforce: "pre",
      resolveId(id) {
        if (/^@?storybook(\/|$)/.test(id) || /\.(css|svg|png)$/.test(id)) return stub;
      },
      load(id) {
        if (id === stub)
          return "const p = new Proxy(function () {}, { get: () => p, apply: () => p }); export default p; export const Description = p, Markdown = p, Source = p, Subtitle = p, Title = p, useArgs = p, useGlobals = p, addons = p, global = globalThis;";
      },
    },
  ],
});

const sections = [];
const seen = new Set(); // section arrays re-exported by a page's previews module
try {
  for (const file of pages) {
    const page = basename(file).replace(/(-docs)?(-examples)?\.tsx?$/, "");
    if (only.length && !only.includes(page)) continue;
    const mod = await server.ssrLoadModule(file);
    for (const value of Object.values(mod)) {
      if (!Array.isArray(value) || typeof value[0]?.body !== "string" || seen.has(value)) continue;
      seen.add(value);
      for (const section of value) {
        // Website-only pages carry code blocks (`code`) instead of HTML | React tabs.
        if (!section.code) sections.push({ page, ...section });
        for (const [index, sample] of (section.code ?? []).entries()) {
          const impl = { html: "html", tsx: "react" }[sample.language];
          if (impl)
            sections.push({ page, ...section, id: `${section.id}-${index}`, [impl]: sample.code });
        }
      }
    }
  }
} finally {
  await server.close();
}

const errors = [];
const where = (s, impl) => `${s.page} › ${s.title} (#${s.id}, ${impl})`;

// Placeholders.
const PLACEHOLDER = /…|\.\.\.(?![\w$[{(])/;
for (const s of sections)
  for (const impl of ["html", "react"])
    if (s[impl] && PLACEHOLDER.test(s[impl])) errors.push(`${where(s, impl)}: placeholder "…"`);

// HTML names.
const corpus = execFileSync(
  "git",
  ["grep", "-hoE", "data-ok-[a-z0-9-]+|ok:[a-z-]+:", "--", "packages"],
  { cwd: root, encoding: "utf8", maxBuffer: 1 << 26 },
);
const known = new Set(corpus.split("\n"));
for (const s of sections) {
  if (!s.html) continue;
  for (const [name] of s.html.matchAll(/data-ok-[a-z0-9-]+/g))
    if (!known.has(name)) errors.push(`${where(s, "html")}: unknown attribute ${name}`);
  for (const [name] of s.html.matchAll(/ok:[a-z-]+:(?=[a-z])/g))
    if (!known.has(name)) errors.push(`${where(s, "html")}: unknown event prefix ${name}`);
}

// React modules. Date adapters widen PickerValidDate for the whole program, so an example that
// imports one is compiled on its own (as a reader's app without adapters would compile the rest).
const out = join(app, ".docs-code");
rmSync(out, { recursive: true, force: true });
mkdirSync(out);
// Icons that exist in lucide-react (each also as `<Name>Icon`): extend the list when an example
// needs another one, after checking https://lucide.dev/icons. Icons take lucide's `size` and
// `absoluteStrokeWidth` besides the SVG attributes.
const LUCIDE = [
  "Bold",
  "Check",
  "ChevronDown",
  "ChevronRight",
  "Copy",
  "Eye",
  "EyeOff",
  "Heart",
  "House",
  "Image",
  "Inbox",
  "Info",
  "Italic",
  "Mail",
  "MapPin",
  "Minus",
  "Phone",
  "Plus",
  "Search",
  "Send",
  "Settings",
  "Star",
  "Trash",
  "Trash2",
  "Underline",
  "User",
  "Wifi",
];
writeFileSync(
  join(out, "icons.d.ts"),
  `declare module "lucide-react" {\n  type Icon = import("react").FC<import("react").SVGProps<SVGSVGElement> & { size?: number | string; absoluteStrokeWidth?: boolean }>;\n${LUCIDE.map((name) => `  export const ${name}: Icon;\n  export const ${name}Icon: Icon;\n`).join("")}}\n`,
);
const programs = [[]];
const owner = new Map();
for (const s of sections) {
  if (!s.react) continue;
  const name = `${s.page}--${s.id}.tsx`;
  owner.set(name, s);
  if (!/^\s*(import|export)\b/m.test(s.react))
    errors.push(`${where(s, "react")}: not a module (add its imports)`);
  writeFileSync(join(out, name), `${s.react}\nexport {};\n`);
  if (/@owlky\/(core|react)\/adapters\//.test(s.react)) programs.push([name]);
  else programs[0].push(name);
}
const tsc = join(root, "node_modules/.bin/tsc");
programs.forEach((files, index) => {
  const config = join(out, `tsconfig.${index}.json`);
  writeFileSync(
    config,
    JSON.stringify({
      extends: "../tsconfig.json",
      compilerOptions: { noUnusedLocals: false, noUnusedParameters: false },
      include: ["icons.d.ts", ...files],
    }),
  );
  try {
    execFileSync(tsc, ["-p", config, "--pretty", "false"], { cwd: out, encoding: "utf8" });
  } catch (error) {
    for (const line of String(error.stdout).split("\n")) {
      const match = /^([\w-]+\.tsx)\((\d+),\d+\): error (TS\d+: .*)/.exec(line);
      if (match)
        errors.push(`${where(owner.get(match[1]), "react")} line ${match[2]}: ${match[3]}`);
    }
  }
});
rmSync(out, { recursive: true, force: true });

if (errors.length) {
  console.error(errors.join("\n"));
  console.error(`\n${errors.length} problem(s) in docs examples.`);
  process.exit(1);
}
console.log(`Docs examples OK (${sections.length} sections).`);
