import { ColorsGuide } from "@owlky/docs-content/foundations/colors";
import type { Metadata } from "next";
import { pageAt } from "../../../../content/site.js";
import { WebsiteGuide } from "../../../../site/guide-host.js";
import { PageHeading } from "../../../../site/page.js";
import { renderGuide } from "../../../../site/render.js";

export const dynamic = "force-static";

const page = pageAt("/foundations/colors/");

export const metadata: Metadata = { title: page.title, description: page.description };

export default function Colors() {
  return (
    <article>
      <PageHeading page={page} eyebrow="Foundations" />
      <WebsiteGuide rendered={renderGuide(page)}>
        <ColorsGuide />
      </WebsiteGuide>
    </article>
  );
}
