/**
 * The React examples the HTML snippets are generated from (`apps/storybook/scripts/
 * code-editor-snippets.mjs`): the stories' demos plus the diff editor, rendered to static
 * markup, so both implementations start from the same DOM.
 */
import { diffEditorOptions } from "@owlky/core";
import { DiffEditor } from "@owlky/react";
import { MODIFIED, ORIGINAL } from "./code-editor-content.js";
import { CodeEditorDemo } from "./code-editor-demo.js";
import { MultiModelDemo } from "./multi-model-demo.js";
import { ValidationDemo } from "./validation-demo.js";

/** Story Controls (ADR-0015): the diff editor's theme. */
export const DIFF_EDITOR_CONTROLS = { schema: diffEditorOptions, keys: ["theme"] } as const;

export function DiffExample() {
  return (
    <DiffEditor
      height={320}
      language="markdown"
      original={ORIGINAL}
      modified={MODIFIED}
      originalModelPath="file:///checklist.original.md"
      modifiedModelPath="file:///checklist.md"
      options={{ useInlineViewWhenSpaceIsLimited: false }}
    />
  );
}

export const SNIPPETS = {
  editor: CodeEditorDemo,
  diff: DiffExample,
  "multi-model": MultiModelDemo,
  validation: ValidationDemo,
} as const;
