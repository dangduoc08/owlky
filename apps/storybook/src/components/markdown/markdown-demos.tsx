import { Markdown } from "@owlky/react";
import { common, createLowlight } from "lowlight";
import { HTML_CONTENT, MARKDOWN_CONTENT } from "./markdown-content.js";

// Syntax highlighting: lowlight with highlight.js's common languages.
const highlighter = createLowlight(common);

/** HTML written in the Markdown, rendered through the allow list (`rawHtml`). */
export function HtmlContentDemo() {
  return (
    <Markdown rawHtml externalLinks images="image" imageRatio="16/9" highlighter={highlighter}>
      {HTML_CONTENT}
    </Markdown>
  );
}

/** GitHub Flavored Markdown: headings, task lists, a table, code, an image and a quote. */
export function MarkdownContentDemo() {
  return (
    <Markdown externalLinks images="image" imageRatio="16/9" highlighter={highlighter}>
      {MARKDOWN_CONTENT}
    </Markdown>
  );
}
