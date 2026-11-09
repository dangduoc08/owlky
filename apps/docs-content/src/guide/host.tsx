"use client";

import { type ComponentType, createContext, type ReactNode, useContext } from "react";
import type { GuideSection, Impl } from "./text.js";

/*
 * What a host (Storybook, the website) gives the guide UI (ADR-0040): the only per-host code.
 * The guide renders sections, previews, code tabs and tables; the host renders the prose, the
 * highlighted code block and the frame around previews, so this package imports no host.
 */

export type CodeLanguage = "html" | "tsx";

/** A store for the implementation shown first (a toolbar, a saved choice). */
export interface FrameworkStore {
  get(): Impl;
  /** Value during server rendering and hydration. Default: `get`. */
  getServer?: () => Impl;
  subscribe(listener: () => void): () => void;
  /** Called when the reader picks a tab. */
  set?: (impl: Impl) => void;
}

export interface GuideHost {
  /** A section's heading (`section.title`, an `h2`) and its Markdown body. */
  Prose: ComponentType<{ section: GuideSection }>;
  /** A highlighted code block. The guide adds the Copy button over it. */
  CodeBlock: ComponentType<{ code: string; language: CodeLanguage }>;
  /** The frame around a live preview; `className` carries the guide's layout classes. */
  PreviewFrame: ComponentType<{ className: string; children: ReactNode }>;
  /** Extra actions next to a section's code tabs (the website's **Open HTML demo**). */
  SectionActions?: ComponentType<{ section: GuideSection }> | undefined;
  framework?: FrameworkStore | undefined;
  /** Class on each section's wrapper. */
  sectionClassName?: string | undefined;
  /** Class that keeps the host's own content styles off previews and tables. */
  unstyledClassName?: string | undefined;
}

/** Layout of the preview frame. A column never wraps: rows would grow to their longest content. */
export const PREVIEW_FRAME_CLASS =
  "mb-4 flex flex-wrap items-center gap-4 [&.flex-col]:flex-nowrap rounded-xl border border-dashed border-divider bg-paper p-6";

const fixed = (impl: Impl): FrameworkStore => ({ get: () => impl, subscribe: () => () => {} });

export const defaultGuideHost: GuideHost = {
  Prose: ({ section }) => (
    <>
      <h2>{section.title}</h2>
      <p>{section.body}</p>
    </>
  ),
  CodeBlock: ({ code }) => (
    <pre>
      <code>{code}</code>
    </pre>
  ),
  PreviewFrame: ({ className, children }) => <div className={className}>{children}</div>,
  framework: fixed("html"),
};

const GuideHostContext = createContext<GuideHost>(defaultGuideHost);

export function GuideHostProvider({ host, children }: { host: GuideHost; children: ReactNode }) {
  return <GuideHostContext.Provider value={host}>{children}</GuideHostContext.Provider>;
}

export const useGuideHost = () => useContext(GuideHostContext);
