import {
  behavior,
  type DataAttributes,
  defineOptions,
  flag,
  number,
  optionAttributes,
  state,
  style,
} from "../options/define.js";

// --- Code editor (ADR-0034) ---------------------------------------------------------------------

/** Monaco's built-in language ids (more can be registered in `beforeMount`). */
export const codeEditorLanguages = [
  "plaintext",
  "abap",
  "aes",
  "apex",
  "azcli",
  "bat",
  "bicep",
  "c",
  "cameligo",
  "clojure",
  "coffeescript",
  "cpp",
  "csharp",
  "csp",
  "css",
  "cypher",
  "dart",
  "dockerfile",
  "ecl",
  "elixir",
  "flow9",
  "freemarker2",
  "fsharp",
  "go",
  "graphql",
  "handlebars",
  "hcl",
  "html",
  "ini",
  "java",
  "javascript",
  "json",
  "julia",
  "kotlin",
  "less",
  "lexon",
  "liquid",
  "lua",
  "m3",
  "markdown",
  "mdx",
  "mips",
  "msdax",
  "mysql",
  "objective-c",
  "pascal",
  "pascaligo",
  "perl",
  "pgsql",
  "php",
  "pla",
  "postiats",
  "powerquery",
  "powershell",
  "proto",
  "pug",
  "python",
  "qsharp",
  "r",
  "razor",
  "redis",
  "redshift",
  "restructuredtext",
  "ruby",
  "rust",
  "sb",
  "scala",
  "scheme",
  "scss",
  "shell",
  "sol",
  "sparql",
  "sql",
  "st",
  "swift",
  "systemverilog",
  "tcl",
  "twig",
  "typescript",
  "typespec",
  "vb",
  "verilog",
  "wgsl",
  "xml",
  "yaml",
] as const;
export type CodeEditorLanguage = (typeof codeEditorLanguages)[number];

/** Theme names: Owlky's (`auto` follows `data-ok-theme`) and Monaco's built-in ones. */
export const codeEditorThemes = [
  "auto",
  "owlky-light",
  "owlky-dark",
  "light",
  "vs",
  "vs-dark",
  "hc-black",
  "hc-light",
] as const;
export type CodeEditorThemeName = (typeof codeEditorThemes)[number];

// Both editors repeat theme, width and height inline: a shared object (or a spread of one)
// would keep these schemas in bundles that never use them.
const CODE_EDITOR_UNITS = ["px", "%", "rem", "em", "vh", "vw", "svh", "dvh", "lvh", "ch"] as const;

export const codeEditorOptions = defineOptions("code-editor", "data-ok-code-editor", {
  language: style(
    "data-ok-language",
    codeEditorLanguages,
    "plaintext",
    "Language of the current model (HTML: also the initial one). Without it, Monaco infers it from the path.",
    { optional: true },
  ),
  theme: style(
    "data-ok-monaco-theme",
    codeEditorThemes,
    "auto",
    "Monaco theme. `auto`: Owlky's light or dark theme after the scope's `data-ok-theme`; others are Monaco's (or one defined in `beforeMount`).",
    { optional: true },
  ),
  width: number(
    "data-ok-width",
    undefined,
    "Width (number = px, or a CSS length such as `50%`). Default `100%`.",
    { min: 0, units: CODE_EDITOR_UNITS },
  ),
  height: number(
    "data-ok-height",
    undefined,
    "Height (number = px, or a CSS length such as `90vh`). Default `100%`, at least 300px when not given.",
    { min: 0, units: CODE_EDITOR_UNITS },
  ),
  line: number("data-ok-line", undefined, "Scrolls to this line (1-based).", { min: 1 }),
  saveViewState: behavior(
    "data-ok-save-view-state",
    true,
    "Keeps each model's scroll, selection and folding when the path changes.",
  ),
  keepCurrentModel: flag(
    "data-ok-keep-current-model",
    "Keeps the current model (and its view state) when the editor is removed.",
  ),
  path: state(
    "data-ok-path",
    "Model path (`file:///index.ts`): each path is its own model, created on first use.",
  ),
  value: state(
    "data-ok-code-editor-value",
    "The value: the `<textarea>`'s text (the initial value, the form value and the fallback).",
    "change",
  ),
});

export type CodeEditorAnatomyOptions = {
  language?: string | undefined;
  theme?: string | undefined;
  width?: number | string | undefined;
  height?: number | string | undefined;
  line?: number | undefined;
  keepCurrentModel?: boolean | undefined;
};

/** `data-ok-*` attributes of a code editor root (known languages and themes only). */
export const codeEditorAttributes = (options: CodeEditorAnatomyOptions = {}): DataAttributes =>
  optionAttributes(codeEditorOptions, { ...options });

export const diffEditorOptions = defineOptions("diff-editor", "data-ok-diff-editor", {
  language: style(
    "data-ok-language",
    codeEditorLanguages,
    "plaintext",
    "Language of both models.",
    { optional: true },
  ),
  originalLanguage: style(
    "data-ok-original-language",
    codeEditorLanguages,
    "plaintext",
    "Language of the original model (default `language`).",
    { optional: true },
  ),
  modifiedLanguage: style(
    "data-ok-modified-language",
    codeEditorLanguages,
    "plaintext",
    "Language of the modified model (default `language`).",
    { optional: true },
  ),
  theme: style(
    "data-ok-monaco-theme",
    codeEditorThemes,
    "auto",
    "Monaco theme. `auto`: Owlky's light or dark theme after the scope's `data-ok-theme`; others are Monaco's (or one defined in `beforeMount`).",
    { optional: true },
  ),
  width: number(
    "data-ok-width",
    undefined,
    "Width (number = px, or a CSS length such as `50%`). Default `100%`.",
    { min: 0, units: CODE_EDITOR_UNITS },
  ),
  height: number(
    "data-ok-height",
    undefined,
    "Height (number = px, or a CSS length such as `90vh`). Default `100%`, at least 300px when not given.",
    { min: 0, units: CODE_EDITOR_UNITS },
  ),
  line: number(
    "data-ok-line",
    undefined,
    "Scrolls both sides to this line of the modified text (1-based).",
    { min: 1 },
  ),
  keepCurrentOriginalModel: flag(
    "data-ok-keep-current-original-model",
    "Keeps the original model when the editor is removed.",
  ),
  keepCurrentModifiedModel: flag(
    "data-ok-keep-current-modified-model",
    "Keeps the modified model when the editor is removed.",
  ),
  originalModelPath: state("data-ok-original-model-path", "Path of the original model."),
  modifiedModelPath: state("data-ok-modified-model-path", "Path of the modified model."),
  original: state("data-ok-diff-editor-original", "The original text: its `<textarea>`."),
  modified: state("data-ok-diff-editor-modified", "The modified text: its `<textarea>`."),
});

export type DiffEditorAnatomyOptions = {
  language?: string | undefined;
  originalLanguage?: string | undefined;
  modifiedLanguage?: string | undefined;
  theme?: string | undefined;
  width?: number | string | undefined;
  height?: number | string | undefined;
  line?: number | undefined;
  keepCurrentOriginalModel?: boolean | undefined;
  keepCurrentModifiedModel?: boolean | undefined;
};

/** `data-ok-*` attributes of a diff editor root. */
export const diffEditorAttributes = (options: DiffEditorAnatomyOptions = {}): DataAttributes =>
  optionAttributes(diffEditorOptions, { ...options });
