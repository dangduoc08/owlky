import type { StoryObj } from "@storybook/react-vite";
import { htmlGroupsStory } from "../../helpers/groups.js";

/** Group title ↔ snippet file suffix, in story order. */
export type GroupFiles = readonly (readonly [title: string, file: string])[];

/**
 * HTML story built from canonical snippets: `<story>-<file>.html` for each group, in order.
 * `snippets` comes from an `import.meta.glob(…, { query: "?raw", eager: true })` of an examples folder.
 */
export function snippetStory(
  snippets: Record<string, string>,
  story: string,
  groups: GroupFiles,
): StoryObj {
  return htmlGroupsStory(
    groups.map(([title, file]) => {
      const entry = Object.entries(snippets).find(([path]) =>
        path.endsWith(`/${story}-${file}.html`),
      );
      if (!entry) throw new Error(`Missing snippet ${story}-${file}.html`);
      return { title, html: entry[1] };
    }),
  );
}
