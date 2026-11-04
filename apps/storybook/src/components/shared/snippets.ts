import type { StoryObj } from "@storybook/react-vite";
import { htmlGroupsStory, type StoryControls } from "../../helpers/groups.js";

/** Group title ↔ snippet file suffix, in story order. */
export type GroupFiles = readonly (readonly [title: string, file: string])[];

const CDN = "https://cdn.jsdelivr.net/npm/@minimal-tailwind/html@0/dist";

/**
 * What a page needs before pasting the snippets, shown at the top of every HTML story's code.
 * `css`: the component stylesheets for à-la-carte loading; `runtime`: needs the JS runtime.
 */
export function htmlSetup(css: string[], runtime = false): string {
  const files = ["tokens.css", ...css.map((file) => `components/${file}`)].join(" + ");
  const lines = [
    "<!-- Once per page (CDN): -->",
    `<link rel="stylesheet" href="${CDN}/minimal-tailwind.css">`,
  ];
  if (runtime) lines.push(`<script src="${CDN}/minimal-tailwind.js" defer></script>`);
  lines.push(
    `<!-- npm: import "@minimal-tailwind/styles/minimal-tailwind.css" (or ${files} from @minimal-tailwind/styles)${
      runtime ? ' and import "@minimal-tailwind/html/auto"' : "; no JavaScript needed"
    }. -->`,
  );
  return lines.join("\n");
}

/**
 * HTML story built from canonical snippets: `<story>-<file>.html` for each group, in order.
 * `snippets` comes from an `import.meta.glob(…, { query: "?raw", eager: true })` of an examples folder.
 */
export function snippetStory(
  snippets: Record<string, string>,
  story: string,
  groups: GroupFiles,
  setup: string,
  controls?: StoryControls,
): StoryObj {
  return htmlGroupsStory(
    groups.map(([title, file]) => {
      const entry = Object.entries(snippets).find(([path]) =>
        path.endsWith(`/${story}-${file}.html`),
      );
      if (!entry) throw new Error(`Missing snippet ${story}-${file}.html`);
      return { title, html: entry[1] };
    }),
    setup,
    controls,
  );
}
