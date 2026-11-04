// Enforces framework independence (ADR-0008) on manifests and on built output — the lint rule
// covers source imports, this covers dependencies and anything a bundler might have inlined.
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const REACT = ["react", "react-dom", "@minimal-tailwind/react"];
const rules = {
  tokens: REACT,
  styles: REACT,
  core: REACT,
  html: REACT,
  react: ["@minimal-tailwind/html"],
};

async function* files(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true }).catch(() => [])) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* files(path);
    else if (/\.(m?js)$/.test(entry.name)) yield path;
  }
}

const problems = [];
for (const [name, forbidden] of Object.entries(rules)) {
  const dir = join("packages", name);
  const manifest = JSON.parse(await readFile(join(dir, "package.json"), "utf8"));
  for (const field of [
    "dependencies",
    "peerDependencies",
    "optionalDependencies",
    "devDependencies",
  ]) {
    for (const dep of Object.keys(manifest[field] ?? {})) {
      if (forbidden.includes(dep)) problems.push(`${manifest.name}: ${field} contains "${dep}"`);
    }
  }
  for await (const file of files(join(dir, "dist"))) {
    const code = await readFile(file, "utf8");
    for (const dep of forbidden) {
      const pattern = new RegExp(`(from|import|require\\()\\s*\\(?["']${dep}(/[^"']*)?["']`);
      if (pattern.test(code)) problems.push(`${file}: imports "${dep}"`);
    }
  }
}

if (problems.length > 0) {
  console.error(`Framework boundary violations:\n  ${problems.join("\n  ")}`);
  process.exit(1);
}
console.log("boundaries: OK (html/core/styles/tokens are React-free; react does not use html)");
