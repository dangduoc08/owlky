import { Button } from "@owlky/react";
import {
  fontFamilyPresetNames,
  fontSizeRange,
  primaryPresetNames,
  primaryPresets,
} from "@owlky/tokens";
import {
  Caption,
  capitalize,
  codeList,
  Dot,
  GuideDocs,
  type GuideSection,
  Preview,
} from "../../helpers/guide.js";

const fontLabel = (name: string) => name.split("-").map(capitalize).join(" ");

export const settingsSections: GuideSection[] = [
  {
    id: "overview",
    title: "Theme settings",
    body: `Theme settings let your users personalize the interface. There are four settings:

- **Mode:** ${codeList(["light", "dark", "system"])}. The \`system\` mode follows the operating system.
- **Primary color preset:** ${codeList(primaryPresetNames)}.
- **Font family:** ${codeList(fontFamilyPresetNames)}.
- **Font size:** the root font size, from ${fontSizeRange.min}px to ${fontSizeRange.max}px. The default is ${fontSizeRange.default}px.

Each setting is an attribute or a style on an element, so it works without JavaScript. The **Theme**, **Preset**, **Font** and **Font size** menus in the toolbar change the same settings for every story.`,
  },
  {
    id: "presets",
    title: "Change the primary color",
    body: "Set `data-ok-preset` to replace the primary color everywhere it's used, such as filled buttons, selected states and colored shadows. The other palette colors don't change.",
    html: `<html data-ok-preset="purple">
  …
</html>`,
    react: `import { applyThemeSettings } from "@owlky/react";

applyThemeSettings({ preset: "purple" });`,
  },
  {
    id: "fonts",
    title: "Change the font family",
    body: "Set `data-ok-font` to switch the main font. Owlky doesn't bundle fonts, so load the one you choose. Fontsource packages work well: for example, `@fontsource-variable/inter` for Inter. Display headings keep the Barlow font.",
    html: `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fontsource-variable/inter/index.css">

<html data-ok-font="inter">
  …
</html>`,
    react: `import "@fontsource-variable/inter";
import { applyThemeSettings } from "@owlky/react";

applyThemeSettings({ font: "inter" });`,
  },
  {
    id: "size",
    title: "Change the text size",
    body: `Every size in Owlky is in \`rem\`, so the root font size scales the whole interface: text, spacing and components. Set it on the \`<html>\` element, between ${fontSizeRange.min}px and ${fontSizeRange.max}px.`,
    html: `<html style="font-size: 18px">
  …
</html>`,
    react: `import { applyThemeSettings } from "@owlky/react";

applyThemeSettings({ fontSize: 18 });`,
  },
  {
    id: "code",
    title: "Save the user's choice",
    body: `\`applyThemeSettings()\` sets any of the four settings and returns the result. Settings you leave out keep their current value, and invalid values fall back to the default.

To remember the choice, pass a storage such as \`localStorage\`. On the next visit, read it back with \`readThemeSettings()\` and apply it. Call \`resetThemeSettings()\` to go back to the defaults.`,
    html: `<script type="module">
  import { applyThemeSettings, readThemeSettings } from "@owlky/html";

  // On page load: restore the saved settings
  applyThemeSettings(readThemeSettings({ storage: localStorage }));

  // In a settings menu: change and save
  applyThemeSettings({ mode: "dark", preset: "blue" }, { storage: localStorage });
</script>`,
    react: `import { applyThemeSettings, readThemeSettings } from "@owlky/react";
import { useEffect } from "react";

export function useSavedThemeSettings() {
  useEffect(() => {
    applyThemeSettings(readThemeSettings({ storage: localStorage }));
  }, []);
}

// In a settings menu: change and save
applyThemeSettings({ mode: "dark", preset: "blue" }, { storage: localStorage });`,
  },
  {
    id: "scope",
    title: "Apply settings to part of a page",
    body: "The attributes work on any element, not only `<html>`, and they nest. Use this to preview a theme inside a settings panel, or to give one section of a page its own look. With `applyThemeSettings()`, pass the element as the `target` option.",
    html: `<section data-ok-theme="dark" data-ok-preset="orange" data-ok-font="dm-sans">
  <!-- This section uses its own settings -->
</section>`,
    react: `export function ThemePreview({ children }) {
  return (
    <section data-ok-theme="dark" data-ok-preset="orange" data-ok-font="dm-sans">
      {children}
    </section>
  );
}`,
  },
  {
    id: "accessibility",
    title: "Accessibility",
    body: `- Offer the \`system\` mode, so people who set a dark theme in their operating system get it automatically.
- Larger text sizes help people with low vision. Because everything is in \`rem\`, the browser's own font size setting works too.
- Every preset keeps neutral text at WCAG 2.2 AA contrast. Colored text uses each preset's accessible \`text\` tone.
- Save the user's choice, so they don't have to set it again on every visit.`,
  },
];

function PresetsPreview() {
  return (
    <Preview>
      {primaryPresetNames.map((preset) => (
        <span key={preset} data-ok-preset={preset} className="flex items-center gap-2">
          <Button variant="contained" color="primary" size="sm">
            {capitalize(preset)}
          </Button>
        </span>
      ))}
    </Preview>
  );
}

function FontsPreview() {
  return (
    <Preview className="flex-col items-start! gap-2!">
      {fontFamilyPresetNames.map((font) => (
        <p
          key={font}
          data-ok-font={font}
          className="m-0"
          style={{ fontFamily: "var(--ok-font-family)" }}
        >
          <Caption>{fontLabel(font)}:</Caption> The quick brown fox jumps over the lazy dog
        </p>
      ))}
    </Preview>
  );
}

function SizePreview() {
  return (
    <Preview className="items-end! gap-8!">
      {[fontSizeRange.min, fontSizeRange.default, fontSizeRange.max].map((size) => (
        <span key={size} className="flex flex-col items-start gap-2">
          <span style={{ fontSize: `calc(${size} / 16 * 1rem)` }}>Aa</span>
          <Caption>{size}px</Caption>
        </span>
      ))}
    </Preview>
  );
}

function ScopePreview() {
  return (
    <Preview className="items-stretch!">
      <section
        data-ok-theme="dark"
        data-ok-preset="orange"
        data-ok-font="dm-sans"
        className="flex min-w-[14rem] flex-1 flex-col items-start gap-3 rounded-2xl p-6"
        style={{
          backgroundColor: "var(--ok-bg-default)",
          color: "var(--ok-text-primary)",
          fontFamily: "var(--ok-font-family)",
        }}
      >
        <span className="flex items-center gap-2">
          <Dot color={primaryPresets.orange.main} size={12} />
          Dark, orange, DM Sans
        </span>
        <Button variant="contained" color="primary">
          Primary action
        </Button>
      </section>
    </Preview>
  );
}

const PREVIEWS = {
  presets: PresetsPreview,
  fonts: FontsPreview,
  size: SizePreview,
  scope: ScopePreview,
};

/** Settings docs page. */
export function SettingsDocs() {
  return <GuideDocs sections={settingsSections} previews={PREVIEWS} />;
}
