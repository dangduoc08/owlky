import type { Meta, StoryObj } from "@storybook/react-vite";
import { Palette } from "./palette.js";

const meta = {
  title: "Foundations/Colors",
  component: Palette,
  tags: ["autodocs"],
  parameters: {
    docs: {
      canvas: { sourceState: "none" },
      description: {
        component:
          "Palette tokens from `@minimal-tailwind/tokens`, available as `--mt-palette-<color>-<shade>` CSS variables and Tailwind colors (`bg-primary`, `text-primary-dark`, `bg-grey-200`…). Click a swatch to copy its hex value.",
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
