import type { ManifestSchema } from "@owlky/docs-content/guide/manifest";
import type { Metadata } from "next";
import { pageAt } from "../../../../content/site.js";
import manifest from "../../../../generated/manifest.json";
import { WebsiteGuide } from "../../../../site/guide-host.js";
import { ButtonGuide } from "../../../../site/guides/button.js";
import { PageHeading } from "../../../../site/page.js";
import { renderGuide } from "../../../../site/render.js";

export const dynamic = "force-static";

const page = pageAt("/components/button/");

export const metadata: Metadata = { title: page.title, description: page.description };

export default function ButtonPage() {
  const schemas = manifest.components.button.schemas as readonly ManifestSchema[];
  return (
    <article>
      <PageHeading page={page} eyebrow="Components" />
      <WebsiteGuide rendered={renderGuide(page)}>
        <ButtonGuide schemas={schemas} />
      </WebsiteGuide>
    </article>
  );
}
