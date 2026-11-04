import { Switch } from "@minimal-tailwind/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Row } from "../../helpers/row.js";

const meta = {
  title: "React/Switch",
  component: Switch,
  tags: ["autodocs"],
  args: { label: "Email notifications", color: "primary", size: "md" },
  argTypes: {
    color: {
      control: "select",
      options: ["primary", "secondary", "info", "success", "warning", "error"],
    },
    size: { control: "inline-radio", options: ["sm", "md"] },
  },
  parameters: {
    docs: {
      description: {
        component:
          'A native `<input type="checkbox" role="switch">`: forms, keyboard (Space) and focus work natively, controlled or uncontrolled. Spec: `specs/components/switch.md`.',
      },
    },
  },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Basic: Story = {
  render: () => (
    <Row>
      <Switch label="Email notifications" name="notifications" defaultChecked />
    </Row>
  ),
};

export const Colors: Story = {
  render: () => (
    <Row>
      {(["primary", "secondary", "success", "error"] as const).map((color) => (
        <Switch
          key={color}
          color={color}
          label={color[0]?.toUpperCase() + color.slice(1)}
          defaultChecked
        />
      ))}
    </Row>
  ),
};

export const Sizes: Story = {
  render: () => (
    <Row>
      <Switch size="sm" label="Small" defaultChecked />
      <Switch size="md" label="Medium" defaultChecked />
    </Row>
  ),
};

export const States: Story = {
  render: () => (
    <Row>
      <Switch label="Disabled off" disabled />
      <Switch label="Disabled on" disabled defaultChecked />
      <Switch aria-label="Airplane mode" />
    </Row>
  ),
};

export const Controlled: Story = {
  render: function Controlled() {
    const [checked, setChecked] = useState(false);
    return (
      <Row>
        <Switch label="Dark mode" checked={checked} onCheckedChange={setChecked} />
        <output className="text-body2 text-text-secondary">{checked ? "On" : "Off"}</output>
      </Row>
    );
  },
};
