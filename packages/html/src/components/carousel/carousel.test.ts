import { carouselOptions } from "@owlky/core";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { createRuntime } from "../../runtime/runtime.js";
import type { Runtime } from "../../runtime/types.js";
import {
  expectCspSafe,
  expectNamedButtons,
  expectNoAxeViolations,
  mount,
  resetPage,
  settle,
} from "../../test-utils.js";
import { components } from "../index.js";
import type { CarouselInstance } from "./carousel.js";

const snippets = Object.entries(
  import.meta.glob("./examples/*.html", { query: "?raw", import: "default", eager: true }),
) as [string, string][];

/** Story images live in Storybook's static folder: tests use an inline pixel instead. */
const PICTURE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'/%3E";
const local = (html: string) => html.replaceAll(/src="carousel\/[^"]+"/g, `src="${PICTURE}"`);

let runtime: Runtime | undefined;
let parking: HTMLElement;
beforeEach(async () => {
  parking = document.createElement("div");
  parking.style.cssText = "position:fixed;right:0;bottom:0;width:8px;height:8px";
  document.body.append(parking);
  await userEvent.hover(parking);
});
afterEach(() => {
  runtime?.stop();
  runtime = undefined;
  resetPage();
});

const start = () => {
  runtime = createRuntime()
    .register(...components)
    .start();
  return runtime;
};
const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));

const markup = (attrs = "", dots = 4, count = 4, dotText = false) => `
  <div style="width:400px">
    <section data-ok-carousel aria-roledescription="carousel" aria-label="Test" data-ok-align="start" data-ok-duration="0" data-ok-slides-to-show="2" ${attrs}>
      <div data-ok-carousel-viewport tabindex="0">
        <div data-ok-carousel-container>
          ${Array.from({ length: count }, (_, i) => `<div role="group" aria-roledescription="slide" aria-label="${i + 1} of ${count}" data-ok-carousel-slide><div style="height:50px">Slide ${i + 1}</div></div>`).join("")}
        </div>
        <span data-ok-carousel-live aria-live="polite" aria-atomic="true"></span>
      </div>
      <div data-ok-carousel-arrows data-ok-variant="number" data-ok-color="inherit">
        <button type="button" data-ok-icon-button data-ok-carousel-prev aria-label="Previous slide"></button>
        <span data-ok-carousel-counter>1/${dots}</span>
        <button type="button" data-ok-icon-button data-ok-carousel-next aria-label="Next slide"></button>
      </div>
      <div data-ok-carousel-dots data-ok-variant="circular" data-ok-color="inherit">
        ${Array.from({ length: dots }, (_, i) => `<button type="button" data-ok-carousel-dot aria-label="Show ${i + 1}">${dotText ? i + 1 : ""}</button>`).join("")}
      </div>
    </section>
  </div>`;

const rootOf = (host: Element) => host.querySelector("[data-ok-carousel]") as HTMLElement;
const dotsOf = (host: Element) => [...host.querySelectorAll<HTMLElement>("[data-ok-carousel-dot]")];
const instance = (host: Element) =>
  runtime?.get<CarouselInstance>(rootOf(host), "carousel") as CarouselInstance;

describe("carousel snippets", () => {
  it("covers every story", () => expect(snippets).toHaveLength(19));

  it.each(snippets)("%s: valid anatomy, CSP-safe, accessible", async (_, html) => {
    const host = mount(local(html));
    expectCspSafe(host, html);
    expectNamedButtons(host);
    for (const root of host.querySelectorAll<HTMLElement>("[data-ok-carousel]")) {
      expect(root.tagName).toBe("SECTION");
      expect(root.getAttribute("aria-roledescription")).toBe("carousel");
      expect(root.getAttribute("aria-label")).toBeTruthy();
      expect(carouselOptions.options.effect.values).toContain(root.dataset["okEffect"]);
      for (const slide of root.querySelectorAll("[data-ok-carousel-slide]")) {
        expect(slide.getAttribute("role")).toBe("group");
        expect(slide.getAttribute("aria-roledescription")).toBe("slide");
        expect(slide.getAttribute("aria-label")).toMatch(/^\d+ of \d+$/);
      }
    }
    start();
    await settle();
    await nextFrame();
    expect(host.querySelector("[data-ok-carousel][data-ok-ready]")).not.toBeNull();
    // Motion entrances of slides out of view wait for their slide: end them for the scan.
    for (const animation of document.getAnimations()) animation.finish();
    await expectNoAxeViolations(host);
  });
});

