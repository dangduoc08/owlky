import { Mark } from "@tiptap/core";

/** Case changes the text transform mark keeps (CSS `text-transform` values). */
export const editorTextTransforms = ["uppercase", "lowercase", "capitalize"] as const;
export type EditorTextTransform = (typeof editorTextTransforms)[number];

const ATTR = "data-ok-text-transform";

/** An allowed value, or `null`: anything else (other CSS, injected text) is dropped. */
export const readTextTransform = (value: string | null | undefined): EditorTextTransform | null => {
  const trimmed = (value ?? "").trim().toLowerCase();
  return editorTextTransforms.find((each) => each === trimmed) ?? null;
};

/** The transform an element asks for: `data-ok-text-transform`, else its `text-transform` style. */
const transformOf = (element: HTMLElement) =>
  readTextTransform(element.getAttribute(ATTR)) ?? readTextTransform(element.style.textTransform);

/**
 * Text transform: a mark that renders `span[style="text-transform: …"]`, as in the reference's
 * content (`<span style="text-transform: uppercase">`). It reads that style or
 * `data-ok-text-transform` (snippets carry no `style`, strict CSP); other values are dropped.
 */
export const TextTransform = Mark.create({
  name: "textTransform",

  addAttributes() {
    return {
      textTransform: {
        default: null,
        parseHTML: transformOf,
        renderHTML: (attributes: Record<string, unknown>) => {
          const value = readTextTransform(attributes["textTransform"] as string | null);
          return value ? { style: `text-transform: ${value}` } : {};
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "span",
        consuming: false,
        getAttrs: (element: HTMLElement) => (transformOf(element) ? null : false),
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", HTMLAttributes, 0];
  },
});
