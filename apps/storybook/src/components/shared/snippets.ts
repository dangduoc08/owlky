import type { StoryObj } from "@storybook/react-vite";
import { type HtmlGroup, htmlGroupsStory, type StoryControls } from "../../helpers/groups.js";

/** Group title ↔ snippet file suffix, in story order. */
export type GroupFiles = readonly (readonly [title: string, file: string])[];

const CDN = "https://cdn.jsdelivr.net/npm/@owlky/html@0/dist";

/**
 * What a page needs before pasting the snippets, shown at the top of every HTML story's code.
 * `css`: the component stylesheets for à-la-carte loading; `runtime`: needs the JS runtime.
 */
export function htmlSetup(css: string[], runtime = false): string {
  // icon.css: the stroke of component icons (`--ok-icon-stroke`), shared by every component.
  const sheets = css.includes("icon.css") ? css : ["icon.css", ...css];
  const files = ["tokens.css", ...sheets.map((file) => `components/${file}`)].join(" + ");
  const lines = [
    "<!-- Once per page (CDN): -->",
    `<link rel="stylesheet" href="${CDN}/owlky.css">`,
  ];
  if (runtime) lines.push(`<script src="${CDN}/owlky.js" defer></script>`);
  lines.push(
    `<!-- npm: import "@owlky/styles/owlky.css" (or ${files} from @owlky/styles)${
      runtime ? ' and import "@owlky/html/auto"' : "; no JavaScript needed"
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
  /** Page scripts per file suffix (data loaded with JavaScript). */
  scripts: Record<string, Pick<HtmlGroup, "script" | "scriptSource">> = {},
): StoryObj {
  return htmlGroupsStory(
    groups.map(([title, file]) => {
      const entry = Object.entries(snippets).find(([path]) =>
        path.endsWith(`/${story}-${file}.html`),
      );
      if (!entry) throw new Error(`Missing snippet ${story}-${file}.html`);
      return { title, html: entry[1], ...scripts[file] };
    }),
    setup,
    controls,
  );
}
