import { Button } from "@minimal-tailwind/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Groups } from "../../helpers/groups.js";
import { buttonGroups, MailIcon } from "./button-examples.js";

const meta = {
  title: "React/Button",
  component: Button,
  tags: ["autodocs"],
  args: { children: "Button", variant: "contained", color: "primary", size: "md" },
  argTypes: {
    variant: { control: "inline-radio", options: ["contained", "outlined", "text", "soft"] },
    color: {
      control: "select",
      options: [
        "inherit",
        "primary",
        "secondary",
        "info",
        "success",
        "warning",
        "error",
        "black",
        "white",
      ],
    },
    size: { control: "inline-radio", options: ["sm", "md", "lg", "xl"] },
    loadingPosition: { control: "inline-radio", options: ["center", "start", "end"] },
    startIcon: { control: false },
    endIcon: { control: false },
    loadingIndicator: { control: "text" },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Native `<button type="button">` (or `<a>` with `href`). Variants contained / outlined / text / soft, nine colors, four sizes, icons and a loading state (`disabled` + `aria-busy`). Spec: `specs/components/button.md`. Same markup as **HTML/Button**.',
      },
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Try every option in the Controls panel. */
export const Playground: Story = {
  args: { startIcon: <MailIcon /> },
};

export const Contained: Story = { render: () => <Groups groups={buttonGroups("contained")} /> };
export const Outlined: Story = { render: () => <Groups groups={buttonGroups("outlined")} /> };
export const Text: Story = { render: () => <Groups groups={buttonGroups("text")} /> };
export const Soft: Story = { render: () => <Groups groups={buttonGroups("soft")} /> };
