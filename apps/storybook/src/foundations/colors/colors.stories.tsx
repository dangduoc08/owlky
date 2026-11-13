import type { Meta, StoryObj } from "@storybook/react-vite";
import { ColorsDocs } from "./colors-docs.js";
import { Gradients } from "./gradients.js";
import { Palette } from "./palette.js";

const meta = {
  title: "Foundations/Colors",
  component: Palette,
  tags: ["autodocs"],
  parameters: {
    docs: {
      page: ColorsDocs,
      canvas: { sourceState: "none" },
      description: {
        component:
          "Owlky's colors are CSS custom properties. Use them in your own styles, set them on components, or apply them as Tailwind CSS utilities, in both HTML and React.",
      },
    },
  },
  argTypes: {
    palette: {
      control: "select",
      options: ["primary", "secondary", "info", "success", "warning", "error", "grey"],
    },
  },
} satisfies Meta<typeof Palette>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = { args: { palette: "primary" } };
export const Secondary: Story = { args: { palette: "secondary" } };
export const Info: Story = { args: { palette: "info" } };
export const Success: Story = { args: { palette: "success" } };
export const Warning: Story = { args: { palette: "warning" } };
export const ErrorPalette: Story = { name: "Error", args: { palette: "error" } };
export const Grey: Story = { args: { palette: "grey" } };

/** Gradient tokens (`--ok-gradient-*`): text, border, background and paper. Follows the theme. */
export const Gradient: Story = {
  args: { palette: "primary" },
  parameters: { controls: { disable: true } },
  render: () => <Gradients />,
};
