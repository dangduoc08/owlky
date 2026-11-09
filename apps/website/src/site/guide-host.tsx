"use client";

import {
  type FrameworkStore,
  type GuideHost,
  GuideHostProvider,
} from "@owlky/docs-content/guide/host";
import type { GuideSection, Impl } from "@owlky/docs-content/guide/text";
import { Typography } from "@owlky/react";
import { createContext, type ReactNode, useContext } from "react";
import { codeKey } from "./code-key.js";
import { OpenHtmlDemo } from "./open-html-demo.js";

/*
 * The website's host for the docs-content guides (ADR-0040): prose and code blocks are rendered
 * at build time by the page (Owlky's Markdown, Shiki) and looked up here, so neither the Markdown
 * parser nor the highlighter reaches the browser.
 */

export interface RenderedGuide {
  /** Section id → its Markdown body, rendered. */
  prose: Record<string, ReactNode>;
  /** `codeKey(language, code)` → the highlighted block. */
  code: Record<string, ReactNode>;
  /** Section id → URL of its HTML sandbox page. */
  sandboxes: Record<string, string>;
}

const Rendered = createContext<RenderedGuide>({ prose: {}, code: {}, sandboxes: {} });

function Prose({ section }: { section: GuideSection }) {
  const { prose } = useContext(Rendered);
  return (
    <>
      <Typography variant="h4" component="h2" id={section.id} data-site-heading="">
        {section.title}
      </Typography>
      {prose[section.id] ?? <p>{section.bodyByHost?.website ?? section.body}</p>}
    </>
  );
}

function CodeBlock({ code, language }: { code: string; language: string }) {
  const { code: blocks } = useContext(Rendered);
  return (
    blocks[codeKey(language, code)] ?? (
      <pre data-site-code={language}>
        <code>{code}</code>
      </pre>
    )
  );
}

function SectionActions({ section }: { section: GuideSection }) {
  const url = useContext(Rendered).sandboxes[section.id];
  return url ? <OpenHtmlDemo url={url} title={section.title} /> : null;
}

// The reader's HTML | React choice, kept for every page (per-viewer convenience).
const KEY = "owlky:docs-framework";
const listeners = new Set<() => void>();
const framework: FrameworkStore = {
  get() {
    try {
      return localStorage.getItem(KEY) === "html" ? "html" : "react";
    } catch {
      return "react";
    }
  },
  getServer: () => "react",
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  set(impl: Impl) {
    try {
      localStorage.setItem(KEY, impl);
    } catch {
      // Storage blocked: the choice applies to this page only.
    }
    for (const listener of listeners) listener();
  },
};

const host: GuideHost = {
  Prose,
  CodeBlock,
  PreviewFrame: ({ className, children }) => <div className={className}>{children}</div>,
  SectionActions,
  framework,
  sectionClassName: "mb-14",
};

export function WebsiteGuide({
  rendered,
  children,
}: {
  rendered: RenderedGuide;
  children: ReactNode;
}) {
  return (
    <Rendered.Provider value={rendered}>
      <GuideHostProvider host={host}>{children}</GuideHostProvider>
    </Rendered.Provider>
  );
}
