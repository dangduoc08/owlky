import { ButtonGuide } from "@owlky/docs-content/components/button";
import { Description, Subtitle, Title } from "@storybook/addon-docs/blocks";
import { StorybookGuide } from "../../helpers/guide.js";

/** Button docs page (ADR-0019): the guide comes from `@owlky/docs-content` (ADR-0040). */
export function ButtonDocs() {
  return (
    <>
      <Title />
      <Subtitle />
      <Description />
      <StorybookGuide>
        <ButtonGuide />
      </StorybookGuide>
    </>
  );
}
