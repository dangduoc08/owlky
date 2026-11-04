import type { Meta, StoryObj } from "@storybook/react-vite";
import { UsageDocs } from "../../helpers/docs-pages.js";
import { FontGallery, PresetGallery } from "./settings.js";

const meta = {
  title: "Foundations/Settings",
  component: PresetGallery,
  tags: ["autodocs"],
  parameters: {
    docs: {
      page: UsageDocs,
      canvas: { sourceState: "none" },
      description: {
        component:
          "Theme settings (ADR-0017), as in the reference's Settings drawer: a primary color preset (`data-ok-preset`), a font family (`data-ok-font`) and the root font size (12–20px; every size is in rem). Put the attributes on `<html>` or on any element (scopes nest, also with `data-ok-theme`), or call `applyThemeSettings({ mode, preset, font, fontSize }, { storage })` from `@owlky/core` (re-exported by `@owlky/react` and `@owlky/html`) — it validates the values and stores them only when you pass a storage. Fonts are not bundled: load them yourself (e.g. `@fontsource-variable/inter`). Try them on every story with the toolbar's Preset, Font and Size.",
      },
    },
  },
} satisfies Meta<typeof PresetGallery>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Presets: Story = {};
export const Fonts: Story = { render: () => <FontGallery /> };
