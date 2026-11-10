import { Editor } from "@owlky/react";
import { MENTION_CONTENT, PEOPLE } from "./editor-feature-content.js";

/** The first five people whose name contains the query. */
const findPeople = (query: string) =>
  PEOPLE.filter((person) => person.label.toLowerCase().includes(query.toLowerCase())).slice(0, 5);

/** Mentions: typing @ lists people. */
export function MentionsDemo() {
  return (
    <Editor
      id="mention-editor"
      aria-label="Content"
      mentions={{ items: findPeople }}
      defaultValue={MENTION_CONTENT}
    />
  );
}
