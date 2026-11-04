import type { ReactNode } from "react";

/** Layout wrapper shared by React and HTML stories, so both render identical DOM (parity tests). */
export function Row({ children }: { children: ReactNode }) {
  return <div className="sb-row">{children}</div>;
}
