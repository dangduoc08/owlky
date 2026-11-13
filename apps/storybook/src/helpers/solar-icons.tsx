import { Icon } from "@iconify/react/offline";
// Generated subset (`pnpm --filter @owlky/storybook icons`, `DOCS` in scripts/icons.mjs).
import icons from "./solar-icons.json" with { type: "json" };

/*
 * Solar icons for docs pages (ADR-0070 § 9): React examples import them through
 * `@iconify/react/offline` and `@iconify-icons/solar/<name>`, HTML examples carry the same
 * drawing as inline SVG. Previews render the same data, so a preview matches its code.
 */

export type SolarName = keyof typeof icons;

type SolarIconProps = {
  name: SolarName;
  /** Width and height in px. Omitted: `1em`, or the size the component gives its icon. */
  size?: number;
};

/** A decorative Solar icon for previews (what `<Icon icon={…} />` renders in the examples). */
export function SolarIcon({ name, size }: SolarIconProps) {
  return (
    <Icon
      icon={icons[name]}
      aria-hidden="true"
      {...(size === undefined ? {} : { width: size, height: size })}
    />
  );
}

/** The same icon as HTML markup for code examples: decorative unless a `label` names it. */
export function solarMarkup(name: SolarName, options: { size?: number; label?: string } = {}) {
  const { body, width, height } = icons[name];
  const a11y = options.label ? `role="img" aria-label="${options.label}"` : 'aria-hidden="true"';
  const size = options.size ? ` width="${options.size}" height="${options.size}"` : "";
  return `<svg ${a11y}${size} viewBox="0 0 ${width} ${height}">${body}</svg>`;
}

/**
 * The import lines of a React example: `Icon` and each icon's data as a camelCase name
 * (`letter-linear` → `letterLinear`).
 */
export const solarImports = (...names: SolarName[]) =>
  [
    'import { Icon } from "@iconify/react/offline";',
    ...names.map((name) => `import ${solarId(name)} from "@iconify-icons/solar/${name}";`),
  ].join("\n");

/** The identifier an example uses for an icon (`letter-linear` → `letterLinear`). */
export const solarId = (name: SolarName) =>
  name.replace(/-([a-z0-9])/g, (_, char: string) => char.toUpperCase());
