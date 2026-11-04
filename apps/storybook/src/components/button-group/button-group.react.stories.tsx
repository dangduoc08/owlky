import { Button, ButtonGroup } from "@minimal-tailwind/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Groups } from "../../helpers/groups.js";
import { buttonGroupGroups, orientationGroups, sizeGroups } from "./button-group-examples.js";

const meta = {
  title: "React/Button group",
  component: ButtonGroup,
  tags: ["autodocs"],
  args: {
    variant: "contained",
    color: "primary",
    size: "md",
    orientation: "horizontal",
    "aria-label": "Actions",
    children: ["One", "Two", "Three"].map((label) => <Button key={label}>{label}</Button>),
  },
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
    orientation: { control: "inline-radio", options: ["horizontal", "vertical"] },
    children: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          '`role="group"` that joins Buttons; `variant`, `color`, `size` and `disabled` are passed to every child Button (a child prop wins). Spec: `specs/components/button-group.md`. Same markup as **HTML/Button group**.',
      },
    },
  },
} satisfies Meta<typeof ButtonGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Try every option in the Controls panel. */
export const Playground: Story = {};

export const Contained: Story = {
  render: () => <Groups groups={buttonGroupGroups("contained")} />,
};
export const Outlined: Story = {
  args: {
    orientation: "vertical",
  },

  render: () => <Groups groups={buttonGroupGroups("outlined")} />,
};
export const Text: Story = { render: () => <Groups groups={buttonGroupGroups("text")} /> };
export const Soft: Story = { render: () => <Groups groups={buttonGroupGroups("soft")} /> };
export const Sizes: Story = { render: () => <Groups groups={sizeGroups} /> };
export const Orientation: Story = { render: () => <Groups groups={orientationGroups} /> };
