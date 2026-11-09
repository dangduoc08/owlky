// Smoke test of the packed @owlky/mcp (ADR-0046): `pnpm pack` the package, start its bin from the
// tarball with `npx -y` in an empty directory (as a user's MCP client would), then speak MCP over
// stdio: initialize, tools/list and one tool call. Run after `pnpm build`:
//   node scripts/smoke-mcp.mjs
import { execFileSync, spawn } from "node:child_process";
import { mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createInterface } from "node:readline";

const root = resolve(import.meta.dirname, "..");
const work = mkdtempSync(join(tmpdir(), "owlky-mcp-smoke-"));
const fail = (message) => {
  console.error(`smoke: ${message}`);
  process.exitCode = 1;
};
const EXPECTED = [
  "get_component",
  "get_examples",
  "get_guide",
  "list_components",
  "search_tokens",
  "validate_markup",
];

let child;
try {
  execFileSync("pnpm", ["pack", "--pack-destination", work], {
    cwd: join(root, "packages/mcp"),
    stdio: ["ignore", "ignore", "inherit"],
  });
  const tarball = readdirSync(work).find((file) => file.endsWith(".tgz"));
  if (!tarball) throw new Error("pnpm pack wrote no tarball");
  const files = execFileSync("tar", ["-tzf", join(work, tarball)], { encoding: "utf8" })
    .trim()
    .split("\n");
  for (const required of ["package/dist/cli.js", "package/manifest.json", "package/README.md"])
    if (!files.includes(required)) throw new Error(`the tarball lacks ${required}`);
  const leaked = files.filter((file) => /\.test\.|\/src\/|test-utils/.test(file));
  if (leaked.length) throw new Error(`the tarball ships sources or tests: ${leaked.join(", ")}`);

  const app = join(work, "app");
  execFileSync("mkdir", [app]);
  child = spawn("npx", ["-y", "--package", join(work, tarball), "owlky-mcp"], {
    cwd: app,
    stdio: ["pipe", "pipe", "inherit"],
    env: { ...process.env, npm_config_update_notifier: "false" },
  });
  const lines = createInterface({ input: child.stdout });
  const pending = new Map();
  lines.on("line", (line) => {
    const message = JSON.parse(line);
    pending.get(message.id)?.(message);
  });
  let next = 1;
  const request = (method, params) =>
    new Promise((done, reject) => {
      const id = next++;
      const timer = setTimeout(() => reject(new Error(`${method}: no answer in 120 s`)), 120_000);
      pending.set(id, (message) => {
        clearTimeout(timer);
        if (message.error) reject(new Error(`${method}: ${message.error.message}`));
        else done(message.result);
      });
      child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id, method, params })}\n`);
    });

  const init = await request("initialize", {
    protocolVersion: "2025-06-18",
    capabilities: {},
    clientInfo: { name: "owlky-smoke", version: "0.0.0" },
  });
  if (init.serverInfo?.name !== "owlky")
    fail(`unexpected server ${JSON.stringify(init.serverInfo)}`);
  child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" })}\n`);
  const { tools } = await request("tools/list", {});
  const names = tools.map((tool) => tool.name).sort();
  if (JSON.stringify(names) !== JSON.stringify(EXPECTED)) fail(`tools/list: ${names.join(", ")}`);
  const result = await request("tools/call", {
    name: "get_component",
    arguments: { name: "button" },
  });
  if (result.isError || result.structuredContent?.root !== "data-ok-button")
    fail("tools/call get_component did not return the Button");
  if (!process.exitCode)
    console.log(
      `smoke: ${tarball} starts with npx, serves ${names.length} tools (Owlky ${init.serverInfo.version})`,
    );
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
} finally {
  child?.kill();
  rmSync(work, { recursive: true, force: true });
}
