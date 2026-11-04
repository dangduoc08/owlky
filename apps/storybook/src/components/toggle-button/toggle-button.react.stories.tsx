import { ToggleButton } from "@minimal-tailwind/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Groups } from "../../helpers/groups.js";
import { DemoIcon } from "../shared/demo-icon.js";
import { toggleStories } from "./toggle-button-examples.js";

const meta = {
  title: "React/Toggle button",
  component: ToggleButton,
  tags: ["autodocs"],
  args: {
    color: "primary",
    size: "md",
    defaultSelected: true,
    children: (
      <>
        <DemoIcon name="check" />
        Label
      </>
    ),
  },
  argTypes: {
    color: {
      control: "select",
      options: ["inherit", "primary", "secondary", "info", "success", "warning", "error"],
    },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    children: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          "Native button with `aria-pressed`. Standalone (`selected` / `defaultSelected` / `onChange`) or inside `ToggleButtonGroup` (`exclusive`, `value` / `defaultValue` / `onChange`). Spec: `specs/components/toggle-button.md`. Same markup as **HTML/Toggle button** (which uses the runtime).",
      },
    },
  },
} satisfies Meta<typeof ToggleButton>;

export default meta;
type Story = StoryObj<typeof meta>;

const groups = (name: string) => () => <Groups groups={toggleStories[name] ?? []} />;

/** Try every option in the Controls panel. */
export const Playground: Story = {};

export const Exclusive: Story = { name: "Exclusive selection", render: groups("exclusive") };
export const Multiple: Story = { name: "Multiple selection", render: groups("multiple") };
export const Sizes: Story = { render: groups("sizes") };
export const Disabled: Story = { render: groups("disabled") };
export const Colors: Story = { render: groups("colors") };
export const Vertical: Story = { name: "Vertical & standalone", render: groups("vertical") };
