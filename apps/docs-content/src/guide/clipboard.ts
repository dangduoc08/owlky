/**
 * Copies text for the docs code blocks (guide.tsx) and the Code panel (.storybook/code-copy.ts).
 * Clipboard API first. The `execCommand` fallback covers pages served over plain HTTP from
 * another device (`pnpm storybook:network`): `navigator.clipboard` only exists in secure
 * contexts, and Storybook's own Copy buttons silently do nothing without it.
 */
export async function writeClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Denied (permissions policy, unfocused document): try the fallback.
  }
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  const focused = document.activeElement as HTMLElement | null;
  document.body.append(area);
  area.select();
  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  }
  area.remove();
  focused?.focus();
  return copied;
}
