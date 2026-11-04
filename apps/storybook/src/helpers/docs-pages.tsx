import { Description, Subtitle, Title } from "@storybook/addon-docs/blocks";

/*
 * Foundation docs pages answer "how do I use it"; the examples live in the sidebar stories, so
 * the docs never render them again (no Stories block). Components have no docs page: each story's
 * Code panel shows the source with its imports.
 */

/** Foundation docs: what the tokens are and how to use them; each section is a story. */
export function UsageDocs() {
  return (
    <>
      <Title />
      <Subtitle />
      <Description />
    </>
  );
}
