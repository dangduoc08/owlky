import CodeBlock from "@tiptap/extension-code-block";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

/** A syntax tree node as lowlight returns it (hast): only the fields the editor reads. */
export interface HighlightNode {
  readonly type: string;
  readonly value?: string;
  readonly properties?: { readonly className?: unknown };
  readonly children?: readonly HighlightNode[];
}

/**
 * Syntax highlighting for code blocks. lowlight (`createLowlight(common)`) fits as is; Owlky
 * ships no grammar itself.
 */
export interface EditorHighlighter {
  highlight(language: string, value: string): HighlightNode;
  highlightAuto(value: string): HighlightNode;
  listLanguages(): string[];
  registered(language: string): boolean;
}

interface Range {
  from: number;
  to: number;
  classes: string;
}

/** Flattens a highlight tree into class ranges (offsets inside the code text). */
function ranges(node: HighlightNode, offset: number, classes: string[], out: Range[]): number {
  if (node.type === "text") {
    const length = node.value?.length ?? 0;
    if (classes.length > 0 && length > 0)
      out.push({ from: offset, to: offset + length, classes: classes.join(" ") });
    return offset + length;
  }
  const own = node.properties?.className;
  const next = Array.isArray(own)
    ? [...classes, ...own.filter((name): name is string => typeof name === "string")]
    : classes;
  let position = offset;
  for (const child of node.children ?? []) position = ranges(child, position, next, out);
  return position;
}

function decorations(doc: ProseMirrorNode, name: string, highlighter: EditorHighlighter) {
  const result: Decoration[] = [];
  doc.descendants((node, position) => {
    if (node.type.name !== name) return true;
    const language = node.attrs["language"] as string | null;
    const text = node.textContent;
    let tree: HighlightNode;
    try {
      tree =
        language && highlighter.registered(language)
          ? highlighter.highlight(language, text)
          : highlighter.highlightAuto(text);
    } catch {
      return false;
    }
    const found: Range[] = [];
    ranges(tree, 0, [], found);
    for (const range of found)
      result.push(
        Decoration.inline(position + 1 + range.from, position + 1 + range.to, {
          class: range.classes,
        }),
      );
    return false;
  });
  return DecorationSet.create(doc, result);
}

const highlightKey = new PluginKey<DecorationSet>("okEditorHighlight");

/**
 * The code block: `div[data-ok-editor-code-block]` › `select[data-ok-editor-language]` (only with
 * a highlighter) + `pre` › `code.language-<name>`. With a highlighter, text gets `hljs-*` classes
 * through decorations (the document stays plain text).
 */
export const createCodeBlock = (highlighter: EditorHighlighter | undefined) =>
  CodeBlock.extend({
    addNodeView() {
      return ({ node, editor, getPos }) => {
        let current = node;
        const dom = document.createElement("div");
        dom.setAttribute("data-ok-editor-code-block", "");
        const pre = document.createElement("pre");
        const code = document.createElement("code");
        pre.append(code);
        const setLanguageClass = () => {
          const language = current.attrs["language"] as string | null;
          code.className = language ? `language-${language}` : "";
          if (!language) code.removeAttribute("class");
        };
        setLanguageClass();

        let select: HTMLSelectElement | null = null;
        if (highlighter) {
          const field = document.createElement("select");
          select = field;
          field.setAttribute("data-ok-editor-language", "");
          field.setAttribute("aria-label", "Language");
          field.contentEditable = "false";
          const auto = document.createElement("option");
          auto.value = "";
          auto.textContent = "auto";
          field.append(auto);
          for (const language of highlighter.listLanguages()) {
            const option = document.createElement("option");
            option.value = language;
            option.textContent = language;
            field.append(option);
          }
          field.value = (current.attrs["language"] as string | null) ?? "";
          field.addEventListener("change", () => {
            const position = getPos();
            if (typeof position !== "number") return;
            editor
              .chain()
              .command(({ tr }) => {
                tr.setNodeMarkup(position, undefined, {
                  ...current.attrs,
                  language: field.value || null,
                });
                return true;
              })
              .run();
          });
          dom.append(field);
        }
        dom.append(pre);

        return {
          dom,
          contentDOM: code,
          update(next) {
            if (next.type !== current.type) return false;
            current = next;
            setLanguageClass();
            if (select) select.value = (next.attrs["language"] as string | null) ?? "";
            return true;
          },
          stopEvent: (event) => select?.contains(event.target as Node) === true,
          ignoreMutation: (mutation) =>
            mutation.type !== "selection" &&
            (mutation.target === dom || select?.contains(mutation.target) === true),
        };
      };
    },

    addProseMirrorPlugins() {
      // CodeBlock has its own plugins (pasting from VS Code).
      const parent = (this.parent as () => Plugin[])();
      if (!highlighter) return parent;
      const name = this.name;
      return [
        ...parent,
        new Plugin<DecorationSet>({
          key: highlightKey,
          state: {
            init: (_, { doc }) => decorations(doc, name, highlighter),
            apply: (tr, set) => (tr.docChanged ? decorations(tr.doc, name, highlighter) : set),
          },
          props: {
            decorations: (state) => highlightKey.getState(state),
          },
        }),
      ];
    },
  });
