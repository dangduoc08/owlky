// Validates a release tag before publishing: `node scripts/check-release.mjs release/v1.2.3`.
// The tag must be `release/v<semver>` and every publishable package (fixed versioning) plus the
// HTML runtime VERSION constant and the MCP manifest must already carry that version (run
// `pnpm version-packages`).
import { readFileSync } from "node:fs";

const tag = process.argv[2] ?? process.env.GITHUB_REF_NAME ?? "";
const match = /^release\/v(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)$/.exec(tag);
if (!match) {
  console.error(
    `Invalid release tag "${tag}". Expected release/v<major>.<minor>.<patch>[-prerelease].`,
  );
  process.exit(1);
}
const version = match[1];

const problems = [];
for (const name of ["tokens", "styles", "core", "react", "html", "mcp"]) {
  const pkg = JSON.parse(readFileSync(`packages/${name}/package.json`, "utf8"));
  if (pkg.version !== version) problems.push(`${pkg.name} is ${pkg.version}`);
}
const runtime = readFileSync("packages/html/src/runtime/version.ts", "utf8");
if (!runtime.includes(`export const VERSION = "${version}";`)) {
  problems.push("packages/html/src/runtime/version.ts VERSION is out of sync");
}
const manifest = JSON.parse(readFileSync("packages/mcp/manifest.json", "utf8"));
if (manifest.version !== version)
  problems.push(`packages/mcp/manifest.json is ${manifest.version}`);

if (problems.length > 0) {
  console.error(`Tag ${tag} expects version ${version}, but:\n  ${problems.join("\n  ")}`);
  console.error("Run `pnpm version-packages`, commit to main, then tag that commit.");
  process.exit(1);
}
console.log(`release: ${tag} matches all package versions (${version})`);
