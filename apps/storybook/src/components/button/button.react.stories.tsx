import { Button } from "@minimal-tailwind/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Row } from "../../helpers/row.js";

const PlusIcon = () => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <path d="M12 5v14M5 12h14" />
  </svg>
);
const ArrowIcon = () => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

const meta = {
  title: "React/Button",
  component: Button,
  tags: ["autodocs"],
  args: { children: "Button", variant: "contained", color: "primary", size: "md" },
  argTypes: {
    variant: { control: "inline-radio", options: ["contained", "outlined", "soft", "text"] },
    color: {
      control: "select",
      options: ["inherit", "primary", "secondary", "info", "success", "warning", "error"],
    },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    startIcon: { control: false },
    endIcon: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          "Native `<button>` with Minimal styling. Spec: `specs/components/button.md`. The same anatomy is available without React — see **HTML/Button**.",
      },
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Variants: Story = {
  render: () => (
    <Row>
      {(["contained", "outlined", "soft", "text"] as const).map((variant) => (
        <Button key={variant} variant={variant}>
          {variant[0]?.toUpperCase() + variant.slice(1)}
        </Button>
      ))}
    </Row>
  ),
};

export const Colors: Story = {
  render: () => (
    <Row>
      {(["inherit", "primary", "secondary", "info", "success", "warning", "error"] as const).map(
        (color) => (
          <Button key={color} variant="contained" color={color}>
            {color[0]?.toUpperCase() + color.slice(1)}
          </Button>
        ),
      )}
    </Row>
  ),
};

export const Sizes: Story = {
  render: () => (
    <Row>
      <Button variant="contained" color="primary" size="sm">
        Small
      </Button>
      <Button variant="contained" color="primary" size="md">
        Medium
      </Button>
      <Button variant="contained" color="primary" size="lg">
        Large
      </Button>
    </Row>
  ),
};

export const Icons: Story = {
  render: () => (
    <Row>
      <Button variant="contained" color="primary" startIcon={<PlusIcon />}>
        Add item
      </Button>
      <Button variant="outlined" endIcon={<ArrowIcon />}>
        Next
      </Button>
    </Row>
  ),
};

export const AllVariantsAndColors: Story = {
  name: "Variants × colors",
  render: () => (
    <div className="grid gap-3">
      {(["contained", "outlined", "soft", "text"] as const).map((variant) => (
        <Row key={variant}>
          {(
            ["inherit", "primary", "secondary", "info", "success", "warning", "error"] as const
          ).map((color) => (
            <Button key={color} variant={variant} color={color}>
              {color}
            </Button>
          ))}
          <Button variant={variant} disabled>
            disabled
          </Button>
        </Row>
      ))}
    </div>
  ),
};
