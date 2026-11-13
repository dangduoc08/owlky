import type { Meta, StoryObj } from "@storybook/react-vite";
import { AllStyles, StyleAxes } from "./style-samples.js";
import { StylesDocs } from "./styles-docs.js";

const meta = {
  title: "Foundations/Styles",
  tags: ["autodocs"],
  parameters: {
    docs: {
      page: StylesDocs,
      canvas: { sourceState: "none" },
      description: {
        component:
          "A style sets the palette, fonts, shapes, lines, shadows and label case of every component at once. Choose one of nine styles, load its stylesheet in HTML or with a bundler, combine it with density, surface and contrast, and build it with your brand colors.",
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** The same sample in each of the nine styles. */
export const Styles: Story = { name: "All styles", render: () => <AllStyles /> };

/** One style with compact density, the contrast surface and high contrast. */
export const Axes: Story = { name: "Density, surface and contrast", render: () => <StyleAxes /> };
