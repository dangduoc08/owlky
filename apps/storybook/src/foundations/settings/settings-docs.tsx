import { Button, Label, Popover, Typography } from "@owlky/react";
import {
  fontFamilyPresetNames,
  fontSizeRange,
  primaryPresetNames,
  primaryPresets,
} from "@owlky/tokens";
import { useState } from "react";
import {
  Caption,
  capitalize,
  codeList,
  Dot,
  GuideDocs,
  type GuideSection,
  Preview,
} from "../../helpers/guide.js";
import {
  STYLED_KEYFRAMES_CSS,
  STYLED_STATES_CSS,
  STYLED_TAILWIND,
  STYLED_UPGRADE,
} from "./styled.js";

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
  <body>
    <h1 data-ok-typography data-ok-variant="h3">Monthly report</h1>
    <button type="button" data-ok-button data-ok-variant="contained" data-ok-color="primary" data-ok-size="md"><span data-ok-button-label>Export</span></button>
  </body>
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
  <body>
    <h1 data-ok-typography data-ok-variant="h3">Monthly report</h1>
    <button type="button" data-ok-button data-ok-variant="contained" data-ok-color="primary" data-ok-size="md"><span data-ok-button-label>Export</span></button>
  </body>
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
  <body>
    <h1 data-ok-typography data-ok-variant="h3">Monthly report</h1>
    <button type="button" data-ok-button data-ok-variant="contained" data-ok-color="primary" data-ok-size="md"><span data-ok-button-label>Export</span></button>
  </body>
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
    react: `import type { ReactNode } from "react";

export function ThemePreview({ children }: { children: ReactNode }) {
  return (
    <section data-ok-theme="dark" data-ok-preset="orange" data-ok-font="dm-sans">
      {children}
    </section>
  );
}`,
  },
  {
    id: "style",
    title: "Style components",
    body: `Owlky's component styles live in a cascade layer, \`@layer components\`, and their selectors have zero specificity. Any rule that you write outside a layer wins over them, whatever its selector, so you never need \`!important\`. Add a class to one component, or select a root attribute, such as \`[data-ok-button]\`, to restyle every instance.

Read the tokens (the \`--ok-*\` variables) in your rules instead of fixed values. Your styles then follow the theme, the preset and dark mode, like the components do. In React, pass the same declarations through the \`style\` prop, or a class through \`className\`.`,
    html: `<style>
  .upgrade-button {
    padding-inline: calc(var(--ok-spacing) * 6);
    border-radius: var(--ok-radius-full);
    box-shadow: var(--ok-shadow-primary);
  }
</style>

<button type="button" class="upgrade-button" data-ok-button data-ok-variant="contained" data-ok-color="primary" data-ok-size="md"><span data-ok-button-label>Upgrade</span></button>`,
    react: `import { Button } from "@owlky/react";

const upgrade = {
  paddingInline: "calc(var(--ok-spacing) * 6)",
  borderRadius: "var(--ok-radius-full)",
  boxShadow: "var(--ok-shadow-primary)",
};

export function UpgradeButton() {
  return (
    <Button variant="contained" color="primary" style={upgrade}>
      Upgrade
    </Button>
  );
}`,
  },
  {
    id: "states",
    title: "Style states",
    body: `Components show their state in attributes and native states, so your selectors can follow it:

- **Open:** overlays, such as Popover, Menu and Tooltip, carry \`data-ok-open\` while they show. Their triggers carry \`aria-expanded="true"\`.
- **Focus:** \`:focus-visible\` matches focus from the keyboard, not from a pointer press.
- **Disabled:** native controls match \`:disabled\`. Other parts carry \`aria-disabled="true"\`.
- **Options:** every option is an attribute, such as \`[data-ok-variant="outlined"]\` or \`[data-ok-size="sm"]\`.

The API reference at the end of each component's page lists its states. React needs no extra code: the component renders the same attributes, so the same CSS applies.`,
    html: `<style>
${STYLED_STATES_CSS}</style>

<button type="button" class="summary-button" data-ok-button data-ok-variant="contained" data-ok-color="primary" data-ok-size="md"
  aria-haspopup="dialog" aria-expanded="false" aria-controls="summary" data-ok-popover-open="summary">
  <span data-ok-button-label>Show summary</span>
</button>
<button type="button" class="summary-button" data-ok-button data-ok-variant="contained" data-ok-color="primary" data-ok-size="md" disabled>
  <span data-ok-button-label>Archive</span>
</button>
<div id="summary" class="summary" popover="manual" data-ok-popover data-ok-paper data-ok-placement="bottom" role="dialog" aria-label="Summary">
  <p data-ok-typography data-ok-variant="body2">3 orders are waiting for shipping.</p>
</div>`,
    react: `import { Button, Popover, Typography } from "@owlky/react";
import { useState } from "react";

const css = \`
${STYLED_STATES_CSS}\`;

export function Summary() {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  return (
    <>
      <style>{css}</style>
      <Button
        className="summary-button"
        variant="contained"
        color="primary"
        aria-haspopup="dialog"
        aria-expanded={anchor !== null}
        onClick={(event) => setAnchor(anchor ? null : event.currentTarget)}
      >
        Show summary
      </Button>
      <Button className="summary-button" variant="contained" color="primary" disabled>
        Archive
      </Button>
      <Popover
        className="summary"
        role="dialog"
        aria-label="Summary"
        open={anchor !== null}
        anchorEl={anchor}
        onOpenChange={() => setAnchor(null)}
      >
        <Typography variant="body2">3 orders are waiting for shipping.</Typography>
      </Popover>
    </>
  );
}`,
  },
  {
    id: "keyframes",
    title: "Animate with keyframes",
    body: `Write \`@keyframes\` in your CSS and time them with the motion tokens: \`--ok-duration-*\` for lengths, such as \`--ok-duration-enter\`, and \`--ok-easing-*\` for curves, such as \`--ok-easing-decelerate\`. Colors in keyframes can read tokens too, so the animation follows the theme and the preset.

Turn the animation off when the user asks for reduced motion, and don't loop it forever: an animation that runs longer than 5 seconds needs a way to pause it. For entrances, exits and scroll effects, use the Motion component instead.`,
    html: `<style>
${STYLED_KEYFRAMES_CSS}</style>

<span class="new-label" data-ok-label data-ok-variant="soft" data-ok-color="primary">New</span>`,
    react: `import { Label } from "@owlky/react";

const css = \`
${STYLED_KEYFRAMES_CSS}\`;

export function NewLabel() {
  return (
    <>
      <style>{css}</style>
      <Label className="new-label" variant="soft" color="primary">
        New
      </Label>
    </>
  );
}`,
  },
  {
    id: "style-tailwind",
    title: "Style components with Tailwind CSS",
    body: `With Tailwind CSS v4 and the Owlky theme, utility classes read the same tokens, such as \`shadow-z8\` or \`bg-primary-dark\`. Tailwind's utilities layer comes after the components layer, so a utility always wins over a component style.

Tailwind's variants follow the same states: \`focus-visible:\`, \`disabled:\`, \`aria-expanded:\` and \`data-ok-open:\` for the \`data-ok-open\` attribute.`,
    html: `/* In your main CSS file */
@import "tailwindcss";
@import "@owlky/styles/owlky.css";
@import "@owlky/styles/theme.css";

<!-- In your HTML -->
<button type="button" class="${STYLED_TAILWIND}" data-ok-button data-ok-variant="contained" data-ok-color="primary" data-ok-size="md"><span data-ok-button-label>Upgrade</span></button>`,
    react: `// Set up Tailwind once, in your main CSS file:
//   @import "tailwindcss";
//   @import "@owlky/styles/owlky.css";
//   @import "@owlky/styles/theme.css";
import { Button } from "@owlky/react";

export function UpgradeButton() {
  return (
    <Button
      className="${STYLED_TAILWIND}"
      variant="contained"
      color="primary"
    >
      Upgrade
    </Button>
  );
}`,
  },
  {
    id: "accessibility",
    title: "Accessibility",
    body: `- Offer the \`system\` mode, so people who set a dark theme in their operating system get it automatically.
- Larger text sizes help people with low vision. Because everything is in \`rem\`, the browser's own font size setting works too.
- Every preset keeps neutral text at WCAG 2.2 AA contrast. Colored text uses each preset's accessible \`text\` tone.
- Save the user's choice, so they don't have to set it again on every visit.
- When you restyle a component, keep a visible focus indicator and a contrast ratio of at least 4.5:1 for text. Read the text tones, such as \`--ok-text-primary\` and \`--ok-palette-<color>-text\`, which meet it in every theme and preset.
- Keep your animations short, and turn them off with \`prefers-reduced-motion: reduce\`.`,
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

function StylePreview() {
  return (
    <Preview>
      <Button variant="contained" color="primary" style={STYLED_UPGRADE}>
        Upgrade
      </Button>
    </Preview>
  );
}

function StatesPreview() {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  return (
    <Preview>
      <style>{STYLED_STATES_CSS}</style>
      <Button
        className="summary-button"
        variant="contained"
        color="primary"
        aria-haspopup="dialog"
        aria-expanded={anchor !== null}
        onClick={(event) => setAnchor(anchor ? null : event.currentTarget)}
      >
        Show summary
      </Button>
      <Button className="summary-button" variant="contained" color="primary" disabled>
        Archive
      </Button>
      <Popover
        className="summary"
        role="dialog"
        aria-label="Summary"
        open={anchor !== null}
        anchorEl={anchor}
        onOpenChange={() => setAnchor(null)}
      >
        <Typography variant="body2">3 orders are waiting for shipping.</Typography>
      </Popover>
    </Preview>
  );
}

function KeyframesPreview() {
  return (
    <Preview>
      <style>{STYLED_KEYFRAMES_CSS}</style>
      <Label className="new-label" variant="soft" color="primary">
        New
      </Label>
    </Preview>
  );
}

function TailwindStylePreview() {
  return (
    <Preview>
      <Button className={STYLED_TAILWIND} variant="contained" color="primary">
        Upgrade
      </Button>
    </Preview>
  );
}

const PREVIEWS = {
  presets: PresetsPreview,
  fonts: FontsPreview,
  size: SizePreview,
  scope: ScopePreview,
  style: StylePreview,
  states: StatesPreview,
  keyframes: KeyframesPreview,
  "style-tailwind": TailwindStylePreview,
};

/** Settings docs page. */
export function SettingsDocs() {
  return <GuideDocs sections={settingsSections} previews={PREVIEWS} />;
}