describe("carousel runtime", () => {
  it("mounts, moves and emits events", async () => {
    const host = mount(markup());
    const root = rootOf(host);
    const events: string[] = [];
    for (const type of ["select", "settle", "scroll", "reinit", "slidesinview"]) {
      root.addEventListener(`ok:carousel:${type}`, (event) =>
        events.push(`${type}:${JSON.stringify((event as CustomEvent).detail)}`),
      );
    }
    start();
    await settle();
    const api = instance(host);
    expect(api.scrollSnapList()).toEqual([0, 0.5, 1]);
    api.scrollNext(true);
    expect(api.selectedScrollSnap()).toBe(1);
    expect(events).toContain('select:{"index":1,"previous":0}');
    expect(events).toContain('settle:{"index":1}');
    expect(events.some((e) => e.startsWith("scroll:"))).toBe(true);
    expect(host.querySelector("[data-ok-carousel-counter]")?.textContent).toBe("2/3");
    await userEvent.click(host.querySelector("[data-ok-carousel-prev]") as HTMLElement);
    expect(api.selectedScrollSnap()).toBe(0);
    await nextFrame();
    expect(events.some((e) => e.startsWith("slidesinview:"))).toBe(true);
  });

  it("keeps one dot per snap", async () => {
    const host = mount(markup("", 4, 4, true));
    start();
    await settle();
    // Two slides per view: three snaps.
    expect(dotsOf(host)).toHaveLength(3);
    const root = rootOf(host);
    root.setAttribute("data-ok-slides-to-scroll", "1");
    root.setAttribute("data-ok-align", "center");
    root.setAttribute("data-ok-contain-scroll", "keepSnaps");
    await settle();
    await nextFrame();
    expect(dotsOf(host)).toHaveLength(4);
    const last = dotsOf(host)[3] as HTMLElement;
    expect(last.getAttribute("aria-label")).toBe("Show 4");
    expect(last.textContent).toBe("4");
    expect(last.hasAttribute("aria-current")).toBe(false);
  });

  it("creates dots from nothing and renumbers labels without digits", async () => {
    const host = mount(markup("", 0));
    const group = host.querySelector("[data-ok-carousel-dots]") as HTMLElement;
    start();
    await settle();
    expect(dotsOf(host)).toHaveLength(3);
    expect(dotsOf(host)[2]?.getAttribute("aria-label")).toBe("Go to slide 3");
    expect(dotsOf(host)[0]?.getAttribute("type")).toBe("button");
    group.replaceChildren();
    const plain = document.createElement("button");
    plain.setAttribute("data-ok-carousel-dot", "");
    plain.setAttribute("aria-label", "Slide");
    group.append(plain);
    rootOf(host).setAttribute("data-ok-slides-to-scroll", "2");
    await settle();
    await nextFrame();
    expect(dotsOf(host).map((d) => d.getAttribute("aria-label"))).toEqual(["Slide", "Slide 2"]);
  });

  it("writes slide sizes from the attributes", async () => {
    const host = mount(
      markup(
        'data-ok-slides-to-show="2" data-ok-slides-to-show-md="70%" data-ok-slide-spacing="8"',
      ),
    );
    start();
    await settle();
    const root = rootOf(host);
    expect(root.style.getPropertyValue("--_ok-carousel-basis-xs")).toContain("calc(");
    expect(root.style.getPropertyValue("--_ok-carousel-basis-md")).toBe("70%");
    expect(root.style.getPropertyValue("--_ok-carousel-spacing")).toBe("8px");
    root.setAttribute("data-ok-slides-to-show", "bad");
    root.removeAttribute("data-ok-slide-spacing");
    await settle();
    expect(root.style.getPropertyValue("--_ok-carousel-basis-xs")).toBe("");
    expect(root.style.getPropertyValue("--_ok-carousel-spacing")).toBe("");
    runtime?.destroy(host);
    expect(root.style.getPropertyValue("--_ok-carousel-basis-md")).toBe("");
    expect(root.hasAttribute("data-ok-ready")).toBe(false);
  });

  it("reports autoplay, auto scroll, focus and pointers", async () => {
    const host = mount(
      markup(
        'data-ok-autoplay data-ok-play-on-init="false" data-ok-auto-scroll data-ok-auto-scroll-start-delay="5000"',
        4,
        4,
      ).replace(
        /<div style="height:50px">Slide (\d)<\/div>/g,
        '<button type="button">Item $1</button>',
      ),
    );
    const root = rootOf(host);
    const events: string[] = [];
    for (const type of ["autoplay", "autoscroll", "slidefocus", "pointerdown", "pointerup"]) {
      root.addEventListener(`ok:carousel:${type}`, (event) =>
        events.push(`${type}:${JSON.stringify((event as CustomEvent).detail ?? null)}`),
      );
    }
    start();
    await settle();
    const api = instance(host);
    api.autoplay.play();
    api.autoScroll.play(5000);
    expect(events).toEqual([
      'autoplay:{"playing":true}',
      'autoplay:{"playing":false}',
      'autoscroll:{"playing":true}',
    ]);
    (host.querySelector("[data-ok-carousel-viewport]") as HTMLElement).focus();
    await userEvent.tab();
    expect(events).toContain('slidefocus:{"index":0}');
    await userEvent.click(host.querySelector("[data-ok-carousel-slide] button") as HTMLElement);
    expect(events).toContain("pointerdown:null");
    expect(events).toContain("pointerup:null");
  });

  it("works next to a React-rendered carousel and with two runtimes", async () => {
    const host = mount(
      markup() + markup().replace("data-ok-carousel ", 'data-ok-carousel data-ok-runtime="off" '),
    );
    start();
    await settle();
    const roots = host.querySelectorAll<HTMLElement>("[data-ok-carousel]");
    expect(roots[0]?.hasAttribute("data-ok-ready")).toBe(true);
    expect(roots[1]?.hasAttribute("data-ok-ready")).toBe(false);
  });

  it("leaves the dots of a nested carousel to it", async () => {
    const inner = markup("", 1, 6).replace('aria-label="Test"', 'aria-label="Inner"');
    const host = mount(markup().replace("Slide 1</div>", `Slide 1</div>${inner}`));
    start();
    await settle();
    const outer = host.querySelector(`[aria-label="Test"] > [data-ok-carousel-dots]`);
    const nested = host.querySelector(`[aria-label="Inner"] > [data-ok-carousel-dots]`);
    expect(outer?.querySelectorAll("[data-ok-carousel-dot]").length).toBe(3);
    expect(nested?.querySelectorAll("[data-ok-carousel-dot]").length).toBe(5);
  });

  it("ignores hostile attributes", async () => {
    const host = mount(
      markup(
        `data-ok-slides-to-show='"><img src=x onerror=alert(1)>' data-ok-breakpoints='{"__proto__":{"loop":true}}' data-ok-align="../x"`,
      ),
    );
    start();
    await settle();
    expect(({} as Record<string, unknown>)["loop"]).toBeUndefined();
    expect(host.querySelector("img")).toBeNull();
    expect(instance(host).scrollSnapList().length).toBeGreaterThan(0);
  });
});
