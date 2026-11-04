import type { Meta, StoryObj } from "@storybook/react-vite";
import { UsageDocs } from "../../helpers/docs-pages.js";
import { ColorShadows, CustomShadows, SystemShadows } from "./shadows.js";

const meta = {
  title: "Foundations/Shadows",
  tags: ["autodocs"],
  parameters: {
    docs: {
      page: UsageDocs,
      canvas: { sourceState: "none" },
      description: {
        component:
          "Shadow tokens from `@owlky/tokens`, tinted per theme. Use the CSS variables or Tailwind `shadow-elevation-<n>`, `shadow-z<n>`, `shadow-card`, `shadow-dropdown`, `shadow-dialog`, `shadow-dialog-start`.",
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default elevations 1–24: `--ok-elevation-<n>`. */
export const System: Story = { render: () => <SystemShadows /> };

/** Extended shadows used across the components: `--ok-shadow-*`. */
export const Custom: Story = { render: () => <CustomShadows /> };

/** Colored shadows for filled surfaces: `--ok-shadow-<color>`. */
export const Colors: Story = { render: () => <ColorShadows /> };
