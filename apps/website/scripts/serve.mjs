// Serves the production build (`next start`): the static pages and public/ files, plus the server
// routes (accounts, /mcp). Local preview and e2e only (`PORT`, default 4400); production is Vercel.
//
// Without configuration it runs fully locally: PGlite (OWLKY_PGLITE_DIR, default .data/pglite),
// the development secret and no OAuth providers. `--mock` also starts the mock OAuth providers
// (scripts/mock-oauth.mjs) and points the server at them, like the e2e tests do.
import { spawn } from "node:child_process";
import { join } from "node:path";
import { app } from "./content.mjs";
import { startMockOAuth } from "./mock-oauth.mjs";

const port = String(process.env.PORT ?? 4400);
const env = { ...process.env, PORT: port, NEXT_TELEMETRY_DISABLED: "1" };
env.BETTER_AUTH_URL ??= `http://localhost:${port}`;
if (process.argv.includes("--mock")) {
  const mock = await startMockOAuth(Number(process.env.MOCK_OAUTH_PORT ?? 0));
  env.OWLKY_OAUTH_MOCK = mock.origin;
  console.log(`website: mock OAuth providers at ${mock.origin}`);
}
const next = spawn(join(app, "node_modules/.bin/next"), ["start", "-p", port], {
  cwd: app,
  env,
  stdio: "inherit",
});
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => next.kill(signal));
next.on("exit", (code) => process.exit(code ?? 0));
