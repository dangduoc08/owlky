// Serves the static build (out/) like a static host: folders → index.html, unknown paths → the
// 404 page. Local preview and e2e only (`PORT`, default 4400); production is Vercel.
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";

const out = resolve(import.meta.dirname, "../out");
const port = Number(process.env.PORT ?? 4400);
const types = {
  ".html": "text/html; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".wasm": "application/wasm",
};

const file = async (path) => {
  try {
    const info = await stat(path);
    if (info.isDirectory()) return file(join(path, "index.html"));
    return path;
  } catch {
    return null;
  }
};

createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", "http://localhost");
  const path = normalize(decodeURIComponent(url.pathname)).replace(/^[/\\]+/, "");
  const target = join(out, path);
  if (!target.startsWith(out)) {
    response.writeHead(404).end("Not found");
    return;
  }
  // `/components/button` → `/components/button/` (trailingSlash, as on Vercel).
  if (!url.pathname.endsWith("/") && !extname(url.pathname) && (await file(target))) {
    response.writeHead(308, { location: `${url.pathname}/${url.search}` }).end();
    return;
  }
  const found = await file(target);
  const served = found ?? join(out, "404.html");
  response.writeHead(found ? 200 : 404, {
    "content-type": types[extname(served)] ?? "application/octet-stream",
  });
  createReadStream(served).pipe(response);
}).listen(port, () => console.log(`website: http://localhost:${port}`));
