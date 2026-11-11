/*
 * Motion "Layout" story (roadmap 5.4), HTML: the page scripts that change the DOM. The runtime
 * sees each change and animates the Motions with `data-ok-layout` / `data-ok-layout-id`.
 */

/** Reorder: "Move up" moves its task above the previous one (the first one to the end). */
export function reorderScript(row: HTMLElement) {
  const list = row.querySelector(".sb-layout-list") as HTMLElement;
  const move = (event: Event) => {
    const button = (event.target as Element).closest("button");
    const item = button?.closest("li");
    if (!button || !item) return;
    const previous = item.previousElementSibling;
    if (previous) list.insertBefore(item, previous);
    else list.append(item);
  };
  list.addEventListener("click", move);
  return () => list.removeEventListener("click", move);
}

export const REORDER_SCRIPT_SOURCE = `const list = document.querySelector(".sb-layout-list");

list.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  const item = button?.closest("li");
  if (!item) return;
  // Moving the item is all it takes: the runtime animates every task to its new place
  const previous = item.previousElementSibling;
  if (previous) list.insertBefore(item, previous);
  else list.append(item);
});`;

/** Expand: "Details" shows its answer and closes the others. */
export function expandScript(row: HTMLElement) {
  const buttons = [...row.querySelectorAll<HTMLButtonElement>("button[aria-controls]")];
  const toggle = (event: Event) => {
    const pressed = event.currentTarget as HTMLButtonElement;
    const open = pressed.getAttribute("aria-expanded") !== "true";
    for (const button of buttons) {
      const shown = open && button === pressed;
      button.setAttribute("aria-expanded", String(shown));
      const panel = document.getElementById(button.getAttribute("aria-controls") as string);
      if (panel) panel.hidden = !shown;
    }
  };
  for (const button of buttons) button.addEventListener("click", toggle);
  return () => {
    for (const button of buttons) button.removeEventListener("click", toggle);
  };
}

export const EXPAND_SCRIPT_SOURCE = `const buttons = [...document.querySelectorAll(".sb-layout-stack button[aria-controls]")];

for (const button of buttons) {
  button.addEventListener("click", () => {
    const open = button.getAttribute("aria-expanded") !== "true";
    for (const other of buttons) {
      const shown = open && other === button;
      other.setAttribute("aria-expanded", String(shown));
      document.getElementById(other.getAttribute("aria-controls")).hidden = !shown;
    }
  });
}`;

/** Shared highlight: the highlight moves into the pressed button. */
export function highlightScript(row: HTMLElement) {
  const group = row.querySelector(".sb-layout-segments") as HTMLElement;
  const select = (event: Event) => {
    const button = (event.target as Element).closest("button");
    const highlight = group.querySelector(".sb-layout-highlight");
    if (!button || !highlight) return;
    for (const other of group.querySelectorAll("button"))
      other.setAttribute("aria-pressed", String(other === button));
    // The highlight sits first in the button's label.
    button.querySelector("[data-ok-button-label]")?.prepend(highlight);
  };
  group.addEventListener("click", select);
  return () => group.removeEventListener("click", select);
}

export const HIGHLIGHT_SCRIPT_SOURCE = `const group = document.querySelector(".sb-layout-segments");

group.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  for (const other of group.querySelectorAll("button")) {
    other.setAttribute("aria-pressed", String(other === button));
  }
  // Moving the highlight into the pressed button animates it there
  const highlight = group.querySelector(".sb-layout-highlight");
  button.querySelector("[data-ok-button-label]").prepend(highlight);
});`;
