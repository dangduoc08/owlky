import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { afterAll, describe, expect, it } from "vitest";
import { loadManifest, MANIFEST_FORMAT } from "./manifest.js";

const dir = mkdtempSync(join(tmpdir(), "owlky-mcp-manifest-"));
afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe("loadManifest", () => {
  it("reads the manifest that ships with the package", () => {
    const manifest = loadManifest();
    expect(manifest.format).toBe(MANIFEST_FORMAT);
    expect(manifest.components.length).toBeGreaterThan(0);
  });

  it("refuses another format", () => {
    const file = join(dir, "old.json");
    writeFileSync(file, JSON.stringify({ format: MANIFEST_FORMAT + 1 }));
    expect(() => loadManifest(pathToFileURL(file))).toThrow(/Unsupported manifest format/);
  });
});
