/*
 * Generated descriptions of maps (spec: map.md › Generated description, chart.md › Geo charts,
 * roadmap 4.18.99, after ApexMaps' `a11y.description: 'auto'`): what the map shows, how many
 * regions, the value range and its extremes, the classes and the regions without data, as one
 * paragraph for assistive technology. Shared by the Map (`p[data-ok-map-description][data-ok-auto]`)
 * and the Chart's `type="geo"` (`description="auto"`). Pure; strings are templates with `{name}`
 * placeholders so pages can translate them.
 */

/** The texts of a generated description (English defaults; pass your own to translate). */
export const geoDescriptionStrings = {
  /** The first sentence: `{type}` and `{count}` (regions). */
  summary: "{type} of {count} regions.",
  /** The value range: `{min}`, `{minName}`, `{max}`, `{maxName}`. */
  range: "Values range from {min} in {minName} to {max} in {maxName}.",
  /** The highest values: `{list}`. */
  highest: "Highest: {list}.",
  /** The classes: `{count}` and `{list}`. */
  classes: "{count} classes: {list}.",
  /** Regions without a value: `{list}`. */
  noData: "No data for {list}.",
  /** The end of a list cut short: `{count}` more. */
  more: "{count} more",
  /** Joins the last two items of a list. */
  and: "and",
  /** Map types (`{type}`). */
  choropleth: "Choropleth map",
  symbols: "Proportional symbol map",
  hex: "Hex tile map",
  pixel: "Pixel map",
  map: "Map",
} as const;

export type GeoDescriptionStrings = { -readonly [K in keyof typeof geoDescriptionStrings]: string };
export type GeoDescriptionKind = "choropleth" | "symbols" | "hex" | "pixel" | "map";

export interface GeoDescriptionItem {
  readonly name: string;
  /** `null`: no data. */
  readonly value: number | null;
  /** The value as shown (formatted). Default: the number. */
  readonly text?: string | undefined;
}

export interface GeoDescriptionInput {
  readonly kind?: GeoDescriptionKind | undefined;
  readonly items: readonly GeoDescriptionItem[];
  /** The classes' texts (legend labels), lowest first. */
  readonly classes?: readonly string[] | undefined;
  readonly strings?: Partial<GeoDescriptionStrings> | undefined;
  /** How many regions the "Highest" and "No data" lists name before "n more". Default 3 and 5. */
  readonly highest?: number | undefined;
  readonly noDataLimit?: number | undefined;
}

const fill = (template: string, values: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );

/** "A, B and C" (`and` from the strings). */
function list(items: readonly string[], and: string): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} ${and} ${items.at(-1)}`;
}

/** A description of a geo picture: type and size, value range and extremes, classes, no data. */
export function geoDescription(input: GeoDescriptionInput): string {
  const strings: GeoDescriptionStrings = { ...geoDescriptionStrings, ...input.strings };
  const items = input.items;
  const text = (item: GeoDescriptionItem) => item.text?.trim() || String(item.value);
  const kind = input.kind ?? "map";
  const parts = [fill(strings.summary, { type: strings[kind], count: items.length })];
  const valued = items.filter((item) => item.value !== null && Number.isFinite(item.value));
  if (valued.length) {
    const sorted = [...valued].sort((a, b) => (b.value as number) - (a.value as number));
    const max = sorted[0] as GeoDescriptionItem;
    const min = sorted.at(-1) as GeoDescriptionItem;
    parts.push(
      fill(strings.range, { min: text(min), minName: min.name, max: text(max), maxName: max.name }),
    );
    const count = Math.max(0, Math.floor(input.highest ?? 3));
    if (count > 1 && sorted.length > 2)
      parts.push(
        fill(strings.highest, {
          list: list(
            sorted.slice(0, count).map((item) => `${item.name} (${text(item)})`),
            strings.and,
          ),
        }),
      );
  }
  if (input.classes?.length)
    parts.push(
      fill(strings.classes, {
        count: input.classes.length,
        list: list(input.classes, strings.and),
      }),
    );
  const missing = items.filter((item) => !valued.includes(item)).map((item) => item.name);
  if (missing.length) {
    const limit = Math.max(1, Math.floor(input.noDataLimit ?? 5));
    const named = missing.slice(0, limit);
    if (missing.length > limit) named.push(fill(strings.more, { count: missing.length - limit }));
    parts.push(fill(strings.noData, { list: list(named, strings.and) }));
  }
  return parts.join(" ");
}
