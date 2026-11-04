import { paletteColorNames } from "@minimal-tailwind/tokens";
import { CodeBlock } from "../shared/code-block.js";
import { Icon, iconNames } from "./icons.js";

const SOURCES = [
  ["Iconify — 200,000+ open-source icons", "https://icon-sets.iconify.design"],
  ["Material Symbols", "https://fonts.google.com/icons"],
] as const;

/** Sample icons, plus recommended open-source sets. No icon set is bundled. */
export function IconSets() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-6 text-text-primary">
        {iconNames.map((name) => (
          <Icon key={name} name={name} width={24} height={24} />
        ))}
      </div>
      <ul className="m-0 flex list-none flex-col gap-1 p-0 text-body2">
        {SOURCES.map(([label, href]) => (
          <li key={href}>
            <a href={href} target="_blank" rel="noreferrer" className="text-primary-text">
              {label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

const SIZES = [
  [16, "Dense UI, inline with caption text"],
  [20, "Inside buttons, inputs and menus"],
  [24, "Standalone and icon buttons"],
  [32, "Empty states and feature highlights"],
] as const;

/** Recommended sizes on a 24 × 24 grid. */
export function IconSizes() {
  return (
    <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
      {SIZES.map(([size, use]) => (
        <figure key={size} className="m-0 flex flex-col items-start gap-3">
          <span className="grid h-10 place-items-center">
            <Icon name="search" width={size} height={size} />
          </span>
          <figcaption>
            <strong className="block text-subtitle2">{size}px</strong>
            <span className="text-caption text-text-secondary">{use}</span>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

/** Icons use `currentColor`, so they follow the text color of their container. */
export function IconColors() {
  const colors = [
    ["text-primary", "--mt-text-primary"],
    ["text-secondary", "--mt-text-secondary"],
    ...paletteColorNames.map((name) => [name, `--mt-palette-${name}-text`] as const),
  ] as const;
  return (
    <div className="flex flex-wrap gap-6">
      {colors.map(([label, variable]) => (
        <span key={label} className="flex flex-col items-center gap-2 text-caption">
          <span style={{ color: `var(${variable})` }}>
            <Icon name="info" width={24} height={24} />
          </span>
          {label}
        </span>
      ))}
    </div>
  );
}

const USAGE = `<!-- Decorative: next to visible text -->
<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24"
     fill="none" stroke="currentColor" stroke-width="2">…</svg>

<!-- Meaningful on its own: give it a name -->
<svg role="img" aria-label="Search" width="24" height="24" viewBox="0 0 24 24">…</svg>`;

/** Accessible SVG markup. */
export function IconUsage() {
  return <CodeBlock label="Icon markup examples">{USAGE}</CodeBlock>;
}
