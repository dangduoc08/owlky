import type { Meta, StoryObj } from "@storybook/react-vite";
import { SettingsDocs } from "./settings-docs.js";
import { Styled as StyledDemo } from "./styled.js";

const meta = {
  title: "Foundations/Settings",
  component: StyledDemo,
  tags: ["autodocs"],
  parameters: {
    docs: {
      page: SettingsDocs,
      canvas: { sourceState: "none" },
      description: {
        component:
          "Let users choose the mode and the text size, use your brand color and font through the tokens, and style components with CSS variables, state selectors, keyframes and Tailwind CSS. Each setting is an attribute you can set in HTML, or apply and save from code in React and HTML.",
      },
    },
  },
} satisfies Meta<typeof StyledDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Style components: the `style` prop and tokens, state selectors, keyframes and Tailwind CSS. */
export const Styled: Story = {};
