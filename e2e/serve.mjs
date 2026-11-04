// Minimal static server for e2e: serves the built Storybook and the plain-HTML example (which
// loads packages/*/dist). Only these directories are exposed; paths can't escape them.
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const allowed = [
  "apps/storybook/storybook-static",
  "examples",
  "packages/html/dist",
  "packages/styles/dist",
];
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".png": "image/png",
  ".map": "application/json",
};
const port = Number(process.env.PORT ?? 4321);

createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", "http://localhost");
  let path = normalize(decodeURIComponent(url.pathname)).replace(/^[/\\]+/, "");
  if (!allowed.some((dir) => path === dir || path.startsWith(`${dir}/`))) {
    response.writeHead(404).end("Not found");
    return;
  }
  let file = join(root, path);
  try {
    if ((await stat(file)).isDirectory()) file = join(file, "index.html");
    await stat(file);
  } catch {
    response.writeHead(404).end("Not found");
    return;
  }
  path = file;
  response.writeHead(200, { "content-type": types[extname(path)] ?? "application/octet-stream" });
  createReadStream(path).pipe(response);
}).listen(port, () => console.log(`e2e server: http://localhost:${port}`));
