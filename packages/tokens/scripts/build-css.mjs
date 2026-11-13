// Generates dist/tokens.css and dist/tokens.json from the compiled TypeScript tokens, and one
// opt-in sheet per style besides the default, dist/sheets/<id>.css (ADR-0070 § 6, ADR-0073).
import { mkdir, writeFile } from "node:fs/promises";
import {
  defaultStyleName,
  defaultTheme,
  styleNames,
  styleSheetCss,
  styles,
  styleTheme,
  themeToCss,
  themeToCssVariables,
} from "../dist/index.js";

const banner = "/* @owlky/tokens — generated, do not edit. */\n";

await writeFile(new URL("../dist/tokens.css", import.meta.url), banner + themeToCss(defaultTheme));
await writeFile(
  new URL("../dist/tokens.json", import.meta.url),
  `${JSON.stringify({ theme: defaultTheme, cssVariables: themeToCssVariables(defaultTheme) }, null, 2)}\n`,
);

await mkdir(new URL("../dist/sheets/", import.meta.url), { recursive: true });
const sheets = styleNames.filter((name) => name !== defaultStyleName);
for (const name of sheets) {
  const css = styleSheetCss(styleTheme(styles[name]));
  const head = `/* @owlky/tokens — the ${styles[name].name} style (data-ok-style="${name}"), generated, do not edit. Load after owlky.css. */\n`;
  await writeFile(new URL(`../dist/sheets/${name}.css`, import.meta.url), head + css);
}
console.log(`tokens: wrote dist/tokens.css, dist/tokens.json and ${sheets.length} style sheets`);
