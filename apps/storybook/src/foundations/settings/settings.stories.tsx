import type { Meta, StoryObj } from "@storybook/react-vite";
import { FontGallery, PresetGallery } from "./settings.js";
import { SettingsDocs } from "./settings-docs.js";

const meta = {
  title: "Foundations/Settings",
  component: PresetGallery,
  tags: ["autodocs"],
  parameters: {
    docs: {
      page: SettingsDocs,
      canvas: { sourceState: "none" },
      description: {
        component:
          "Let users choose the mode, primary color, font and text size. Each setting is an attribute you can set in HTML, or apply and save from code in React and HTML.",
      },
    },
  },
} satisfies Meta<typeof PresetGallery>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Presets: Story = {};
export const Fonts: Story = { render: () => <FontGallery /> };
