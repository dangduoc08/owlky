import { Fab } from "@minimal-tailwind/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Groups } from "../../helpers/groups.js";
import { MailIcon } from "../button/button-examples.js";
import { animateGroups, fabGroups } from "./fab-examples.js";

const meta = {
  title: "React/Fab",
  component: Fab,
  tags: ["autodocs"],
  args: {
    variant: "contained",
    color: "primary",
    size: "md",
    extended: true,
    children: (
      <>
        <MailIcon />
        Navigate
      </>
    ),
  },
  argTypes: {
    variant: { control: "inline-radio", options: ["contained", "outlined", "soft"] },
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
          "Floating action button: round (name it with `aria-label`) or `extended` with a label. Variants contained / outlined / soft, ten colors, three sizes. Spec: `specs/components/fab.md`. Same markup as **HTML/Fab**.",
      },
    },
  },
} satisfies Meta<typeof Fab>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Try every option in the Controls panel. */
export const Playground: Story = {};

export const Default: Story = { render: () => <Groups groups={fabGroups("contained")} /> };
export const Outlined: Story = { render: () => <Groups groups={fabGroups("outlined")} /> };
export const Soft: Story = { render: () => <Groups groups={fabGroups("soft")} /> };
export const WithAnimate: Story = {
  name: "With animate",
  render: () => <Groups groups={animateGroups} />,
};
