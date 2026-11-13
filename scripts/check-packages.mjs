// Validates every publishable package as npm would see it: publint (package.json, exports, files)
// and Are The Types Wrong (type resolution for ESM consumers).
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const packages = ["tokens", "styles", "core", "react", "html", "mcp"];
const run = (command, args) => execFileSync(command, args, { stdio: "inherit" });

for (const name of packages) {
  const dir = `packages/${name}`;
  console.log(`\n▶ @owlky/${name}`);
  run("pnpm", ["exec", "publint", dir, "--strict"]);

  // attw only understands JS/TS modules: skip asset exports (CSS, the IIFE bundle, JSON, globs).
  const { exports } = JSON.parse(readFileSync(`${dir}/package.json`, "utf8"));
  const keys = Object.keys(exports);
  const assets = keys.filter((key) => /\.(css|m?js|json|html)$|\*/.test(key));
  if (assets.length === keys.length) continue;
  run("pnpm", [
    "exec",
    "attw",
    "--pack",
    dir,
    "--profile",
    "esm-only",
    "--format",
    "table-flipped",
    "--exclude-entrypoints",
    ...assets,
  ]);
}
