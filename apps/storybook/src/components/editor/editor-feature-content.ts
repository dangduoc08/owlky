/** Content of the Bubble menu, Table and Mentions stories (plain data: the snippet script reads it). */

export const BUBBLE_CONTENT =
  "<p>Select some text: a menu with the marks and a link appears over the selection. " +
  "Press <strong>Alt+F10</strong> to move to it with the keyboard, and Escape to come back.</p>";

export const TABLE_CONTENT =
  "<p>Release plan</p>" +
  "<table><tbody>" +
  "<tr><th><p>Phase</p></th><th><p>Owner</p></th><th><p>Status</p></th></tr>" +
  "<tr><td><p>Design</p></td><td><p>Ada</p></td><td><p>Done</p></td></tr>" +
  "<tr><td><p>Build</p></td><td><p>Alan</p></td><td><p>In progress</p></td></tr>" +
  "</tbody></table>";

export const MENTION_CONTENT = "<p>Type @ to mention someone, such as @Grace.</p>";

/** The people the Mentions story suggests. */
export const PEOPLE = [
  { id: "ada", label: "Ada Lovelace" },
  { id: "alan", label: "Alan Turing" },
  { id: "grace", label: "Grace Hopper" },
  { id: "katherine", label: "Katherine Johnson" },
  { id: "linus", label: "Linus Torvalds" },
  { id: "margaret", label: "Margaret Hamilton" },
];
