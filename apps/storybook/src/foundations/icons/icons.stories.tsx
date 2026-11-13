import type { Meta, StoryObj } from "@storybook/react-vite";
import { FlagIcons, IconColors, IconSizes, IconUsage, SolarIcons } from "./icon-demos.js";
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
          "Owlky's components draw Solar icons, and your own icons can be Solar too, or any other SVG. Learn which Solar variant suits each style, how to add icons to components, choose their size and color, and make them accessible, in both HTML and React.",
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** Solar's variants, one row each, with the styles they suit. */
export const Solar: Story = { name: "Solar icons", render: () => <SolarIcons /> };

/** Country flags (Circle Flags), the Phone input's optional image flags. */
export const Flags: Story = { name: "Flag icons", render: () => <FlagIcons /> };

/** Recommended sizes. */
export const Sizes: Story = { render: () => <IconSizes /> };

/** Icons follow the text color of their container. */
export const Colors: Story = { render: () => <IconColors /> };

/** Accessible SVG markup. */
export const Usage: Story = { render: () => <IconUsage /> };
