import type { Meta, StoryObj } from "@storybook/react-vite";
import { ColumnDemo, SpacingDemo } from "./grid.js";
import { GridDocs } from "./grid-docs.js";

const meta = {
  title: "Foundations/Grid",
  tags: ["autodocs"],
  parameters: {
    docs: {
      page: GridDocs,
      canvas: { sourceState: "none" },
      description: {
        component:
          "Spacing, breakpoints and columns. Every space is a multiple of one unit, and layouts use a 12-column grid, in both HTML and React.",
      },
    },
  },
} satisfies Meta;

export default meta;

/** Gap between items: step × 8px. */
export const Spacing: StoryObj<typeof SpacingDemo> = {
  args: { spacing: 2 },
  argTypes: {
    spacing: {
      control: {
        type: "inline-radio",
        labels: { 0: "0px", 1: "8px", 2: "16px", 3: "24px", 4: "32px", 5: "40px" },
      },
      options: [0, 1, 2, 3, 4, 5],
    },
  },
  render: (args) => <SpacingDemo {...args} />,
};

/** Twelve items in 1, 2, 3, 4, 6 or 12 equal columns. */
export const Column: StoryObj<typeof ColumnDemo> = {
  args: { columns: 4 },
  argTypes: {
    columns: { control: "inline-radio", options: [1, 2, 3, 4, 6, 12] },
  },
  render: (args) => <ColumnDemo {...args} />,
};
