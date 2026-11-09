import { CopyButton } from "@owlky/docs-content/guide";
import { Typography } from "@owlky/react";
import type { ReactNode } from "react";
import type { PageSection, SitePage } from "../content/types.js";
import { HighlightedCode } from "./highlight.js";
import { Prose } from "./render.js";

/* Page building blocks (server components): the page heading and website-only sections. */

export function PageHeading({ page, eyebrow }: { page: SitePage; eyebrow?: string }) {
  return (
    <header className="mb-10">
      {eyebrow ? (
        <Typography variant="overline" color="textSecondary" component="p" className="m-0 mb-2">
          {eyebrow}
        </Typography>
      ) : null}
      <Typography variant="h2" component="h1" className="m-0 mb-3">
        {page.title}
      </Typography>
      <Typography variant="body1" color="textSecondary" className="m-0 max-w-[48rem]">
        {page.description}
      </Typography>
    </header>
  );
}

/** Website-only sections (Home, Get started): prose, then code blocks with a Copy button. */
export function PageSections({ sections }: { sections: readonly PageSection[] }): ReactNode {
  return sections.map((section) => (
    <section key={section.id} aria-labelledby={section.id} className="mb-14">
      <Typography variant="h4" component="h2" id={section.id} data-site-heading="">
        {section.title}
      </Typography>
      <Prose>{section.body}</Prose>
      {(section.code ?? []).map((sample) => (
        <figure key={sample.label} data-site-sample="" className="m-0 mt-4">
          <Typography
            variant="caption"
            color="textSecondary"
            component="figcaption"
            className="mb-1 block font-semibold"
          >
            {sample.label}
          </Typography>
          <div className="relative">
            <HighlightedCode
              code={sample.code}
              language={sample.language}
              label={`${section.title}: ${sample.label}`}
            />
            <CopyButton code={sample.code} />
          </div>
        </figure>
      ))}
    </section>
  ));
}
