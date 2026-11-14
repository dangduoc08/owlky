import { Link } from "@owlky/react";
import type { ReactNode } from "react";
import { SITE } from "../content/site.js";
import { SiteHeader } from "./header.js";

/* The frame of the account and legal pages: the site header, one column, the footer. No docs
 * navigation, and no `data-pagefind-body`, so search never indexes these pages. */

export function SiteFooterLinks() {
  return (
    <nav aria-label="Site" className="flex flex-wrap justify-center gap-x-6 gap-y-2">
      <Link href="/account/" color="textPrimary">
        Account
      </Link>
      <Link href="/privacy/" color="textPrimary">
        Privacy
      </Link>
      <Link href="/terms/" color="textPrimary">
        Terms
      </Link>
      <Link href={SITE.github} color="textPrimary">
        Source on GitHub
      </Link>
    </nav>
  );
}

export function SiteFrame({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto min-h-[60vh] max-w-[64rem] px-4 py-12 md:px-8">
        {children}
      </main>
      <footer className="border-0 border-t border-solid border-divider px-4 py-6 text-[0.8125rem] md:px-8">
        <SiteFooterLinks />
      </footer>
    </>
  );
}
