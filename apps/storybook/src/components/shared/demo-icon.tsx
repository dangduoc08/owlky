import icons from "./demo-icons.json" with { type: "json" };

export type DemoIconName = keyof typeof icons;

/**
 * Decorative stroke icons drawn for the component examples. The HTML snippets embed the same
 * paths (generated from demo-icons.json), so React and HTML stories render identical pixels.
 */
export function DemoIcon({ name }: { name: DemoIconName }) {
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
      {icons[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
