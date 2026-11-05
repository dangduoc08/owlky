import { Description, Markdown, Source, Subtitle, Title } from "@storybook/addon-docs/blocks";
import { type KeyboardEvent, type ReactNode, useId, useRef, useState } from "react";

/*
 * Usage guides for the Introduction and Foundations docs pages: each section is prose (Markdown,
 * no GFM tables), an optional live preview and one code block with HTML | React tabs.
 * Writing style: AGENTS.md → "Writing documentation". Every `--ok-*` variable and Tailwind token
 * class in the code is checked against the built CSS (e2e/tests/foundations.spec.ts).
 */

export interface GuideSection {
  id: string;
  title: string;
  /** Markdown (no GFM tables). */
  body: string;
  html?: string;
  react?: string;
}

export type Impl = "html" | "react";
const IMPLS: { id: Impl; label: string }[] = [
  { id: "html", label: "HTML" },
  { id: "react", label: "React" },
];

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
  const id = useId();
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    const next = impl === "html" ? "react" : "html";
    onImpl(next);
    tabs.current[IMPLS.findIndex((i) => i.id === next)]?.focus();
  };
  return (
    <div data-docs-code="">
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
      {IMPLS.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`${id}-${tab.id}-panel`}
          aria-labelledby={`${id}-${tab.id}`}
          hidden={impl !== tab.id}
        >
          {/* Storybook's Source block: syntax highlighting and a Copy button. */}
          <Source
            code={(tab.id === "html" ? section.html : section.react) ?? ""}
            language={tab.id === "html" ? "html" : "tsx"}
            dark
          />
        </div>
      ))}
    </div>
  );
}

/**
 * Live preview frame; `sb-unstyled` keeps Storybook's docs typography out of the examples. A
 * column never wraps: in a multi-line flex container, rows would grow to their longest content.
 */
export const Preview = ({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) => (
  <div
    className={`sb-unstyled mb-4 flex flex-wrap items-center gap-4 [&.flex-col]:flex-nowrap rounded-xl border border-dashed border-divider bg-paper p-6 ${className}`}
  >
    {children}
  </div>
);

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

export const capitalize = (value: string) => value[0]?.toUpperCase() + value.slice(1);

/** Inline code list for Markdown: `a`, `b` and `c`. */
export const codeList = (values: readonly (string | number)[]) => {
  const items = values.map((v) => `\`${v}\``);
  return items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;
};

export const CDN = "https://cdn.jsdelivr.net/npm/@owlky/html@0/dist";

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
  return (
    <div className="sb-docs-guide mb-12">
      <Markdown>{`## ${section.title}\n\n${section.body}`}</Markdown>
      {Live ? <Live /> : null}
      {section.html !== undefined || section.react !== undefined ? (
        <CodeTabs section={section} impl={impl} onImpl={onImpl} />
      ) : null}
    </div>
  );
}

/** The sections of a guide, sharing one HTML | React choice. */
export function GuideSections({
  sections,
  previews = {},
}: {
  sections: GuideSection[];
  previews?: Record<string, () => ReactNode>;
}) {
  const [impl, setImpl] = useState<Impl>("html");
  return (
    <>
      {sections.map((section) => (
        <Section
          key={section.id}
          section={section}
          preview={previews[section.id]}
          impl={impl}
          onImpl={setImpl}
        />
      ))}
    </>
  );
}

/** A foundation docs page: title, description and the guide. The stories stay in the sidebar. */
export function GuideDocs(props: {
  sections: GuideSection[];
  previews?: Record<string, () => ReactNode>;
}) {
  return (
    <>
      <Title />
      <Subtitle />
      <Description />
      <GuideSections {...props} />
    </>
  );
}
