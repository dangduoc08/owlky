import { addCollection, Icon, type IconifyJSON } from "@iconify/react/offline";
// Generated subset (`pnpm --filter @owlky/storybook icons`): offline, no Iconify API.
import data from "./icon-data.json" with { type: "json" };

for (const collection of data.collections) addCollection(collection as IconifyJSON);

export type IconSetPrefix = "solar" | "eva" | "logos" | "vscode-icons" | "circle-flags";

export function iconSet(prefix: IconSetPrefix) {
  const set = data.sets.find((entry) => entry.prefix === prefix);
  if (!set) throw new Error(`Unknown icon set ${prefix}`);
  return set;
}

/**
 * An icon from the bundled Iconify subset, named for assistive technology (`prefix:name`) since
 * the galleries show icons without captions. The SVG itself stays `aria-hidden`.
 */
export function IconifyGlyph({ icon, size = 24 }: { icon: string; size?: number }) {
  return (
    <span role="img" aria-label={icon} title={icon} className="inline-flex">
      <Icon icon={icon} width={size} height={size} aria-hidden="true" />
    </span>
  );
}
