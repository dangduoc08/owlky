/**
 * Writes src/foundations/icons/icon-data.json: the subset of Iconify collections used by the
 * Icons foundation page. The full collections are megabytes each, so stories load only this
 * file (offline — no request to the Iconify API). Edit SETS, then run `pnpm --filter
 * @minimal-tailwind/storybook icons`.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const SETS = {
  solar: [
    "home-angle-bold-duotone",
    "user-rounded-bold-duotone",
    "bell-bing-bold-duotone",
    "settings-bold-duotone",
    "shield-keyhole-bold-duotone",
    "bill-list-bold-duotone",
    "chat-round-dots-bold",
    "cart-3-bold",
    "calendar-date-bold",
    "letter-bold",
    "gallery-wide-bold",
    "trash-bin-trash-bold",
    "pen-bold",
    "eye-bold",
    "eye-closed-bold",
    "star-bold",
    "heart-bold",
    "share-bold",
    "copy-bold",
    "download-minimalistic-bold",
    "upload-minimalistic-bold",
    "filter-bold",
    "magnifer-linear",
    "lock-password-outline",
  ],
  eva: [
    "arrow-ios-back-fill",
    "arrow-ios-forward-fill",
    "arrow-ios-upward-fill",
    "arrow-ios-downward-fill",
    "checkmark-fill",
    "close-fill",
    "plus-fill",
    "minus-fill",
    "more-horizontal-fill",
    "more-vertical-fill",
    "search-fill",
    "menu-2-fill",
  ],
  logos: ["google-icon", "facebook", "instagram-icon", "linkedin-icon", "x", "github-icon"],
  "vscode-icons": [
    "file-type-pdf2",
    "file-type-word",
    "file-type-excel",
    "file-type-powerpoint",
    "file-type-text",
    "file-type-zip",
    "file-type-image",
    "file-type-video",
    "file-type-audio",
    "file-type-ai2",
    "file-type-photoshop2",
    "file-type-js-official",
    "file-type-typescript-official",
    "default-folder",
  ],
  // Every two-letter country code in the set (`xx` is the "unknown" placeholder).
  "circle-flags": /^(?!xx)[a-z]{2}$/,
};

/** Monochrome brand marks drawn in black become currentColor, so they stay visible in dark mode. */
const CURRENT_COLOR = { logos: ["x", "github-icon", "instagram-icon"] };

const ROOT_KEYS = ["prefix", "width", "height", "left", "top"];

const collections = Object.entries(SETS).map(([prefix, names]) => {
  const source = JSON.parse(
    readFileSync(require.resolve(`@iconify-json/${prefix}/icons.json`), "utf8"),
  );
  const list =
    names instanceof RegExp ? Object.keys(source.icons).filter((n) => names.test(n)) : names;
  const out = Object.fromEntries(ROOT_KEYS.filter((k) => k in source).map((k) => [k, source[k]]));
  out.icons = {};
  out.aliases = {};
  const add = (name) => {
    if (source.icons[name]) {
      out.icons[name] = { ...source.icons[name] };
      if (CURRENT_COLOR[prefix]?.includes(name)) {
        const body = out.icons[name].body.replace(/fill="#[0-9a-f]{3,6}"/gi, 'fill="currentColor"');
        out.icons[name].body = body.includes("currentColor")
          ? body
          : body.replace(/<path /g, '<path fill="currentColor" ');
      }
    } else if (source.aliases?.[name]) {
      out.aliases[name] = source.aliases[name];
      add(source.aliases[name].parent);
    } else throw new Error(`Unknown icon ${prefix}:${name}`);
  };
  for (const name of list) add(name);
  if (Object.keys(out.aliases).length === 0) delete out.aliases;
  const info = JSON.parse(
    readFileSync(require.resolve(`@iconify-json/${prefix}/info.json`), "utf8"),
  );
  return { collection: out, names: list, info };
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
console.log(
  collections.map(({ collection, names }) => `${collection.prefix}: ${names.length}`).join(", "),
);
