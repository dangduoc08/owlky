// After `changeset version`: copy the html package version into its runtime VERSION constant and
// into the MCP manifest (ADR-0046), so `pnpm check:manifest` passes without a rebuild.
import { readFile, writeFile } from "node:fs/promises";

const { version } = JSON.parse(await readFile("packages/html/package.json", "utf8"));
const file = "packages/html/src/runtime/version.ts";
const source = await readFile(file, "utf8");
await writeFile(
  file,
  source.replace(/export const VERSION = "[^"]*";/, `export const VERSION = "${version}";`),
);
console.log(`html runtime VERSION → ${version}`);

// The manifest is written with one space of indentation: its top-level `version` is on a line
// of its own, starting with exactly one space.
const manifestFile = "packages/mcp/manifest.json";
const manifest = await readFile(manifestFile, "utf8");
await writeFile(
  manifestFile,
  manifest.replace(/^ "version": "[^"]*"/m, ` "version": "${version}"`),
);
console.log(`mcp manifest version → ${version}`);
