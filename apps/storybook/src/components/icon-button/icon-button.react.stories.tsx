import { IconButton } from "@minimal-tailwind/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Groups } from "../../helpers/groups.js";
import { MailIcon } from "../button/button-examples.js";
import { iconButtonStories } from "./icon-button-examples.js";

const meta = {
  title: "React/Icon button",
  component: IconButton,
  tags: ["autodocs"],
  args: { "aria-label": "Mail", color: "primary", size: "md", children: <MailIcon /> },
  argTypes: {
    color: {
      control: "select",
      options: [
        "default",
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
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    children: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Round native `<button type="button">` holding a decorative icon; name it with `aria-label`. Spec: `specs/components/icon-button.md`. Same markup as **HTML/Icon button**.',
      },
    },
  },
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Try every option in the Controls panel. */
export const Playground: Story = {};

export const Base: Story = { render: () => <Groups groups={iconButtonStories["base"] ?? []} /> };
export const Colors: Story = {
  render: () => <Groups groups={iconButtonStories["colors"] ?? []} />,
};
export const Sizes: Story = { render: () => <Groups groups={iconButtonStories["sizes"] ?? []} /> };
export const WithAnimate: Story = {
  name: "With animate",
  render: () => <Groups groups={iconButtonStories["animate"] ?? []} />,
};
