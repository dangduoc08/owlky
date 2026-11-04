import {
  defaultTheme,
  paletteColorNames,
  type ShadowName,
  shadowNames,
} from "@minimal-tailwind/tokens";
import type { CSSProperties } from "react";

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

function ShadowTile({
  label,
  variable,
  style,
}: {
  label: string;
  variable: string;
  style?: CSSProperties;
}) {
  return (
    <div
      data-shadow={variable}
      className="grid h-30 place-items-center gap-1 rounded-md bg-paper text-center"
      style={{ boxShadow: `var(${variable})`, ...style }}
    >
      <span>
        <strong className="block text-subtitle2">{label}</strong>
        <code className="text-caption">{variable}</code>
      </span>
    </div>
  );
}

const GRID = "grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4";

/** System elevations 1–24 (`--mt-elevation-*`). */
export function SystemShadows() {
  return (
    <div className={GRID}>
      {defaultTheme.elevation.map((_, index) => (
        <ShadowTile
          // biome-ignore lint/suspicious/noArrayIndexKey: elevations are a fixed, ordered scale.
          key={index}
          label={`z${index + 1}`}
          variable={`--mt-elevation-${index + 1}`}
        />
      ))}
    </div>
  );
}

/** Display order of the extended shadows: the z-scale, then the named surfaces. */
const CUSTOM_ORDER: ShadowName[] = [
  ...shadowNames.filter((name) => name.startsWith("z")),
  "dialog",
  "card",
  "dropdown",
];

/** Extended shadows used by components (`--mt-shadow-*`). */
export function CustomShadows() {
  return (
    <div className={GRID}>
      {CUSTOM_ORDER.map((name) => (
        <ShadowTile
          key={name}
          label={name.startsWith("z") ? name : capitalize(name)}
          variable={`--mt-shadow-${name}`}
        />
      ))}
    </div>
  );
}

/** Colored shadows for filled surfaces (`--mt-shadow-<color>`). */
export function ColorShadows() {
  return (
    <div className={GRID}>
      {paletteColorNames.flatMap((name) => [
        <ShadowTile
          key={`${name}-filled`}
          label={capitalize(name)}
          variable={`--mt-shadow-${name}`}
          style={{
            backgroundColor: `var(--mt-palette-${name}-main)`,
            color: `var(--mt-palette-${name}-contrast-text)`,
          }}
        />,
        <ShadowTile
          key={`${name}-paper`}
          label={capitalize(name)}
          variable={`--mt-shadow-${name}`}
          style={{ color: `var(--mt-palette-${name}-text)` }}
        />,
      ])}
    </div>
  );
}
