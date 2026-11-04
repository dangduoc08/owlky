import type { SVGProps } from "react";

/**
 * A few simple stroke icons drawn for these docs (24 × 24 grid, `currentColor`). The library
 * ships no icon set: components accept any SVG.
 */
const PATHS = {
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  check: "M5 12.5l4.5 4.5L19 7.5",
  close: "M6 6l12 12M18 6L6 18",
  chevronDown: "M6 9l6 6 6-6",
  chevronRight: "M9 6l6 6-6 6",
  arrowRight: "M5 12h14M13 6l6 6-6 6",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4",
  menu: "M4 6h16M4 12h16M4 18h16",
  info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5M12 8h.01",
  alert: "M12 3.5 2.5 20h19L12 3.5zM12 10v4M12 17h.01",
  home: "M3 11l9-7 9 7M5.5 9.5V20h13V9.5",
} as const;

export type IconName = keyof typeof PATHS;
export const iconNames = Object.keys(PATHS) as IconName[];

export function Icon({ name, ...props }: { name: IconName } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
