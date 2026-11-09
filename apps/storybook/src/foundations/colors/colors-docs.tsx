import { ColorsGuide } from "@owlky/docs-content/foundations/colors";
import { Description, Subtitle, Title } from "@storybook/addon-docs/blocks";
import { StorybookGuide } from "../../helpers/guide.js";

/** Colors docs page: the guide comes from `@owlky/docs-content` (ADR-0040); swatches are stories. */
export function ColorsDocs() {
  return (
    <>
      <Title />
      <Subtitle />
      <Description />
      <StorybookGuide>
        <ColorsGuide />
      </StorybookGuide>
    </>
  );
}
