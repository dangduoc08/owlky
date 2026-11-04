// After `changeset version`: copy the html package version into its runtime VERSION constant.
import { readFile, writeFile } from "node:fs/promises";

const { version } = JSON.parse(await readFile("packages/html/package.json", "utf8"));
const file = "packages/html/src/runtime/version.ts";
const source = await readFile(file, "utf8");
await writeFile(
  file,
  source.replace(/export const VERSION = "[^"]*";/, `export const VERSION = "${version}";`),
);
console.log(`html runtime VERSION → ${version}`);
