import {
  contrastRatio,
  defaultTheme,
  greyShades,
  hexToRgb,
  type PaletteColorName,
  type PrimaryPreset,
  primaryPresets,
} from "@owlky/tokens";
import { useEffect, useRef, useState } from "react";

export type PaletteName = PaletteColorName | "grey";

interface Swatch {
  name: string;
  hex: string;
  variable: string;
}

const SHADES = ["lighter", "light", "main", "dark", "darker"] as const;
/**
 * Swatch text, as in the reference (MUI `getContrastText`): white when it reaches 3:1, otherwise
 * 87 % black. Brand swatches are exempt from the AA text check by design (ADR-0014).
 */
const swatchText = (hex: string) =>
  contrastRatio("#FFFFFF", hex) >= 3 ? "#FFFFFF" : "rgba(0, 0, 0, 0.87)";

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

function swatches(palette: PaletteName, preset: PrimaryPreset): Swatch[] {
  if (palette === "grey") {
    return greyShades.map((shade) => ({
      name: String(shade),
      hex: defaultTheme.grey[shade],
      variable: `--ok-palette-grey-${shade}`,
    }));
  }
  return SHADES.map((shade) => ({
    name: capitalize(shade),
    hex: (palette === "primary" ? primaryPresets[preset] : defaultTheme.palette[palette])[shade],
    variable: `--ok-palette-${palette}-${shade}`,
  }));
}

export interface PaletteProps {
  /** Palette to show. Values come from `@owlky/tokens`. */
  palette: PaletteName;
  /** Primary preset (the Storybook toolbar's "Preset"). Default `"default"`. */
  preset?: PrimaryPreset | undefined;
}

/** The shades of one palette with Hex / Rgb / CSS variable. Click a swatch to copy its hex. */
export function Palette({ palette, preset = "default" }: PaletteProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async (hex: string) => {
    try {
      await navigator.clipboard.writeText(hex);
      setCopied(hex);
      setStatus(`Copied ${hex}`);
    } catch {
      setCopied(null);
      setStatus(`Couldn't copy ${hex}: clipboard access was denied`);
    }
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setCopied(null);
      setStatus("");
    }, 2000);
  };

  return (
    <div>
      <div className="grid grid-cols-1 overflow-hidden rounded-lg sm:grid-cols-2 lg:grid-cols-3">
        {swatches(palette, preset).map((swatch) => {
          const [r, g, b] = hexToRgb(swatch.hex);
          const rows: [value: string, label: string][] = [
            [swatch.hex, "Hex"],
            [`${r} ${g} ${b}`, "Rgb"],
            [swatch.variable, "Var"],
          ];
          return (
            <button
              key={swatch.variable}
              type="button"
              onClick={() => copy(swatch.hex)}
              data-swatch=""
              aria-describedby="copy-hint"
              className="flex cursor-pointer flex-col px-4 py-6 text-left hover:opacity-80 focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-current"
              style={{
                backgroundColor: `var(${swatch.variable})`,
                color: swatchText(swatch.hex),
              }}
            >
              <span className="mb-4 text-subtitle2">
                {copied === swatch.hex ? "Copied!" : swatch.name}
              </span>
              <span className="flex flex-col gap-3">
                {rows.map(([value, label]) => (
                  <span
                    key={label}
                    className="flex items-center justify-between gap-2 text-caption"
                  >
                    <strong className="truncate font-medium">{value}</strong>
                    <span>{label}</span>
                  </span>
                ))}
              </span>
            </button>
          );
        })}
      </div>
      <p id="copy-hint" hidden>
        Copies the hex value to the clipboard.
      </p>
      <p role="status" className="sr-only">
        {status}
      </p>
    </div>
  );
}
