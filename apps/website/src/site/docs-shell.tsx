import type { ReactNode } from "react";
import { PAGES } from "../content/site.js";
import { SiteHeader } from "./header.js";
import { SiteNav } from "./nav.js";
import { SiteFooterLinks } from "./site-frame.js";

/* The docs pages' frame: header, the Docs navigation, the main column and the footer. The home
 * page has its own frame (src/site/landing/). */

const NAV = PAGES.map(({ path, title, group }) => ({ path, title, group }));

export function DocsShell({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <div className="mx-auto grid max-w-[90rem] grid-cols-1 gap-8 px-4 py-8 md:grid-cols-[13rem_minmax(0,1fr)] md:px-8">
        <aside className="md:sticky md:top-8 md:self-start">
          <SiteNav items={NAV} />
        </aside>
        <main id="main" className="min-w-0" data-pagefind-body="">
          {children}
        </main>
      </div>
      <footer className="border-0 border-t border-solid border-divider px-4 py-6 text-center md:px-8">
        <p className="m-0 mb-3 text-[0.8125rem] text-text-secondary">
          Owlky is open source under the MIT license.
        </p>
        <div className="text-[0.8125rem]">
          <SiteFooterLinks />
        </div>
      </footer>
    </>
  );
}
