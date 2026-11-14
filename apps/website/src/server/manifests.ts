import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";
import { MANIFEST_FORMAT, type Manifest } from "@owlky/mcp-server";

/*
 * Manifests per MCP version (ADR-0071 § 8). `/mcp` answers from the latest manifest, the one the
 * workspace builds (`packages/mcp/manifest.json`). `/mcp/v<major>.<minor>` answers from a pinned
 * copy, `manifests/v<major>.<minor>.json.gz` in this app, written once per release by
 * `node scripts/pin-manifest.mjs` (gzip: about 1.7 MB instead of 14 MB) and never changed after.
 * The server code is the same for every version; only the data is pinned.
 */

/** `v0.1`, `v1.2`: the path segment of a pinned version. */
export const VERSION_PATTERN = /^v(0|[1-9]\d{0,3})\.(0|[1-9]\d{0,3})$/;

export function manifestsDir(cwd = process.cwd()): string {
  for (const candidate of [join(cwd, "manifests"), join(cwd, "apps/website/manifests")])
    if (existsSync(candidate)) return candidate;
  return join(cwd, "manifests");
}

/** Pinned versions, oldest first. */
export function pinnedVersions(dir = manifestsDir()): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .map((file) => file.replace(/\.json\.gz$/, ""))
    .filter((name) => VERSION_PATTERN.test(name))
    .sort((a, b) => {
      const [, a1 = 0, a2 = 0] = a.match(VERSION_PATTERN)?.map(Number) ?? [];
      const [, b1 = 0, b2 = 0] = b.match(VERSION_PATTERN)?.map(Number) ?? [];
      return a1 - b1 || a2 - b2;
    });
}

/**
 * The latest manifest file. Read by path from the app's directory, not through the package's
 * `import.meta.url`: bundled server code has no file URL of the package to resolve it from.
 */
export function latestManifestPath(cwd = process.cwd()): string {
  for (const candidate of [
    join(cwd, "node_modules/@owlky/mcp-server/manifest.json"),
    join(cwd, "../../packages/mcp/manifest.json"),
    join(cwd, "packages/mcp/manifest.json"),
  ])
    if (existsSync(candidate)) return candidate;
  throw new Error("website: the MCP manifest (packages/mcp/manifest.json) is missing");
}

const parse = (text: string, name: string) => {
  const manifest = JSON.parse(text) as Manifest;
  if (manifest.format !== MANIFEST_FORMAT)
    throw new Error(`${name}: format ${manifest.format} isn't ${MANIFEST_FORMAT}`);
  return manifest;
};

const cache = new Map<string, Manifest>();

/**
 * The manifest of `latest` or a pinned version (parsed once per process), or undefined for a
 * version that isn't pinned.
 */
export function manifestFor(version: string, dir = manifestsDir()): Manifest | undefined {
  const cached = cache.get(`${dir}\0${version}`);
  if (cached) return cached;
  let manifest: Manifest;
  if (version === "latest")
    manifest = parse(readFileSync(latestManifestPath(), "utf8"), "manifest");
  else {
    if (!VERSION_PATTERN.test(version) || !pinnedVersions(dir).includes(version)) return undefined;
    const file = join(dir, `${version}.json.gz`);
    manifest = parse(gunzipSync(readFileSync(file)).toString("utf8"), `manifests/${version}`);
  }
  cache.set(`${dir}\0${version}`, manifest);
  return manifest;
}
