import { Icon } from "@iconify/react/offline";
// Generated subset (`pnpm --filter @owlky/storybook icons`, `DOCS` in scripts/icons.mjs).
import icons from "./solar-icons.json" with { type: "json" };

/*
 * Solar icons for docs pages and component stories (ADR-0070 § 9): React examples import them
 * through `@iconify/react/offline` and `@iconify-icons/solar/<name>`, HTML examples carry the same
 * drawing as inline SVG. Previews render the same data, so a preview matches its code. Stories
 * render `SolarIcon` (what `<Icon icon={…} />` renders): their HTML snippets hold that markup and
 * the Code panel prints the `Icon` call (`jsxSource`, `solarSource`).
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
SolarIcon.displayName = "SolarIcon";

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

const SOLAR_IMPORT = /^import \{ SolarIcon(, type SolarName)? \} from "[^"]*solar-icons\.js";\n/m;

/**
 * The Code panel source of a stateful story demo (`?raw`): its `SolarIcon` import becomes the
 * imports of `Icon` and each icon it names, `<SolarIcon name=…>` an `<Icon icon=…>` call, and the
 * icon names in its data their identifiers. Other sources are returned unchanged.
 */
export function solarSource(source: string): string {
  const match = SOLAR_IMPORT.exec(source);
  if (!match) return source;
  const names = new Set<SolarName>();
  const body = source
    .replace(SOLAR_IMPORT, "@@solar-imports@@\n")
    .replace(/"([a-z0-9-]+)"/g, (literal, name: string) => {
      if (!(name in icons)) return literal;
      names.add(name as SolarName);
      return solarId(name as SolarName);
    })
    .replace(/<SolarIcon name=\{?([^}/]+?)\}? \/>/g, "<Icon icon={$1} />")
    .replace(/\bSolarName\b/g, "IconifyIcon");
  const imports = [
    `import { Icon${match[1] ? ", type IconifyIcon" : ""} } from "@iconify/react/offline";`,
    ...[...names]
      .sort()
      .map((name) => `import ${solarId(name)} from "@iconify-icons/solar/${name}";`),
  ];
  return body.replace("@@solar-imports@@", imports.join("\n"));
}
