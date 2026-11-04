// Generates dist/tokens.css and dist/tokens.json from the compiled TypeScript tokens.
import { writeFile } from "node:fs/promises";
import { defaultTheme, themeToCss, themeToCssVariables } from "../dist/index.js";

const banner = "/* @minimal-tailwind/tokens — generated, do not edit. */\n";

await writeFile(new URL("../dist/tokens.css", import.meta.url), banner + themeToCss(defaultTheme));
await writeFile(
  new URL("../dist/tokens.json", import.meta.url),
  `${JSON.stringify({ theme: defaultTheme, cssVariables: themeToCssVariables(defaultTheme) }, null, 2)}\n`,
);
console.log("tokens: wrote dist/tokens.css, dist/tokens.json");
