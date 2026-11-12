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
  /** Style options: other valid values, a regular expression source matched whole (`16/10`). */
  readonly pattern?: string;
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

/** A React prop (API reference, ADR-0049). */
export interface ManifestApiProp {
  readonly name: string;
  readonly type: string;
  readonly description: string;
  readonly default?: string;
  readonly required?: boolean;
}

/** A `data-ok-*` name that isn't an option: an element, a state, a value or a trigger. */
export interface ManifestApiPart {
  readonly name: string;
  readonly kind: "part" | "state" | "value" | "trigger";
  readonly description: string;
  readonly elements?: readonly string[];
  /** Values and triggers: the values it takes (`"string"`: free text). */
  readonly value?: readonly string[] | "string";
}

export interface ManifestApiEvent {
  /** `ok:<component>:<event>`. */
  readonly name: string;
  /** The type of `event.detail`. */
  readonly detail: string;
  readonly cancelable: boolean | "sometimes";
  readonly description: string;
}

export interface ManifestApiMethod {
  readonly name: string;
  readonly kind: "method" | "property";
  readonly type: string;
  readonly description: string;
}

/** One React component and the HTML element it renders (Card, CardHeader…). */
export interface ManifestApiEntry {
  readonly name: string;
  readonly react?: {
    readonly description: string;
    readonly props: readonly ManifestApiProp[];
    /** Where other props and the `ref` go. */
    readonly native?: string;
    readonly ref?: string;
  };
  readonly html?: {
    readonly attribute: string;
    readonly description?: string;
    readonly elements?: readonly string[];
    readonly options?: readonly ManifestOption[];
    readonly parts?: readonly ManifestApiPart[];
    /** `runtime.get(element, runtime)`. */
    readonly runtime?: string;
    readonly events?: readonly ManifestApiEvent[];
    readonly methods?: readonly ManifestApiMethod[];
  };
}

export interface ManifestApi {
  readonly entries: readonly ManifestApiEntry[];
  /** Type names the tables use, with their definitions. */
  readonly types?: readonly {
    readonly name: string;
    readonly type: string;
    readonly framework?: string;
  }[];
  /** Public `--ok-*` variables the component's styles read. */
  readonly css?: readonly {
    readonly name: string;
    readonly value?: string;
    readonly light?: string;
    readonly dark?: string;
    readonly description?: string;
  }[];
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
  /** The API reference, per React component and HTML part (ADR-0049). */
  readonly api?: ManifestApi;
  /** Where the component comes from (ADR-0068). */
  readonly imports?: ManifestImports;
}

/** A component's per-component entries, stylesheets and lazy CDN module. */
export interface ManifestImports {
  readonly react?: string;
  readonly html?: string;
  readonly core?: string;
  /** Its stylesheets, in the order to import them (after `@owlky/styles/owlky.css` or tokens.css). */
  readonly css?: readonly string[];
  /** The lazy module `owlky.js` loads for it (`modules/<name>.js`), for `data-ok-preload`. */
  readonly cdnModule?: string;
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
  /** Attributes any component may carry (`data-ok-runtime`, `data-ok-theme`…). */
  readonly commonParts?: readonly ManifestApiPart[];
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
