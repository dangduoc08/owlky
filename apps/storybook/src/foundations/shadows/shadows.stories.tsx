import type { Meta, StoryObj } from "@storybook/react-vite";
import { ColorShadows, CustomShadows, SystemShadows } from "./shadows.js";
import { ShadowsDocs } from "./shadows-docs.js";

const meta = {
  title: "Foundations/Shadows",
  tags: ["autodocs"],
  parameters: {
    docs: {
      page: ShadowsDocs,
      canvas: { sourceState: "none" },
      description: {
        component:
          "Shadows show how far a surface sits above the page. Apply them with CSS variables or Tailwind CSS utilities, in both HTML and React. They adapt to light and dark mode.",
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
