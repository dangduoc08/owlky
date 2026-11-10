import { Editor } from "@owlky/react";
import { BUBBLE_CONTENT } from "./editor-feature-content.js";

/** A toolbar over the selected text. */
export function BubbleMenuDemo() {
  return (
    <Editor id="bubble-editor" aria-label="Content" bubbleMenu defaultValue={BUBBLE_CONTENT} />
  );
}
