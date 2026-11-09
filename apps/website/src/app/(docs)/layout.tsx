import type { ReactNode } from "react";
import { DocsShell } from "../../site/docs-shell.js";

/* Every docs page (a route group: no URL segment) shares the docs frame. */
export default function DocsLayout({ children }: { children: ReactNode }) {
  return <DocsShell>{children}</DocsShell>;
}
