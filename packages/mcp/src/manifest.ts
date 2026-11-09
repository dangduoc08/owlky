import { readFileSync } from "node:fs";

/*
 * The generated manifest (`scripts/manifest.mjs`, ADR-0046): the only data the server answers
 * from. It ships next to `dist/` and is read once; nothing else is read at run time.
 */

/** The manifest shape this server understands (`format` in the file). */
export const MANIFEST_FORMAT = 1;

export interface ManifestOption {
  /** The React prop. */
  readonly name: string;
  readonly kind: "style" | "flag" | "native" | "behavior" | "state" | "number";
  /** The HTML attribute. */
  readonly attr: string;
  readonly description: string;
  readonly values?: readonly string[];
  readonly default?: string | number | boolean;
  readonly optional?: boolean;
  readonly when?: string;
  readonly children?: string;
  readonly min?: number;
  readonly units?: readonly string[];
  /** HTML event that reports a state change (`ok:<name>:<event>`). */
  readonly event?: string;
}

export interface ManifestSchema {
  readonly name: string;
  readonly root: string;
  readonly options: readonly ManifestOption[];
}

export interface ManifestSection {
  readonly id: string;
  readonly title: string;
  /** Markdown. */
  readonly body: string;
}

export interface ManifestStory {
  /** Storybook story id. */
  readonly id: string;
  readonly name: string;
  /** The Code panel with the HTML framework: setup, then each group's snippet. */
  readonly html: string;
  /** The Code panel with the React framework. */
  readonly react: string;
  /** Snippet files (`@owlky/html/snippets/<component>/…`) the story shows. */
  readonly snippets: readonly string[];
}

export interface ManifestComponent {
  readonly name: string;
  readonly title: string;
  readonly summary: string;
  readonly referenceUrl?: string;
  /** The main root attribute (`data-ok-button`). */
  readonly root?: string;
  /** Value exports of `@owlky/react` documented by this component. */
  readonly react: readonly string[];
  readonly schemas: readonly ManifestSchema[];
  /** The spec, section by section (the generated options table is replaced by `schemas`). */
  readonly sections: readonly ManifestSection[];
  /** Root attribute → parts every instance must contain. */
  readonly requiredParts: Readonly<Record<string, readonly string[]>>;
  readonly related: readonly string[];
  readonly stories: readonly ManifestStory[];
  /** Snippets no story shows, by file name. */
  readonly snippets: Readonly<Record<string, string>>;
  /** Id of its docs guide. */
  readonly guide?: string;
  readonly storybookTitle?: string;
}

export interface ManifestGuideSection {
  readonly id: string;
  readonly title: string;
  readonly body: string;
  readonly html?: string;
  readonly react?: string;
}

export interface ManifestGuide {
  readonly id: string;
  readonly title: string;
  readonly kind: "introduction" | "foundation" | "component";
  readonly component?: string;
  readonly sections: readonly ManifestGuideSection[];
}

export interface ManifestToken {
  readonly name: string;
  readonly group: string;
  readonly value?: string;
  readonly light?: string;
  readonly dark?: string;
}

export interface ManifestUtility {
  /** The Tailwind theme variable (`--color-primary`). */
  readonly name: string;
  readonly value: string;
  /** The Owlky token it maps to. */
  readonly token?: string;
  readonly utilities: readonly string[];
  readonly note?: string;
}

export interface Manifest {
  readonly format: number;
  readonly version: string;
  readonly components: readonly ManifestComponent[];
  readonly guides: readonly ManifestGuide[];
  readonly tokens: {
    readonly variables: readonly ManifestToken[];
    readonly tailwind: readonly ManifestUtility[];
  };
  /** Every `data-ok-*` name the packages use. */
  readonly attributes: readonly string[];
  /** Part attribute → the root it always sits in. */
  readonly parts: Readonly<Record<string, string>>;
}

/** Reads the manifest that ships with the package. */
export function loadManifest(url = new URL("../manifest.json", import.meta.url)): Manifest {
  const manifest = JSON.parse(readFileSync(url, "utf8")) as Manifest;
  if (manifest.format !== MANIFEST_FORMAT) {
    throw new Error(
      `Unsupported manifest format ${manifest.format} (this server reads format ${MANIFEST_FORMAT}).`,
    );
  }
  return manifest;
}
