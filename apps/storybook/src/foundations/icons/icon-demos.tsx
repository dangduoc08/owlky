import { Link } from "@owlky/react";
import { paletteColorNames } from "@owlky/tokens";
import { SolarIcon } from "../../helpers/solar-icons.js";
import { CodeBlock } from "../shared/code-block.js";
import { IconifyGlyph, type IconSetPrefix, iconSet } from "./iconify.js";

/** Solar variants, and the styles each one suits (ADR-0070 § 9). */
export const SOLAR_VARIANTS = [
  ["linear", "Linear", "Swiss, Editorial, Minimal Mono, Corporate (and every component icon)"],
  ["bold", "Bold", "Bauhaus, Neo-Brutalism"],
  ["bold-duotone", "Bold Duotone", "Soft"],
  ["line-duotone", "Line Duotone", "Nordic"],
  ["broken", "Broken", "Brutalism"],
  ["outline", "Outline", "Any style, as a lighter alternative to Linear"],
] as const;

function Credit({ prefix }: { prefix: IconSetPrefix }) {
  const set = iconSet(prefix);
  return (
    <p className="m-0 text-caption text-text-secondary">
      <Link href={set.url} target="_blank" rel="noreferrer" underline="always">
        {set.name}
      </Link>{" "}
      by {set.author} · {set.license} · <code>{prefix}:*</code>
    </p>
  );
}

const solarNames = (variant: string) =>
  iconSet("solar").names.filter((name) => name.endsWith(`-${variant}`));

/** Solar, the icon set of Owlky's components: one row per variant. */
export function SolarIcons() {
  return (
    <div className="flex flex-col gap-6">
      {SOLAR_VARIANTS.map(([variant, name, use]) => (
        <section key={variant} className="flex flex-col gap-2" aria-label={`${name} variant`}>
          <p className="m-0 text-subtitle2">
            {name} <span className="text-caption text-text-secondary">· {use}</span>
          </p>
          <div className="flex flex-wrap gap-4 text-text-secondary">
            {solarNames(variant).map((icon) => (
              <IconifyGlyph key={icon} icon={`solar:${icon}`} />
            ))}
          </div>
        </section>
      ))}
      <Credit prefix="solar" />
    </div>
  );
}

/** Circle Flags: the Phone input's optional image flags (a sample). */
export function FlagIcons() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-4">
        {iconSet("circle-flags").names.map((name) => (
          <IconifyGlyph key={name} icon={`circle-flags:${name}`} />
        ))}
      </div>
      <Credit prefix="circle-flags" />
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
            <SolarIcon name="magnifier-linear" size={size} />
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
            <SolarIcon name="letter-linear" size={24} />
          </span>
          {label}
        </span>
      ))}
    </div>
  );
}

const USAGE = `<!-- Decorative: next to visible text -->
<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24">
  <g fill="none" stroke="currentColor" stroke-width="1.5"><!-- Solar paths --></g>
</svg>

<!-- Meaningful on its own: give it a name -->
<svg role="img" aria-label="Search" width="24" height="24" viewBox="0 0 24 24">
  <g fill="none" stroke="currentColor" stroke-width="1.5"><!-- Solar paths --></g>
</svg>`;

/** Accessible SVG markup. */
export function IconUsage() {
  return <CodeBlock label="Icon markup examples">{USAGE}</CodeBlock>;
}
