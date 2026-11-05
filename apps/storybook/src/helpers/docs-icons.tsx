/*
 * Decorative icons for docs pages: the same drawing as JSX (previews) and as markup (HTML code).
 */

const PATHS: Record<string, string[]> = {
  mail: ["M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z", "m3 7 9 6 9-6"],
  plus: ["M12 5v14", "M5 12h14"],
  trash: [
    "M4 7h16",
    "M10 11v6",
    "M14 11v6",
    "M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12",
    "M9 7V4h6v3",
  ],
  bold: ["M7 5h6a3.5 3.5 0 0 1 0 7H7z", "M7 12h7a3.5 3.5 0 0 1 0 7H7z"],
  italic: ["M14 5h-4", "M14 19h-4", "M14 5 10 19"],
  underline: ["M7 5v6a5 5 0 0 0 10 0V5", "M5 20h14"],
};

export type DocsIconName = keyof typeof PATHS;

export function DocsIcon({ name }: { name: DocsIconName }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {(PATHS[name] ?? []).map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

/** The same icon as HTML markup for code examples. */
export const iconMarkup = (name: DocsIconName) =>
  `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${(PATHS[name] ?? []).map((d) => `<path d="${d}" />`).join("")}</svg>`;
