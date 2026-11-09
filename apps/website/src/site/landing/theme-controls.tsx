"use client";

import {
  applyThemeSettings,
  FormControlLabel,
  readThemeSettings,
  Switch,
  type ThemeSettings,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@owlky/react";
import { primaryPresetNames } from "@owlky/tokens";
import { useEffect, useState } from "react";

/*
 * The "Themes and presets" card: the swatches and the switch change the whole page's theme
 * settings (ADR-0017), saved like the docs pages' Theme and Preset menus.
 */

const PRESETS = primaryPresetNames;

const name = (preset: string) =>
  preset === "default" ? "Green" : preset[0]?.toUpperCase() + preset.slice(1);

export function ThemeControls() {
  const [settings, setSettings] = useState<ThemeSettings | null>(null);
  useEffect(() => {
    setSettings(readThemeSettings({ storage: localStorage }));
  }, []);
  const change = (next: Partial<ThemeSettings>) => {
    try {
      setSettings(applyThemeSettings(next, { storage: localStorage }));
    } catch {
      setSettings(applyThemeSettings(next));
    }
  };
  const dark =
    settings?.mode === "dark" ||
    (settings?.mode === "system" &&
      typeof matchMedia === "function" &&
      matchMedia("(prefers-color-scheme: dark)").matches);
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Typography
          variant="overline"
          color="textSecondary"
          component="p"
          className="m-0"
          id="landing-preset"
        >
          Primary color
        </Typography>
        <ToggleButtonGroup
          exclusive
          aria-labelledby="landing-preset"
          value={settings?.preset ?? "default"}
          onChange={(value) => {
            if (typeof value === "string") change({ preset: value as ThemeSettings["preset"] });
          }}
          data-landing-swatches=""
        >
          {PRESETS.map((preset) => (
            <ToggleButton
              key={preset}
              value={preset}
              aria-label={name(preset)}
              title={name(preset)}
            >
              <span data-landing-swatch="" data-ok-preset={preset} aria-hidden="true" />
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </div>
      <FormControlLabel
        label="Dark mode"
        control={
          <Switch
            checked={dark}
            onChange={(checked) => change({ mode: checked ? "dark" : "light" })}
          />
        }
      />
    </div>
  );
}
