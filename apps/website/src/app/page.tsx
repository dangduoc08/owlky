import "../site/landing/landing.css";
import manifest from "../generated/manifest.json";
import { Bento } from "../site/landing/bento.js";
import { Hero, LandingHeader } from "../site/landing/hero.js";
import {
  CallToAction,
  Faq,
  LandingFooter,
  MoreComponents,
  Principles,
  WhatYouGet,
  WorksWith,
} from "../site/landing/sections.js";

export const dynamic = "force-static";

/* The home page (a landing page): its own header and footer, no docs navigation. */
export default function Home() {
  const { components, unitTestFiles, e2eSpecFiles } = manifest.landing;
  return (
    <div data-landing="">
      <LandingHeader />
      <main id="main" data-pagefind-body="">
        <Hero componentCount={components.length} />
        <WorksWith />
        <Bento />
        <WhatYouGet />
        <MoreComponents components={components} />
        <Principles unitTestFiles={unitTestFiles} e2eSpecFiles={e2eSpecFiles} />
        <Faq />
        <CallToAction />
      </main>
      <LandingFooter />
    </div>
  );
}
