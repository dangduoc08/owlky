/*
 * Guide data helpers (ADR-0040): plain values only, so server code (the website's pages, the
 * manifest and docs check scripts) can import sections without loading the guide UI.
 * Writing style: AGENTS.md → "Writing documentation".
 */

export interface GuideSection {
  id: string;
  title: string;
  /** Markdown (no GFM tables). */
  body: string;
  html?: string;
  react?: string;
  /** Replaces `body` on a host whose own UI differs (Storybook's sidebar and toolbar). */
  bodyByHost?: { website?: string };
}

/** An implementation shown in the code tabs. */
export type Impl = "html" | "react";

export const CDN = "https://cdn.jsdelivr.net/npm/@owlky/html@0/dist";

export const capitalize = (value: string) => value[0]?.toUpperCase() + value.slice(1);

/** Inline code list for Markdown: `a`, `b` and `c`. */
export const codeList = (values: readonly (string | number)[]) => {
  const items = values.map((v) => `\`${v}\``);
  return items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;
};
