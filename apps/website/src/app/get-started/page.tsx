import type { Metadata } from "next";
import { pageAt } from "../../content/site.js";
import { PageHeading, PageSections } from "../../site/page.js";

export const dynamic = "force-static";

const page = pageAt("/get-started/");

export const metadata: Metadata = { title: page.title, description: page.description };

export default function GetStarted() {
  return (
    <article>
      <PageHeading page={page} eyebrow="Overview" />
      <PageSections sections={page.sections ?? []} />
    </article>
  );
}
