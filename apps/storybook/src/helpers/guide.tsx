import { GuideSections as Sections } from "@owlky/docs-content/guide";
import { type GuideHost, GuideHostProvider } from "@owlky/docs-content/guide/host";
import type { GuideSection } from "@owlky/docs-content/guide/text";
import { Description, Markdown, Source, Subtitle, Title } from "@storybook/addon-docs/blocks";
import type { ReactNode } from "react";
import { frameworkGlobal } from "./framework-global.js";

/*
 * Storybook's host for the usage guides (ADR-0040): the guide UI lives in `@owlky/docs-content`;
 * Storybook gives it its docs blocks (Markdown, the Source block) and the toolbar's Framework
 * choice. Pages not yet migrated to docs-content import the helpers from here.
 */

export { Caption, Dot, Preview } from "@owlky/docs-content/guide";
export {
  CDN,
  capitalize,
  codeList,
  type GuideSection,
  type Impl,
} from "@owlky/docs-content/guide/text";

const storybookHost: GuideHost = {
  Prose: ({ section }) => <Markdown>{`## ${section.title}\n\n${section.body}`}</Markdown>,
  // Storybook's Source block for highlighting; its own Copy bar is hidden (preview.css).
  CodeBlock: ({ code, language }) => <Source code={code} language={language} dark />,
  PreviewFrame: ({ className, children }) => <div className={className}>{children}</div>,
  framework: frameworkGlobal,
  sectionClassName: "sb-docs-guide mb-12",
  // Keeps Storybook's docs typography out of previews and tables.
  unstyledClassName: "sb-unstyled",
};

type GuideProps = {
  sections: GuideSection[];
  previews?: Record<string, () => ReactNode>;
};

/** Provides Storybook's blocks to the guide UI (docs pages rendered from docs-content). */
export function StorybookGuide({ children }: { children: ReactNode }) {
  return <GuideHostProvider host={storybookHost}>{children}</GuideHostProvider>;
}

/** The sections of a guide, sharing one HTML | React choice. */
export function GuideSections(props: GuideProps) {
  return (
    <StorybookGuide>
      <Sections {...props} />
    </StorybookGuide>
  );
}

/** A docs page: title, description and the guide. The stories stay in the sidebar. */
export function GuideDocs(props: GuideProps) {
  return (
    <>
      <Title />
      <Subtitle />
      <Description />
      <GuideSections {...props} />
    </>
  );
}
