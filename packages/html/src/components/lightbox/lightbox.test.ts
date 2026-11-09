import { lightboxOptions } from "@owlky/core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { createRuntime } from "../../runtime/runtime.js";
import type { Runtime } from "../../runtime/types.js";
import {
  expectCspSafe,
  expectNoAxeViolations,
  mount,
  resetPage,
  settle,
} from "../../test-utils.js";
import { components } from "../index.js";
import type { LightboxInstance } from "./lightbox.js";

const snippets = Object.entries(
  import.meta.glob("./examples/*.html", { query: "?raw", import: "default", eager: true }),
) as [string, string][];

/** Story images live in Storybook's static folder: tests use inline pictures instead. */
const PICTURE = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="800"><rect width="1600" height="800" fill="teal"/></svg>',
)}`;
const local = (html: string) =>
  html
    .replaceAll(/(src|poster)="lightbox\/[^"]+\.svg"/g, `$1="${PICTURE}"`)
    .replaceAll(/<source [^>]*>/g, "")
    .replaceAll(/<track [^>]*>/g, "");
const lightboxSnippet = local(
  (snippets.find(([path]) => path.endsWith("/lightbox-example.html")) as [string, string])[1],
);
const inlineSnippet = local(
  (snippets.find(([path]) => path.endsWith("/inline-example.html")) as [string, string])[1],
);

let runtime: Runtime | undefined;
afterEach(() => {
  runtime?.stop();
  runtime = undefined;
  resetPage();
  vi.restoreAllMocks();
});

const start = () => {
  runtime = createRuntime()
    .register(...components)
    .start();
  return runtime;
};
const until = (test: () => boolean, timeout = 3000) =>
  new Promise<void>((resolve, reject) => {
    const begin = performance.now();
    const check = () => {
      if (test()) resolve();
      else if (performance.now() - begin > timeout) reject(new Error("timeout"));
      else requestAnimationFrame(check);
    };
    check();
  });

async function setup(html = lightboxSnippet, attrs = 'data-ok-animation-swipe="0"') {
  const host = mount(html.replace("<dialog ", `<dialog ${attrs} `));
  const root = host.querySelector<HTMLElement>("[data-ok-lightbox]") as HTMLElement;
  const events: string[] = [];
  for (const type of [
    "beforeopen",
    "open",
    "beforeclose",
    "close",
    "view",
    "click",
    "zoom",
    "rotate",
    "fullscreen",
    "slideshow",
    "captions",
    "thumbnails",
    "download",
    "share",
  ]) {
    root.addEventListener(`ok:lightbox:${type}`, (event) => {
      const detail = (event as CustomEvent).detail as Record<string, unknown> | null;
      const { trigger: _trigger, ...rest } = detail ?? {};
      events.push(`${type}:${JSON.stringify(rest)}`);
    });
  }
  start();
  await settle();
  const instance = runtime?.get<LightboxInstance>(root, "lightbox") as LightboxInstance;
  const part = (selector: string) => root.querySelector<HTMLElement>(selector) as HTMLElement;
  return {
    host,
    root,
    events,
    instance,
    part,
    counter: () => part("[data-ok-lightbox-counter]").textContent,
    triggers: [...host.querySelectorAll<HTMLElement>("[data-ok-lightbox-trigger]")],
  };
}

describe("lightbox snippets", () => {
  it("covers every story", () => expect(snippets).toHaveLength(3));

  it.each(snippets)("%s: valid anatomy, CSP-safe, accessible", async (_, raw) => {
    const html = local(raw);
    const host = mount(html);
    expectCspSafe(host, raw);
    for (const svg of host.querySelectorAll("svg"))
      expect(svg.getAttribute("aria-hidden")).toBe("true");
    for (const button of host.querySelectorAll("button")) {
      expect(button.getAttribute("type")).toBe("button");
      const name =
        button.getAttribute("aria-label") ||
        button.textContent?.trim() ||
        button.querySelector("img")?.getAttribute("alt");
      expect(name, button.outerHTML).toBeTruthy();
    }
    const root = host.querySelector<HTMLElement>("[data-ok-lightbox]") as HTMLElement;
    expect(root.getAttribute("data-ok-theme")).toBe("dark");
    expect(lightboxOptions.options.imageFit.values).toContain(root.dataset["okImageFit"]);
    for (const trigger of host.querySelectorAll("[data-ok-lightbox-trigger]")) {
      expect(trigger.getAttribute("data-ok-lightbox-open")).toBe(root.id);
      expect(trigger.getAttribute("aria-haspopup")).toBe("dialog");
    }
    start();
    await settle();
    expect(root.hasAttribute("data-ok-ready")).toBe(true);
    await expectNoAxeViolations(host);
  });
});

describe("lightbox runtime", () => {
  it("opens at the trigger's slide, emits events and closes with Escape", async () => {
    const { root, events, instance, counter, triggers } = await setup();
    await userEvent.click(triggers[2] as HTMLElement);
    expect((root as HTMLDialogElement).open).toBe(true);
    expect(instance.isOpen).toBe(true);
    expect(counter()).toBe("3 / 5");
    expect(events).toEqual(['beforeopen:{"index":2}', 'view:{"index":2}', 'open:{"index":2}']);
    await expectNoAxeViolations(root);
    await userEvent.keyboard("{ArrowRight}");
    await until(() => counter() === "4 / 5");
    await userEvent.keyboard("{Escape}");
    expect((root as HTMLDialogElement).open).toBe(false);
    expect(events.slice(-2)).toEqual([
      'beforeclose:{"reason":"escape"}',
      'close:{"reason":"escape"}',
    ]);
    expect(document.activeElement).toBe(triggers[2]);
  });

  it("lets listeners refuse to open or close", async () => {
    const { root, instance, triggers } = await setup();
    const refuse = (event: Event) => event.preventDefault();
    root.addEventListener("ok:lightbox:beforeopen", refuse);
    await userEvent.click(triggers[0] as HTMLElement);
    expect(instance.isOpen).toBe(false);
    expect(instance.open()).toBe(false);
    root.removeEventListener("ok:lightbox:beforeopen", refuse);
    expect(instance.open(1)).toBe(true);
    expect(instance.open(3)).toBe(true); // Already open.
    root.addEventListener("ok:lightbox:beforeclose", refuse);
    expect(instance.close()).toBe(false);
    await userEvent.click(root.querySelector("[data-ok-lightbox-close]") as HTMLElement);
    expect(instance.isOpen).toBe(true);
    root.removeEventListener("ok:lightbox:beforeclose", refuse);
    expect(instance.close()).toBe(true);
    expect(instance.close()).toBe(true); // Already closed.
  });

  it("reports the toolbar's actions", async () => {
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const { root, events, instance, part } = await setup(
      lightboxSnippet,
      'data-ok-animation-swipe="0" data-ok-rotate data-ok-download data-ok-captions-show-toggle data-ok-thumbnails-show-toggle',
    );
    instance.open(0);
    await Promise.all(
      [...root.querySelectorAll("img")].map((img) => img.decode().catch(() => null)),
    );
    events.length = 0;
    part("[data-ok-lightbox-zoom-in]").click();
    part("[data-ok-lightbox-rotate-cw]").click();
    part("[data-ok-lightbox-captions]").click();
    part("[data-ok-lightbox-thumbnails-toggle]").click();
    part("[data-ok-lightbox-slideshow]").click();
    part("[data-ok-lightbox-slideshow]").click();
    part("[data-ok-snapped] [data-ok-lightbox-zoom]").click();
    root.addEventListener("ok:lightbox:download", (event) => event.preventDefault(), {
      once: true,
    });
    part("[data-ok-lightbox-download]").click();
    expect(events).toEqual([
      'zoom:{"zoom":2}',
      'zoom:{"zoom":1}',
      'rotate:{"index":0,"rotation":90}',
      'captions:{"visible":false}',
      'thumbnails:{"visible":false}',
      'slideshow:{"playing":true}',
      'slideshow:{"playing":false}',
      'click:{"index":0}',
      'download:{"index":0}',
    ]);
    part("[data-ok-lightbox-download]").click();
    expect(events.at(-1)).toBe('download:{"index":0}');
    expect(instance.zoom).toBe(1);
    instance.goTo(4, true);
    expect(instance.index).toBe(4);
  });

  it("emits share and fullscreen events", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "share", { value: share, configurable: true });
    let element: Element | null = null;
    vi.spyOn(document, "fullscreenEnabled", "get").mockReturnValue(true);
    vi.spyOn(document, "fullscreenElement", "get").mockImplementation(() => element);
    try {
      const { root, events, instance, part } = await setup(
        lightboxSnippet,
        'data-ok-animation-swipe="0" data-ok-share',
      );
      vi.spyOn(root, "requestFullscreen").mockImplementation(async () => {
        element = root;
        document.dispatchEvent(new Event("fullscreenchange"));
      });
      instance.open(1);
      root.addEventListener("ok:lightbox:share", (event) => event.preventDefault(), { once: true });
      part("[data-ok-lightbox-share]").click();
      expect(share).not.toHaveBeenCalled();
      part("[data-ok-lightbox-share]").click();
      await until(() => share.mock.calls.length === 1);
      part("[data-ok-lightbox-fullscreen]").click();
      await until(() => events.includes('fullscreen:{"fullscreen":true}'));
      expect(events).toContain('share:{"index":1}');
    } finally {
      Reflect.deleteProperty(navigator, "share");
    }
  });

  it("opens on load with data-ok-open, and reads labels from data-ok-labels", async () => {
    const { instance, part, root } = await setup(
      lightboxSnippet,
      `data-ok-open data-ok-labels='{"Zoom level":"Zoom: {zoom}%"}'`,
    );
    expect(instance.isOpen).toBe(true);
    await Promise.all(
      [...root.querySelectorAll("img")].map((img) => img.decode().catch(() => null)),
    );
    instance.zoomIn();
    part("[data-ok-lightbox-zoom-in]").click();
    expect(part("[data-ok-lightbox-live]").textContent).toBe("Zoom: 400%");
    for (const labels of ["{oops", "[1]", "1", `{"Zoom level":"${"x".repeat(5000)}"}`, ""]) {
      root.setAttribute("data-ok-labels", labels);
      instance.changeZoom(4);
      part("[data-ok-lightbox-zoom-out]").click();
      expect(part("[data-ok-lightbox-live]").textContent).toMatch(/^Zoom/);
    }
  });

  it("reports browser closes, ignores other carousels' events, and works without a carousel", async () => {
    const { root, events, instance, part } = await setup();
    instance.open(0);
    (root as HTMLDialogElement).close();
    await until(() => events.includes('close:{"reason":"native"}'));
    part("[data-ok-carousel-slide]").dispatchEvent(
      new CustomEvent("ok:carousel:autoplay", { bubbles: true, detail: { playing: true } }),
    );
    expect(events.some((event) => event.startsWith("slideshow"))).toBe(false);
    const empty = mount('<dialog data-ok-lightbox aria-label="Empty"></dialog>');
    await settle();
    const bare = runtime?.get<LightboxInstance>(
      empty.querySelector("dialog"),
      "lightbox",
    ) as LightboxInstance;
    expect(bare.open(2)).toBe(true);
    expect(bare.index).toBe(0);
    bare.close();
  });

  it("is always open inline", async () => {
    const host = mount(inlineSnippet);
    const root = host.querySelector<HTMLElement>("[data-ok-lightbox]") as HTMLElement;
    root.setAttribute("data-ok-animation-swipe", "0");
    start();
    await settle();
    const instance = runtime?.get<LightboxInstance>(root, "lightbox") as LightboxInstance;
    expect(instance.isOpen).toBe(true);
    expect(instance.open(2)).toBe(true);
    expect(instance.index).toBe(2);
    expect(instance.close()).toBe(true);
    expect(instance.isOpen).toBe(true);
    await expectNoAxeViolations(host);
  });

  it("writes the numeric options through CSSOM and cleans up", async () => {
    const { root } = await setup(
      lightboxSnippet,
      'data-ok-thumbnails-width="96" data-ok-padding="5%" data-ok-spacing="oops"',
    );
    expect(root.style.getPropertyValue("--_ok-lightbox-thumb-width")).toBe("96px");
    expect(root.style.getPropertyValue("--_ok-lightbox-padding")).toBe("5%");
    expect(root.style.getPropertyValue("--_ok-lightbox-spacing")).toBe("");
    root.removeAttribute("data-ok-thumbnails-width");
    root.setAttribute("data-ok-description-max-lines", "2");
    await settle();
    expect(root.style.getPropertyValue("--_ok-lightbox-thumb-width")).toBe("");
    expect(root.style.getPropertyValue("--_ok-lightbox-lines")).toBe("2");
    runtime?.destroy(root);
    expect(root.style.getPropertyValue("--_ok-lightbox-padding")).toBe("");
    expect(root.hasAttribute("data-ok-ready")).toBe(false);
  });

  it("warns about triggers without a lightbox and reads indexes safely", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { host, instance } = await setup();
    const orphan = document.createElement("button");
    orphan.type = "button";
    orphan.setAttribute("data-ok-lightbox-open", "missing");
    host.append(orphan);
    orphan.click();
    expect(warn).toHaveBeenCalled();
    const odd = document.createElement("button");
    odd.type = "button";
    odd.setAttribute("data-ok-lightbox-open", "lightbox-lightbox");
    odd.setAttribute("data-ok-index", "-3");
    host.append(odd);
    odd.click();
    expect(instance.index).toBe(0);
    instance.close();
    odd.removeAttribute("data-ok-index");
    odd.click();
    expect(instance.isOpen).toBe(true);
  });
});
