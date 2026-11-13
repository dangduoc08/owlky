"use client";

import {
  applyThemeSettings,
  FormControlLabel,
  readThemeSettings,
  Switch,
  type ThemeSettings,
} from "@owlky/react";
import { useEffect, useState } from "react";

/*
 * The "Themes and tokens" card: the switch changes the whole page's theme (ADR-0070), saved like
 * the docs pages' Theme menu.
 */

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
