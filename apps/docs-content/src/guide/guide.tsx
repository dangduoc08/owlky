"use client";

import {
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { writeClipboard } from "./clipboard.js";
import { type FrameworkStore, PREVIEW_FRAME_CLASS, useGuideHost } from "./host.js";
import type { GuideSection, Impl } from "./text.js";

/*
 * Usage guides (Introduction, Foundations and component docs pages, ADR-0019 / ADR-0040): each
 * section is prose (Markdown, no GFM tables), an optional live preview and one code block with
 * HTML | React tabs. The host (GuideHostProvider) renders the prose, the code block and the
 * preview frame. Writing style: AGENTS.md → "Writing documentation". Every `--ok-*` variable
 * and Tailwind token class in the code is checked against the built CSS
 * (e2e/tests/foundations.spec.ts).
 */

export type { GuideSection, Impl } from "./text.js";

const IMPLS: { id: Impl; label: string }[] = [
  { id: "html", label: "HTML" },
  { id: "react", label: "React" },
];

const COPY_ICONS = {
  idle: [
    "M11 9h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2z",
    "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1",
  ],
  copied: ["M20 6 9 17l-5-5"],
  failed: ["M18 6 6 18", "M6 6l12 12"],
} as const;

const COPY_LABELS = {
  idle: "Copy code",
  copied: "Copied",
  failed: "Couldn't copy: select the code and copy it",
} as const;

/** Icon button over the code block; turns into a green check once the code is on the clipboard. */
export function CopyButton({ code }: { code: string }) {
  const [state, setState] = useState<keyof typeof COPY_ICONS>("idle");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const copy = async () => {
    const copied = await writeClipboard(code.trim());
    setState(copied ? "copied" : "failed");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("idle"), 2000);
  };
  return (
    <>
      <button
        type="button"
        onClick={copy}
        aria-label={COPY_LABELS.idle}
        title={COPY_LABELS[state]}
        data-docs-copy={state}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {COPY_ICONS[state].map((d) => (
            <path key={d} d={d} />
          ))}
        </svg>
      </button>
      <span role="status" className="sr-only">
        {state === "idle" ? "" : COPY_LABELS[state]}
      </span>
    </>
  );
}

/** HTML | React tabs (WAI-ARIA tabs, arrow keys); one choice drives every example on the page. */
function CodeTabs({
  section,
  impl,
  onImpl,
}: {
  section: GuideSection;
  impl: Impl;
  onImpl: (impl: Impl) => void;
}) {
  const { CodeBlock, SectionActions } = useGuideHost();
  const id = useId();
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    const next = impl === "html" ? "react" : "html";
    onImpl(next);
    tabs.current[IMPLS.findIndex((i) => i.id === next)]?.focus();
  };
  const tablist = (
    <div
      role="tablist"
      aria-label={`${section.title} code`}
      className="flex gap-1 border-b border-divider"
    >
      {IMPLS.map((tab, index) => (
        <button
          key={tab.id}
          ref={(el) => {
            tabs.current[index] = el;
          }}
          type="button"
          role="tab"
          id={`${id}-${tab.id}`}
          aria-selected={impl === tab.id}
          aria-controls={`${id}-${tab.id}-panel`}
          tabIndex={impl === tab.id ? 0 : -1}
          onClick={() => onImpl(tab.id)}
          onKeyDown={onKeyDown}
          className={`-mb-px cursor-pointer border-0 border-b-2 border-solid bg-transparent px-3 py-2 font-semibold text-[0.8125rem] ${
            impl === tab.id
              ? "border-text-primary text-text-primary"
              : "border-transparent text-text-secondary hover:text-text-primary"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
  return (
    <div data-docs-code="">
      {SectionActions ? (
        <div className="flex flex-wrap items-end justify-between gap-2 border-b border-divider">
          {tablist}
          <SectionActions section={section} />
        </div>
      ) : (
        tablist
      )}
      {IMPLS.map((tab) => {
        const code = (tab.id === "html" ? section.html : section.react) ?? "";
        return (
          <div
            key={tab.id}
            role="tabpanel"
            id={`${id}-${tab.id}-panel`}
            aria-labelledby={`${id}-${tab.id}`}
            hidden={impl !== tab.id}
          >
            <CodeBlock code={code} language={tab.id === "html" ? "html" : "tsx"} />
            <CopyButton code={code} />
          </div>
        );
      })}
    </div>
  );
}

/** Live preview frame (the host draws it). */
export function Preview({ children, className = "" }: { children: ReactNode; className?: string }) {
  const { PreviewFrame, unstyledClassName } = useGuideHost();
  const classes = [unstyledClassName, PREVIEW_FRAME_CLASS, className].filter(Boolean).join(" ");
  return <PreviewFrame className={classes}>{children}</PreviewFrame>;
}

/** Decorative color dot. */
export const Dot = ({
  color,
  size = 28,
  label,
}: {
  color: string;
  size?: number;
  label?: string;
}) => (
  <span
    title={label}
    aria-hidden="true"
    className="inline-block shrink-0 rounded-full"
    style={{ width: size, height: size, backgroundColor: color }}
  />
);

/** Small secondary label used inside previews. */
export const Caption = ({ children }: { children: ReactNode }) => (
  <span className="text-[0.8125rem] text-text-secondary">{children}</span>
);

function Section({
  section,
  preview: Live,
  impl,
  onImpl,
}: {
  section: GuideSection;
  preview: (() => ReactNode) | undefined;
  impl: Impl;
  onImpl: (impl: Impl) => void;
}) {
  const { Prose, sectionClassName = "mb-12" } = useGuideHost();
  return (
    <div className={sectionClassName}>
      <Prose section={section} />
      {Live ? <Live /> : null}
      {section.html !== undefined || section.react !== undefined ? (
        <CodeTabs section={section} impl={impl} onImpl={onImpl} />
      ) : null}
    </div>
  );
}

const STATIC_HTML: FrameworkStore = { get: () => "html", subscribe: () => () => {} };

/** The sections of a guide, sharing one HTML | React choice. */
export function GuideSections({
  sections,
  previews = {},
}: {
  sections: readonly GuideSection[];
  previews?: Record<string, (() => ReactNode) | undefined>;
}) {
  // Starts from (and follows) the host's choice (Storybook: the toolbar's Framework menu).
  const store = useGuideHost().framework ?? STATIC_HTML;
  const framework = useSyncExternalStore(store.subscribe, store.get, store.getServer ?? store.get);
  const [impl, setImpl] = useState<Impl>(framework);
  useEffect(() => setImpl(framework), [framework]);
  const pick = (next: Impl) => {
    setImpl(next);
    store.set?.(next);
  };
  return (
    <>
      {sections.map((section) => (
        <Section
          key={section.id}
          section={section}
          preview={previews[section.id]}
          impl={impl}
          onImpl={pick}
        />
      ))}
    </>
  );
}
