import type { OptionSchema, OptionSpec } from "@owlky/core";

/*
 * The MCP manifest's option schemas (`@owlky/mcp/manifest.json`, ADR-0046) in the shape
 * `OptionsTable` reads. The manifest is built from the same `@owlky/core` schemas, so both
 * hosts show the same table.
 */

/** One option as the manifest writes it (`event` already carries `ok:<name>:`). */
export interface ManifestOption {
  name: string;
  kind: OptionSpec["kind"];
  attr: string;
  description: string;
  values?: readonly string[];
  default?: string | number | boolean;
  optional?: boolean;
  when?: string;
  children?: string;
  min?: number;
  units?: readonly string[];
  event?: string;
}

export interface ManifestSchema {
  name: string;
  root: string;
  options: readonly ManifestOption[];
}

export function manifestOptionSchema(entry: ManifestSchema): OptionSchema {
  const prefix = `ok:${entry.name}:`;
  const options = Object.fromEntries(
    entry.options.map(({ name, event, ...spec }) => [
      name,
      {
        ...spec,
        ...(event === undefined
          ? {}
          : { event: event.startsWith(prefix) ? event.slice(prefix.length) : event }),
      } as OptionSpec,
    ]),
  );
  return { name: entry.name, root: entry.root as OptionSchema["root"], options };
}
