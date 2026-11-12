import { Card } from "@owlky/react";
import {
  type FontFamilyPreset,
  fontFamilyPresetNames,
  type PrimaryPreset,
  primaryPresetNames,
} from "@owlky/tokens";

const label = (value: string) =>
  value.replace(
    /(^|-)([a-z])/g,
    (_, dash: string, c: string) => `${dash ? " " : ""}${c.toUpperCase()}`,
  );

const SHADES = ["lighter", "light", "main", "dark", "darker"] as const;

/**
 * Each primary preset in its own `data-ok-preset` scope: the shades and the primary text tone
 * (AA on the scheme's surfaces), as every component inside the scope sees them.
 */
export function PresetGallery({
  presets = primaryPresetNames,
}: {
  presets?: readonly PrimaryPreset[];
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {presets.map((preset) => (
        <Card
          key={preset}
          component="section"
          data-ok-preset={preset}
          aria-label={`${label(preset)} preset`}
          className="p-4"
        >
          <code className="text-caption text-[var(--ok-text-secondary)]">
            data-ok-preset="{preset}"
          </code>
          <div className="mt-3 flex overflow-hidden rounded-md" aria-hidden="true">
            {SHADES.map((shade) => (
              <span
                key={shade}
                data-swatch=""
                className="h-10 flex-1"
                style={{ backgroundColor: `var(--ok-palette-primary-${shade})` }}
              />
            ))}
          </div>
          <p className="mt-3 text-subtitle2 text-[var(--ok-palette-primary-text)]">
            {label(preset)} — primary text
          </p>
        </Card>
      ))}
    </div>
  );
}

/** Each font family in its own `data-ok-font` scope (fonts loaded by the Storybook preview). */
export function FontGallery({
  fonts = fontFamilyPresetNames,
}: {
  fonts?: readonly FontFamilyPreset[];
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {fonts.map((font) => (
        <Card
          key={font}
          component="section"
          data-ok-font={font}
          aria-label={`${label(font)} font`}
          className="p-4"
        >
          <code className="text-caption text-[var(--ok-text-secondary)]">
            data-ok-font="{font}"
          </code>
          <p className="mt-2 text-h4">{label(font)}</p>
          <p className="mt-1 text-body2 text-[var(--ok-text-secondary)]">
            The quick brown fox jumps over the lazy dog. 0123456789
          </p>
        </Card>
      ))}
    </div>
  );
}
