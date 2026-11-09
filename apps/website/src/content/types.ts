import type { KeyboardRow, PropRow } from "@owlky/docs-content/guide/tables-data";
import type { GuideSection } from "@owlky/docs-content/guide/text";

/*
 * Website page content as data: the pages render it, and scripts/postbuild.mjs writes the same
 * data as Markdown (`llms.txt`, `llms-full.txt`, one `.md` per page, ADR-0046). Content files
 * import only types and `@owlky/docs-content` data modules, so Node can load them.
 */

export type CodeLanguage = "html" | "tsx" | "ts" | "css" | "bash";

/** A code block of a website-only page (Get started), with its file or tool as a label. */
export interface CodeSample {
  label: string;
  language: CodeLanguage;
  code: string;
}

/** A section of a website-only page: prose and code blocks, no HTML | React tabs. */
export interface PageSection {
  id: string;
  title: string;
  /** Markdown. */
  body: string;
  code?: readonly CodeSample[];
}

export type PageGroup = "Overview" | "Foundations" | "Components";

export interface SitePage {
  /** URL path with a trailing slash (`trailingSlash: true`). */
  path: string;
  /** Path of the page's Markdown copy. */
  markdown: string;
  title: string;
  /** One sentence, shown under the title and in search results. */
  description: string;
  group: PageGroup;
  /** Website-only content. */
  sections?: readonly PageSection[];
  /** A docs-content guide (HTML | React tabs, live previews). */
  guide?: {
    sections: readonly GuideSection[];
    /** The component in the MCP manifest whose option schemas fill the Options table. */
    component?: string;
    /** Rows of the "Content and behavior" (`props`) and Keyboard tables, for the Markdown copy. */
    props?: readonly PropRow[];
    keyboard?: readonly KeyboardRow[];
  };
}
