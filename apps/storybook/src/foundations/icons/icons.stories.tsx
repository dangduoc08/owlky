import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  FileIcons,
  FlagIcons,
  IconColors,
  IconifyIcons,
  IconSizes,
  IconUsage,
  LocalIcons,
  MaterialIcons,
  SocialIcons,
} from "./icon-demos.js";
import { IconsDocs } from "./icons-docs.js";

const meta = {
  title: "Foundations/Icons",
  tags: ["autodocs"],
  parameters: {
    docs: {
      page: IconsDocs,
      canvas: { sourceState: "none" },
      description: {
        component:
          "Owlky works with any SVG icon. Learn how to add icons to components, choose their size and color, and make them accessible, in both HTML and React.",
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** Material Symbols (not bundled). */
export const Material: Story = { name: "Material icons", render: () => <MaterialIcons /> };

/** Solar and Eva, from Iconify. */
export const Iconify: Story = { name: "Iconify icons", render: () => <IconifyIcons /> };

/** Stroke icons drawn for these docs. */
export const Local: Story = { name: "Local icons", render: () => <LocalIcons /> };

/** Social brand marks (SVG Logos). */
export const Social: Story = { name: "Social icons", render: () => <SocialIcons /> };

/** File-type icons (VSCode Icons). */
export const Files: Story = { name: "File icons", render: () => <FileIcons /> };

/** Country flags (Circle Flags). */
export const Flags: Story = { name: "Flag icons", render: () => <FlagIcons /> };

/** Recommended sizes. */
export const Sizes: Story = { render: () => <IconSizes /> };

/** Icons follow the text color of their container. */
export const Colors: Story = { render: () => <IconColors /> };

/** Accessible SVG markup. */
export const Usage: Story = { render: () => <IconUsage /> };
