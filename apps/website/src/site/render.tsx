import type { GuideSection } from "@owlky/docs-content/guide/text";
import { Markdown } from "@owlky/react";
import type { ReactNode } from "react";
import { hasSandbox, sandboxUrl } from "../content/sandbox.js";
import type { SitePage } from "../content/types.js";
import { codeKey } from "./code-key.js";
import type { RenderedGuide } from "./guide-host.js";
import { HighlightedCode } from "./highlight.js";

/* Build-time rendering of a page's prose and code (server components only). */

/** Section prose: Owlky's Markdown component, rendered on the server. */
export const Prose = ({ children }: { children: string }) => (
  <Markdown data-site-prose="">{children}</Markdown>
);

/** The website's body of a section (some sections describe Storybook's own UI). */
export const websiteBody = (section: GuideSection) => section.bodyByHost?.website ?? section.body;

/** Everything the guide host looks up for a docs-content guide. */
export function renderGuide(page: SitePage): RenderedGuide {
  const prose: Record<string, ReactNode> = {};
  const code: Record<string, ReactNode> = {};
  const sandboxes: Record<string, string> = {};
  for (const section of page.guide?.sections ?? []) {
    prose[section.id] = <Prose>{websiteBody(section)}</Prose>;
    for (const [language, text, name] of [
      ["html", section.html, "HTML"],
      ["tsx", section.react, "React"],
    ] as const) {
      if (text === undefined) continue;
      code[codeKey(language, text)] = (
        <HighlightedCode code={text} language={language} label={`${section.title}: ${name}`} />
      );
    }
    if (hasSandbox(section)) sandboxes[section.id] = sandboxUrl(page, section);
  }
  return { prose, code, sandboxes };
}
