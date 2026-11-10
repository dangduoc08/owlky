import { Editor } from "@owlky/react";
import { TABLE_CONTENT } from "./editor-feature-content.js";

/** Tables: the toolbar's table menu inserts and edits them. */
export function TableDemo() {
  return <Editor id="table-editor" aria-label="Content" tables defaultValue={TABLE_CONTENT} />;
}
