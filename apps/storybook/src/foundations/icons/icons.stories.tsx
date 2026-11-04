import type { Meta, StoryObj } from "@storybook/react-vite";
import { IconColors, IconSets, IconSizes, IconUsage } from "./icon-demos.js";

const meta = {
  title: "Foundations/Icons",
  tags: ["autodocs"],
  parameters: {
    docs: {
      canvas: { sourceState: "none" },
      description: {
        component:
          "The library ships no icon set: components accept any SVG. Icons are sized in px on a 24 × 24 grid and colored with `currentColor`.",
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** Sample icons and recommended open-source sets. */
export const IconSetsStory: Story = { name: "Icon sets", render: () => <IconSets /> };

/** Recommended sizes. */
export const Sizes: Story = { render: () => <IconSizes /> };

/** Icons follow the text color of their container. */
export const Colors: Story = { render: () => <IconColors /> };

/** Accessible SVG markup. */
export const Usage: Story = { render: () => <IconUsage /> };
