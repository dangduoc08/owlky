/**
 * Writes the Iconify subsets that Storybook uses (offline, no request to the Iconify API; the
 * full collections are megabytes each):
 *   - src/foundations/icons/icon-data.json: the Icons foundation galleries (Solar variants, a
 *     few Circle Flags);
 *   - src/helpers/solar-icons.json: the Solar icons of the docs examples (`SolarIcon`,
 *     `solarMarkup`). Add a name to DOCS when an example needs another icon.
 * Edit the lists, then run `pnpm --filter @owlky/storybook icons`.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

/** Solar variants, in the order the Icons page shows them. */
export const VARIANTS = ["linear", "bold", "bold-duotone", "line-duotone", "broken", "outline"];
const GALLERY = [
  "home-angle",
  "letter",
  "bell-bing",
  "settings",
  "user-rounded",
  "magnifier",
  "calendar",
  "chat-round-dots",
  "cart-large-2",
  "heart",
  "star",
  "trash-bin-trash",
];

/** Icons of the docs examples (Solar names with their variant). */
const DOCS = [
  "add-linear",
  "alt-arrow-left-linear",
  "alt-arrow-right-linear",
  "box-linear",
  "check-linear",
  "close-linear",
  "copy-linear",
  "eye-linear",
  "eye-closed-linear",
  "gallery-linear",
  "gallery-remove-linear",
  "heart-bold",
  "heart-linear",
  "home-angle-linear",
  "inbox-linear",
  "letter-linear",
  "magnifier-linear",
  "map-point-bold",
  "map-point-linear",
  "menu-dots-vertical-linear",
  "minus-linear",
  "phone-linear",
  "settings-linear",
  "star-bold",
  "star-linear",
  "text-bold-linear",
  "text-italic-linear",
  "text-underline-linear",
  "trash-bin-trash-linear",
  "wi-fi-router-linear",
];

const SETS = {
  solar: GALLERY.flatMap((name) => VARIANTS.map((variant) => `${name}-${variant}`)),
  // Phone input's image flags (ADR-0070 § 9): a sample, not every country.
  "circle-flags": ["br", "ca", "de", "fr", "gb", "in", "jp", "kr", "mx", "us", "vn", "za"],
};

const ROOT_KEYS = ["prefix", "width", "height", "left", "top"];
const load = (prefix, file) =>
  JSON.parse(readFileSync(require.resolve(`@iconify-json/${prefix}/${file}`), "utf8"));

/** Resolves an icon or an alias to its data (aliases of Solar only rename). */
function iconData(source, name, prefix) {
  if (source.icons[name]) return source.icons[name];
  const alias = source.aliases?.[name];
  if (alias) return { ...iconData(source, alias.parent, prefix), ...alias, parent: undefined };
  throw new Error(`Unknown icon ${prefix}:${name}`);
}

const collections = Object.entries(SETS).map(([prefix, names]) => {
  const source = load(prefix, "icons.json");
  const out = Object.fromEntries(ROOT_KEYS.filter((k) => k in source).map((k) => [k, source[k]]));
  out.icons = Object.fromEntries(names.map((name) => [name, iconData(source, name, prefix)]));
  const info = load(prefix, "info.json");
  return { collection: out, names, info };
});

const data = {
  // Name, author and license are shown on the page (Solar is CC BY 4.0: attribution required).
  sets: collections.map(({ collection, names, info }) => ({
    prefix: collection.prefix,
    name: info.name,
    author: info.author.name,
    url: info.author.url,
    license: info.license.title,
    names,
  })),
  collections: collections.map(({ collection }) => collection),
};
writeFileSync(
  new URL("../src/foundations/icons/icon-data.json", import.meta.url),
  `${JSON.stringify(data)}\n`,
);

const solar = load("solar", "icons.json");
const docs = Object.fromEntries(
  DOCS.map((name) => {
    const {
      body,
      width = solar.width ?? 24,
      height = solar.height ?? 24,
    } = iconData(solar, name, "solar");
    return [name, { body, width, height }];
  }),
);
writeFileSync(
  new URL("../src/helpers/solar-icons.json", import.meta.url),
  `${JSON.stringify(docs, null, 2)}\n`,
);
console.log(
  `${collections.map(({ collection, names }) => `${collection.prefix}: ${names.length}`).join(", ")}, docs: ${DOCS.length}`,
);
