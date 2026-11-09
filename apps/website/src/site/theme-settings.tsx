"use client";

import { applyThemeSettings, readThemeSettings, TextField, type ThemeSettings } from "@owlky/react";
import { fontFamilyPresetNames, primaryPresetNames } from "@owlky/tokens";
import { useEffect, useState } from "react";

/*
 * Theme, Preset and Font menus (ADR-0017 theme settings through `applyThemeSettings`). The choice
 * is kept in localStorage; the inline script in the layout applies it before the first paint.
 */

const label = (value: string) =>
  value.replace(
    /(^|-)([a-z])/g,
    (_, dash: string, c: string) => `${dash ? " " : ""}${c.toUpperCase()}`,
  );

const MENUS = [
  { key: "mode", label: "Theme", values: ["light", "dark", "system"] },
  { key: "preset", label: "Preset", values: primaryPresetNames },
  { key: "font", label: "Font", values: fontFamilyPresetNames },
] as const;

export function ThemeSettingsMenus() {
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
  return (
    <div className="flex flex-wrap items-center gap-2">
      {MENUS.map((menu) => (
        <TextField
          key={menu.key}
          select
          size="small"
          id={`site-${menu.key}`}
          label={menu.label}
          value={settings?.[menu.key] ?? menu.values[0]}
          onChange={(value) => change({ [menu.key]: value })}
          className="w-32"
        >
          {menu.values.map((value) => (
            <option key={value} value={value}>
              {label(value)}
            </option>
          ))}
        </TextField>
      ))}
    </div>
  );
}
