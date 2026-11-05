import { typographyVariants } from "@owlky/tokens";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { TextColors, TypographySample } from "./typography.js";
import { TypographyDocs } from "./typography-docs.js";

const meta = {
  title: "Foundations/Typography",
  component: TypographySample,
  tags: ["autodocs"],
  parameters: {
    docs: {
      page: TypographyDocs,
      canvas: { sourceState: "none" },
      description: {
        component:
          "Owlky's text styles. Apply them with CSS variables or Tailwind CSS utilities, in both HTML and React. Headings scale with the screen width, and every size follows the user's font size.",
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
