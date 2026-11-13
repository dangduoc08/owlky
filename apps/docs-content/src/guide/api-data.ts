import type { GuideSection } from "./text.js";

/*
 * The API reference of a component (ADR-0049), as `scripts/api-reference.mjs` writes it to
 * `src/api/<component>.json`: plain data, so server code (the website, the manifest) reads it
 * too. `ApiReference` (`./api.tsx`) renders it.
 */

/** A React prop. */
export interface ApiProp {
  name: string;
  type: string;
  description: string;
  default?: string;
  required?: boolean;
}

/** A schema option (ADR-0015): one React prop and one HTML attribute. */
export interface ApiOption {
  name: string;
  kind: string;
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

/** A `data-ok-*` name that isn't an option: an element, a state, a value or a trigger. */
export interface ApiPart {
  name: string;
  kind: string;
  description: string;
  /** Parts: the elements it may be. */
  elements?: readonly string[];
  /** Values and triggers: the values it takes (`"string"`: free text). */
  value?: readonly string[] | string;
}

/** An `ok:<component>:<event>` event of the HTML runtime. */
export interface ApiEvent {
  name: string;
  /** The type of `event.detail`. */
  detail: string;
  /** `preventDefault()` refuses the change: always, never or only sometimes. */
  cancelable: boolean | string;
  description: string;
}

/** A member of the HTML runtime's instance (`runtime.get(element, name)`). */
export interface ApiMethod {
  name: string;
  kind: string;
  type: string;
  description: string;
}

/** One React component and the HTML element it renders (Card, CardHeader…). */
export interface ApiEntry {
  name: string;
  react?: {
    description: string;
    props: readonly ApiProp[];
    /** Where other props and the `ref` go: the native element's interface. */
    native?: string;
    /** The `ref`'s element when no native attribute is passed through. */
    ref?: string;
  };
  html?: {
    attribute: string;
    description?: string;
    elements?: readonly string[];
    options?: readonly ApiOption[];
    parts?: readonly ApiPart[];
    /** The runtime's name (`runtime.get(element, name)`). */
    runtime?: string;
    events?: readonly ApiEvent[];
    methods?: readonly ApiMethod[];
  };
}

/** A public `--ok-*` variable the component's styles read. */
export interface ApiCssVariable {
  name: string;
  value?: string;
  light?: string;
  dark?: string;
  description?: string;
}

/** A type the tables name, with its definition. */
export interface ApiType {
  name: string;
  type: string;
  /** Set when two packages define the name differently. */
  framework?: string;
}

/**
 * Where the component comes from (ADR-0068): its per-component entries, its stylesheets in
 * bundle order and the lazy CDN module that `owlky.js` loads for it. Only the keys that exist.
 */
export interface ApiImports {
  react?: string;
  html?: string;
  core?: string;
  css?: readonly string[];
  /** The module name: `owlky.js` loads `modules/<name>.js` when the page holds the component. */
  cdnModule?: string;
}

export interface ApiReferenceData {
  format: number;
  name: string;
  title: string;
  imports?: ApiImports;
  entries: readonly ApiEntry[];
  css?: readonly ApiCssVariable[];
  types?: readonly ApiType[];
}

/** Reads a generated reference file (`import data from "…/api/card.json"`). */
export const apiReferenceData = (data: unknown): ApiReferenceData => data as ApiReferenceData;

/**
 * The docs page's "API reference" section: the generated tables of `data` (a
 * `src/api/<component>.json` file). Add it last to the page's sections; a page that also
 * documents another component (Checkbox and FormControlLabel) adds one more with its own `id`.
 */
export function apiReferenceSection(
  data: unknown,
  { id = "api", title = "API reference" }: { id?: string; title?: string } = {},
): GuideSection {
  const reference = apiReferenceData(data);
  return {
    id,
    title,
    body: `The complete API of ${reference.title}, generated from its source code. **Import** lists the package entries, stylesheets and CDN module to load it from. Each React component and HTML part has its own tables:

- **React props:** the props of the React component, with their types and defaults. Props that aren't listed go to the native element.
- **HTML attributes:** the options, written as \`data-ok-*\` attributes, with their values and defaults.
- **Parts:** the elements inside the part, the states and values the runtime writes, and the triggers that act on the component.
- **Events:** the \`ok:*\` events the HTML runtime dispatches, with their \`detail\`.
- **Methods:** the instance that \`runtime.get(element, name)\` returns.

**Types** defines the type names that the tables use. **CSS variables** lists the tokens that the styles read.`,
    api: reference,
  };
}
