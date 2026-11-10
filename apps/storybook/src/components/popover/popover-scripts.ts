import { getRuntime } from "@owlky/html";

/*
 * Page scripts of the HTML "Anchor playground" and "Virtual element" stories: the same state as
 * the React demos, kept in attributes and the popover instance.
 */

interface PopoverApi {
  open(anchor: { getBoundingClientRect(): DOMRect }): boolean;
  close(reason?: string): boolean;
}

export function anchorPlaygroundScript(row: HTMLElement) {
  const popover = row.querySelector("#popover-playground") as HTMLElement;
  const onChange = (event: Event) => {
    const input = event.target as HTMLInputElement;
    if (input.name === "anchor-reference")
      popover.setAttribute("data-ok-anchor-reference", input.value);
  };
  row.addEventListener("change", onChange);
  return () => row.removeEventListener("change", onChange);
}

export const ANCHOR_PLAYGROUND_SCRIPT = `// The radios pick what positions the popover.
const popover = document.getElementById("popover-playground");
for (const radio of document.querySelectorAll('input[name="anchor-reference"]')) {
  radio.addEventListener("change", () => {
    popover.setAttribute("data-ok-anchor-reference", radio.value);
  });
}`;

export function virtualElementScript(row: HTMLElement) {
  const text = row.querySelector("[data-ok-typography]") as HTMLElement;
  const popover = row.querySelector("#popover-selection") as HTMLElement;
  const instance = () => getRuntime().get(popover, "popover") as unknown as PopoverApi | undefined;
  const selected = () => {
    const selection = document.getSelection();
    const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
    return range && !range.collapsed && text.contains(range.commonAncestorContainer) ? range : null;
  };
  const onSelected = () => {
    const range = selected();
    instance()?.close();
    if (range) instance()?.open({ getBoundingClientRect: () => range.getBoundingClientRect() });
  };
  const onChange = () => {
    if (!selected()) instance()?.close();
  };
  document.addEventListener("pointerup", onSelected);
  document.addEventListener("keyup", onSelected);
  document.addEventListener("selectionchange", onChange);
  return () => {
    document.removeEventListener("pointerup", onSelected);
    document.removeEventListener("keyup", onSelected);
    document.removeEventListener("selectionchange", onChange);
  };
}

export const VIRTUAL_ELEMENT_SCRIPT = `import { getRuntime } from "@owlky/html";

// A virtual anchor: the selection's rectangle places the popover next to the selected text.
const text = document.querySelector("[data-ok-typography]");
const popover = document.getElementById("popover-selection");

function selected() {
  const selection = document.getSelection();
  const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
  return range && !range.collapsed && text.contains(range.commonAncestorContainer) ? range : null;
}

// Open once the selection is made, close as soon as it is gone.
function onSelected() {
  const instance = getRuntime().get(popover, "popover");
  const range = selected();
  instance.close();
  if (range) instance.open({ getBoundingClientRect: () => range.getBoundingClientRect() });
}
document.addEventListener("pointerup", onSelected);
document.addEventListener("keyup", onSelected);
document.addEventListener("selectionchange", () => {
  if (!selected()) getRuntime().get(popover, "popover").close();
});`;
