import { typographyVariants } from "@minimal-tailwind/tokens";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { UsageDocs } from "../../helpers/docs-pages.js";
import { TextColors, TypographySample } from "./typography.js";

const meta = {
  title: "Foundations/Typography",
  component: TypographySample,
  tags: ["autodocs"],
  parameters: {
    docs: {
      page: UsageDocs,
      canvas: { sourceState: "none" },
      description: {
        component:
          "Typography tokens from `@minimal-tailwind/tokens` as `--mt-typography-<variant>-font-family|font-size|font-weight|line-height|text-transform` CSS variables, and Tailwind `text-<variant>` utilities. Font sizes of h1–h6 grow at 600 / 900 / 1200px; h1–h3 use the display font (Barlow).",
      },
    },
  },
  argTypes: {
    variant: { control: "select", options: typographyVariants },
  },
} satisfies Meta<typeof TypographySample>;

export default meta;
type Story = StoryObj<typeof meta>;

export const H1: Story = { name: "H1", args: { variant: "h1" } };
export const H2: Story = { name: "H2", args: { variant: "h2" } };
export const H3: Story = { name: "H3", args: { variant: "h3" } };
export const H4: Story = { name: "H4", args: { variant: "h4" } };
export const H5: Story = { name: "H5", args: { variant: "h5" } };
export const H6: Story = { name: "H6", args: { variant: "h6" } };
export const Subtitle1: Story = { name: "Subtitle1", args: { variant: "subtitle1" } };
export const Subtitle2: Story = { name: "Subtitle2", args: { variant: "subtitle2" } };
export const Body1: Story = { name: "Body1", args: { variant: "body1" } };
export const Body2: Story = { name: "Body2", args: { variant: "body2" } };
export const Caption: Story = { args: { variant: "caption" } };
export const Overline: Story = { args: { variant: "overline" } };
export const Button: Story = { args: { variant: "button" } };

export const Colors: Story = {
  name: "Text colors",
  args: { variant: "body2" },
  argTypes: { variant: { table: { disable: true } }, text: { table: { disable: true } } },
  render: () => <TextColors />,
};
