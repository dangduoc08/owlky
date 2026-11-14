// Pins the MCP manifest of a release (ADR-0071 § 8): writes apps/website/manifests/v<M>.<m>.json.gz
// from packages/mcp/manifest.json, so `/mcp/v<M>.<m>` keeps answering with that release's data
// after `/mcp` moves on. Run once per minor release, on the release commit, and commit the file:
//
//   node apps/website/scripts/pin-manifest.mjs            # the manifest's own version (0.1.0 → v0.1)
//   node apps/website/scripts/pin-manifest.mjs --force    # replace an existing pin (never after a release)
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { app, root } from "./content.mjs";

const manifest = readFileSync(join(root, "packages/mcp/manifest.json"));
const { version } = JSON.parse(manifest.toString("utf8"));
const match = /^(\d+)\.(\d+)\.\d+$/.exec(version);
if (!match || version === "0.0.0") {
  console.error(`pin-manifest: the manifest's version ${version} isn't a release`);
  process.exit(1);
}
const name = `v${match[1]}.${match[2]}`;
const dir = join(app, "manifests");
const file = join(dir, `${name}.json.gz`);
if (existsSync(file) && !process.argv.includes("--force")) {
  console.error(`pin-manifest: ${name} is already pinned (released data never changes)`);
  process.exit(1);
}
mkdirSync(dir, { recursive: true });
writeFileSync(file, gzipSync(manifest, { level: 9 }));
console.log(`pin-manifest: wrote manifests/${name}.json.gz (${version})`);
