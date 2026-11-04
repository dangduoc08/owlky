/** Test helpers (not exported from the package). */
export function mount(html: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.append(host);
  return host;
}

export function cleanupDom(): void {
  document.body.replaceChildren();
  document.documentElement.removeAttribute("style");
}

export const nextFrame = () =>
  new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
