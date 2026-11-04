import { paletteColorNames } from "@owlky/tokens";
import { CodeBlock } from "../shared/code-block.js";
import { IconifyGlyph, type IconSetPrefix, iconSet } from "./iconify.js";
import { Icon, iconNames } from "./icons.js";

function Credit({ prefix }: { prefix: IconSetPrefix }) {
  const set = iconSet(prefix);
  return (
    <p className="m-0 text-caption text-text-secondary">
      <a href={set.url} target="_blank" rel="noreferrer" className="text-primary-text underline">
        {set.name}
      </a>{" "}
      by {set.author} · {set.license} · <code>{prefix}:*</code>
    </p>
  );
}

function Gallery({ prefix, size = 24 }: { prefix: IconSetPrefix; size?: number }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-4 text-text-secondary">
        {iconSet(prefix).names.map((name) => (
          <IconifyGlyph key={name} icon={`${prefix}:${name}`} size={size} />
        ))}
      </div>
      <Credit prefix={prefix} />
    </div>
  );
}

/** Iconify icons used across the docs: Solar (main set) and Eva (small UI glyphs). */
export function IconifyIcons() {
  return (
    <div className="flex flex-col gap-8">
      <Gallery prefix="solar" />
      <Gallery prefix="eva" />
      <p className="m-0 text-body2">
        Browse every set on{" "}
        <a
          href="https://icon-sets.iconify.design"
          target="_blank"
          rel="noreferrer"
          className="text-primary-text underline"
        >
          Iconify icon sets
        </a>
        .
      </p>
    </div>
  );
}

/** Material Symbols, Google's icon font and SVG set. */
export function MaterialIcons() {
  return (
    <p className="m-0 text-body2">
      <a
        href="https://fonts.google.com/icons"
        target="_blank"
        rel="noreferrer"
        className="text-primary-text underline"
      >
        Material Symbols on Google Fonts
      </a>
    </p>
  );
}

/** Simple stroke icons drawn for these docs (24 × 24, `currentColor`). */
export function LocalIcons() {
  return (
    <div className="flex flex-wrap gap-6 text-text-primary">
      {iconNames.map((name) => (
        <span key={name} role="img" aria-label={name} title={name} className="inline-flex">
          <Icon name={name} width={24} height={24} />
        </span>
      ))}
    </div>
  );
}

/** Brand marks keep their colors; monochrome ones follow the text color. */
export function SocialIcons() {
  return (
    <div className="flex flex-col gap-4 text-text-primary">
      <Gallery prefix="logos" size={20} />
    </div>
  );
}

/** File-type icons. */
export function FileIcons() {
  return <Gallery prefix="vscode-icons" size={32} />;
}

/** Circle flags for every two-letter country code. */
export function FlagIcons() {
  return <Gallery prefix="circle-flags" size={24} />;
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
    ["text-primary", "--ok-text-primary"],
    ["text-secondary", "--ok-text-secondary"],
    ...paletteColorNames.map((name) => [name, `--ok-palette-${name}-text`] as const),
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
