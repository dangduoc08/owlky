/*
 * Page scripts of the HTML Card stories that keep state. Card is CSS only: like the React demos'
 * `useState`, the page decides what a button does. Each script returns its cleanup.
 */

/** Complex interaction: the chevron shows or hides the section it controls (a Collapse animates it). */
export function expandScript(row: HTMLElement) {
  const onClick = (event: Event) => {
    const button = (event.target as Element).closest("[aria-controls][aria-expanded]");
    if (!button || !row.contains(button)) return;
    const section = document.getElementById(button.getAttribute("aria-controls") ?? "");
    if (!section) return;
    const expanded = button.getAttribute("aria-expanded") !== "true";
    button.setAttribute("aria-expanded", String(expanded));
    section.hidden = !expanded;
  };
  row.addEventListener("click", onClick);
  return () => row.removeEventListener("click", onClick);
}

export const EXPAND_SCRIPT_SOURCE = `
// Show or hide the section that the chevron button controls.
// The section is a Collapse: the runtime animates it when \`hidden\` changes.
document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-ok-card] [aria-controls][aria-expanded]");
  if (!button) return;
  const section = document.getElementById(button.getAttribute("aria-controls"));
  const expanded = button.getAttribute("aria-expanded") !== "true";
  button.setAttribute("aria-expanded", String(expanded));
  section.hidden = !expanded;
});
`;

/** Active state: pressing a card's action area marks it as the chosen one. */
export function choicesScript(row: HTMLElement) {
  const onClick = (event: Event) => {
    const area = (event.target as Element).closest("[data-ok-card-action-area][aria-pressed]");
    if (!area || !row.contains(area)) return;
    for (const other of row.querySelectorAll("[data-ok-card-action-area][aria-pressed]"))
      other.setAttribute("aria-pressed", String(other === area));
  };
  row.addEventListener("click", onClick);
  return () => row.removeEventListener("click", onClick);
}

export const CHOICES_SCRIPT_SOURCE = `
// Mark the pressed card as the chosen one.
const choices = document.querySelector(".sb-card-choices");
choices.addEventListener("click", (event) => {
  const area = event.target.closest("[data-ok-card-action-area]");
  if (!area) return;
  for (const other of choices.querySelectorAll("[data-ok-card-action-area]"))
    other.setAttribute("aria-pressed", String(other === area));
});
`;
