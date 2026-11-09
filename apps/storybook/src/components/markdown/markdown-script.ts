import { markdownOptions } from "@owlky/core";
import { createMarkdown, getRuntime } from "@owlky/html";
import { common, createLowlight } from "lowlight";

/** Options that change every Markdown example at once (Controls, ADR-0015). */
export const MARKDOWN_CONTROLS = { schema: markdownOptions, keys: ["gfm", "skipHtml"] } as const;

// Syntax highlighting: lowlight with highlight.js's common languages. Shared by every story that
// renders Markdown in HTML (the first registration of a name wins).
export const markdownDefinition = createMarkdown({ highlighter: createLowlight(common) });

/** HTML: registers Markdown with a highlighter and renders the row's snippet. */
export function markdownScript(row: HTMLElement) {
  getRuntime().register(markdownDefinition).init(row);
  return undefined;
}

export const MARKDOWN_SCRIPT_SOURCE = `import { createMarkdown, getRuntime } from "@owlky/html";
import { common, createLowlight } from "lowlight";

// Markdown with syntax highlighting (or import "@owlky/html/markdown" without it).
getRuntime().register(createMarkdown({ highlighter: createLowlight(common) })).start();`;
