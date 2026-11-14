import type { ReactNode } from "react";
import { SiteFrame } from "../../site/site-frame.js";

/* Account and legal pages (a route group: no URL segment) share the plain site frame. */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return <SiteFrame>{children}</SiteFrame>;
}
