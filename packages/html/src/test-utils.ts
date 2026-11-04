/** Test helpers (not published). */
export function mount(html: string, parent: ParentNode = document.body): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = html;
  parent.append(host);
  return host;
}

/** Lets MutationObserver callbacks and the runtime's microtask flush run. */
export const settle = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

export function resetPage(): void {
  document.body.replaceChildren();
  document.documentElement.removeAttribute("style");
  delete (globalThis as unknown as Record<symbol, unknown>)[Symbol.for("minimal-tailwind.runtime")];
  delete (globalThis as { MinimalTailwind?: unknown }).MinimalTailwind;
}
