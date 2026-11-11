import { afterEach, describe, expect, it, vi } from "vitest";
import {
  centerOrganizationChartNode,
  clampOrganizationChartZoom,
  createOrganizationChartZoom,
  ORGANIZATION_CHART_ZOOM_STEP,
  type OrganizationChartZoomController,
  organizationChartFitZoom,
  organizationChartViewport,
} from "./organization-chart-zoom.js";

/** A 300 × 200 scroll area (or an auto-height one) around a chart whose root node is 600 × 400. */
function mountZoom({ bounded = true, toolbar = true, id = "chart" } = {}) {
  const host = document.createElement("div");
  // Test markup only (library code never uses innerHTML).
  host.innerHTML = `${
    toolbar
      ? `<div data-ok-organization-chart-toolbar="${id}" role="group" aria-label="Zoom"><button type="button" data-ok-organization-chart-zoom-out aria-label="Zoom out"></button><output data-ok-organization-chart-zoom-value></output><button type="button" data-ok-organization-chart-zoom-in aria-label="Zoom in"></button><button type="button" data-ok-organization-chart-fit aria-label="Fit"></button><button type="button" data-ok-organization-chart-reset aria-label="Reset"></button></div>`
      : ""
  }<section data-ok-scrollbar tabindex="0" aria-label="Area" style="width:300px;${bounded ? "height:200px;" : ""}overflow:auto;padding:0"><ul data-ok-organization-chart id="${id}" style="margin:0;padding:0;list-style:none;width:max-content;min-width:100%"><li data-ok-organization-chart-node data-ok-node-id="lead" style="width:600px;height:400px;position:relative"><div data-ok-organization-chart-label>Lead</div><ul data-ok-organization-chart-children style="margin:0;padding:0"><li data-ok-organization-chart-node data-ok-node-id="far" style="position:absolute;left:300px;top:200px"><div data-ok-organization-chart-label style="width:40px;height:20px">Far</div></li></ul></li></ul></section><input aria-label="Field">`;
  document.body.append(host);
  const root = host.querySelector("[data-ok-organization-chart]") as HTMLElement;
  const area = host.querySelector("section") as HTMLElement;
  return { host, root, area };
}

/** Plays the owner: writes the level and tells the controller. */
function own(root: HTMLElement, extra: { enabled?: boolean; min?: number; max?: number } = {}) {
  const asked: number[] = [];
  let controller: OrganizationChartZoomController;
  const write = (level: number) => {
    root.style.zoom = String(level);
    controller.update({ enabled: true, ...extra, zoom: level, onZoom });
  };
  const onZoom = (level: number) => {
    asked.push(level);
    write(level);
  };
  controller = createOrganizationChartZoom(root, { enabled: true, ...extra, onZoom });
  return { controller: () => controller, asked, write };
}

const value = (host: Element) =>
  host.querySelector("[data-ok-organization-chart-zoom-value]")?.textContent;
const button = (host: Element, name: string) =>
  host.querySelector(`[data-ok-organization-chart-${name}]`) as HTMLButtonElement;

afterEach(() => document.body.replaceChildren());

describe("clampOrganizationChartZoom", () => {
  it("clamps to the limits; invalid levels and limits fall back", () => {
    expect(clampOrganizationChartZoom(3)).toBe(2);
    expect(clampOrganizationChartZoom(0.1)).toBe(0.25);
    expect(clampOrganizationChartZoom(Number.NaN)).toBe(1);
    expect(clampOrganizationChartZoom(-1)).toBe(1);
    expect(clampOrganizationChartZoom(5, 0.5, 4)).toBe(4);
    expect(clampOrganizationChartZoom(0.1, -1, Number.NaN)).toBe(0.25);
    expect(clampOrganizationChartZoom(1.123456)).toBe(1.1235);
  });
});

describe("organizationChartViewport", () => {
  it("is the nearest scrolling ancestor, or null when the page scrolls", () => {
    const { root, area } = mountZoom();
    expect(organizationChartViewport(root)).toBe(area);
    const loose = document.createElement("ul");
    document.body.append(loose);
    expect(organizationChartViewport(loose)).toBeNull();
  });
});

describe("organizationChartFitZoom", () => {
  it("fits width and height in a bounded area, width only in a growing one, never above 1", () => {
    const { root } = mountZoom();
    expect(organizationChartFitZoom(root)).toBe(0.5);
    // Already zoomed: measured in unzoomed px.
    root.style.zoom = "2";
    expect(organizationChartFitZoom(root)).toBe(0.5);
    expect(root.style.zoom).toBe("2");
    document.body.replaceChildren();
    const loose = mountZoom({ bounded: false });
    expect(organizationChartFitZoom(loose.root)).toBe(0.5);
    (loose.root.firstElementChild as HTMLElement).style.width = "100px";
    expect(organizationChartFitZoom(loose.root)).toBe(1);
    expect(organizationChartFitZoom(loose.root, 0.25, 0.8)).toBe(0.8);
  });

  it("without a scroll area: the container's width; empty charts fit at 1", () => {
    const { root, area } = mountZoom();
    area.style.overflow = "visible";
    area.style.width = "150px";
    expect(organizationChartFitZoom(root)).toBe(0.25);
    root.replaceChildren();
    expect(organizationChartFitZoom(root)).toBe(1);
    const flat = mountZoom();
    (flat.root.firstElementChild as HTMLElement).style.height = "0";
    (flat.root.firstElementChild as HTMLElement).replaceChildren();
    expect(organizationChartFitZoom(flat.root)).toBe(1);
  });
});

describe("createOrganizationChartZoom", () => {
  it("toolbar: zoom in and out by a step, fit, reset, the value and the limits", () => {
    const { host, root, area } = mountZoom();
    const { asked } = own(root);
    expect(value(host)).toBe("100%");
    button(host, "zoom-in").click();
    expect(asked).toEqual([ORGANIZATION_CHART_ZOOM_STEP]);
    expect(value(host)).toBe("125%");
    button(host, "zoom-out").click();
    expect(asked.at(-1)).toBe(1);
    // At the top limit, zoom in is aria-disabled and does nothing.
    for (let i = 0; i < 6; i++) button(host, "zoom-in").click();
    expect(asked.at(-1)).toBe(2);
    expect(button(host, "zoom-in").getAttribute("aria-disabled")).toBe("true");
    const count = asked.length;
    button(host, "zoom-in").click();
    expect(asked).toHaveLength(count);
    // Fit scrolls to the start.
    area.scrollLeft = 200;
    button(host, "fit").click();
    expect(asked.at(-1)).toBe(0.5);
    expect(area.scrollLeft).toBe(0);
    expect(button(host, "zoom-in").hasAttribute("aria-disabled")).toBe(false);
    button(host, "reset").click();
    expect(asked.at(-1)).toBe(1);
    for (let i = 0; i < 8; i++) button(host, "zoom-out").click();
    expect(button(host, "zoom-out").getAttribute("aria-disabled")).toBe("true");
    // Clicks between the buttons, and other charts' toolbars, do nothing.
    const before = asked.length;
    (host.querySelector("output") as HTMLElement).click();
    host
      .querySelector("[data-ok-organization-chart-toolbar]")
      ?.setAttribute("data-ok-organization-chart-toolbar", "other");
    button(host, "reset").click();
    expect(asked).toHaveLength(before);
  });

  it("keeps the content at the viewport's center in place", () => {
    const { root, area } = mountZoom();
    const { controller, write } = own(root);
    const viewBox = area.getBoundingClientRect();
    const centerX = viewBox.left + area.clientWidth / 2;
    const point = () =>
      (centerX - (root.firstElementChild as Element).getBoundingClientRect().left) /
      Number(root.style.zoom || 1);
    area.scrollLeft = 100;
    const before = point();
    write(controller().plan(2));
    expect(point()).toBeCloseTo(before, 0);
    expect(area.scrollLeft).toBeGreaterThan(100);
  });

  it("Ctrl or Command + wheel zooms at the pointer and is always prevented; a plain wheel scrolls", () => {
    const { root, area } = mountZoom();
    const { asked } = own(root);
    const wheel = (init: WheelEventInit) => {
      const event = new WheelEvent("wheel", { bubbles: true, cancelable: true, ...init });
      area.dispatchEvent(event);
      return event;
    };
    expect(wheel({ deltaY: -100 }).defaultPrevented).toBe(false);
    expect(asked).toEqual([]);
    expect(wheel({ deltaY: -100, ctrlKey: true, clientX: 10, clientY: 10 }).defaultPrevented).toBe(
      true,
    );
    expect(asked[0]).toBeGreaterThan(1);
    wheel({ deltaY: 3, deltaMode: 1, metaKey: true });
    wheel({ deltaY: 1, deltaMode: 2, ctrlKey: true });
    expect(asked.at(-1)).toBeLessThan(1);
    // At a limit nothing is asked, but the page still doesn't zoom.
    for (let i = 0; i < 20; i++) wheel({ deltaY: 500, ctrlKey: true });
    const count = asked.length;
    expect(wheel({ deltaY: 500, ctrlKey: true }).defaultPrevented).toBe(true);
    expect(asked).toHaveLength(count);
  });

  it("WebKit pinches (gesture events) scale from the level at their start", () => {
    const { root, area } = mountZoom();
    const { asked } = own(root);
    const gesture = (type: string, extra: Record<string, number> = {}) => {
      const event = Object.assign(new Event(type, { bubbles: true, cancelable: true }), extra);
      area.dispatchEvent(event);
      return event;
    };
    expect(gesture("gesturestart").defaultPrevented).toBe(true);
    gesture("gesturechange", { scale: 1.5, clientX: 20, clientY: 20 });
    expect(asked).toEqual([1.5]);
    gesture("gesturechange", { scale: 1.6 });
    expect(asked.at(-1)).toBe(1.6);
    gesture("gesturechange");
    expect(asked).toHaveLength(2);
  });

  it("keys: + / = zoom in, − zooms out, 0 resets; not with modifiers or in widgets", () => {
    const { host, root, area } = mountZoom();
    const { asked } = own(root);
    const key = (target: Element, init: KeyboardEventInit) => {
      const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, ...init });
      target.dispatchEvent(event);
      return event;
    };
    expect(key(area, { key: "+" }).defaultPrevented).toBe(true);
    key(root, { key: "=" });
    key(area, { key: "-" });
    expect(asked).toEqual([1.25, 1.5625, 1.25]);
    key(area, { key: "0" });
    expect(asked.at(-1)).toBe(1);
    key(area, { key: "_" });
    expect(asked.at(-1)).toBe(0.8);
    const count = asked.length;
    key(area, { key: "+", ctrlKey: true });
    key(area, { key: "x" });
    const field = document.createElement("input");
    root.querySelector("[data-ok-organization-chart-label]")?.append(field);
    key(field, { key: "+" });
    const prevented = new KeyboardEvent("keydown", { key: "+", bubbles: true, cancelable: true });
    prevented.preventDefault();
    area.dispatchEvent(prevented);
    // Outside the chart and its area: the page's keys.
    key(host.querySelector("body > div > input") ?? document.body, { key: "+" });
    expect(asked).toHaveLength(count);
  });

  it("keys still zoom from a node of the chart's own tree (ADR-0063), not inside another tree", () => {
    const { root } = mountZoom();
    const { asked } = own(root);
    root.setAttribute("role", "tree");
    const node = root.querySelector("[data-ok-organization-chart-node]") as HTMLElement;
    node.setAttribute("role", "treeitem");
    node.dispatchEvent(new KeyboardEvent("keydown", { key: "+", bubbles: true, cancelable: true }));
    expect(asked).toEqual([1.25]);
    const other = document.createElement("div");
    other.setAttribute("role", "tree");
    const item = document.createElement("span");
    other.append(item);
    root.querySelector("[data-ok-organization-chart-label]")?.append(other);
    item.dispatchEvent(new KeyboardEvent("keydown", { key: "+", bubbles: true, cancelable: true }));
    expect(asked).toEqual([1.25]);
  });

  it("a mouse drag pans the area and swallows the click that ends it", () => {
    const { root, area } = mountZoom();
    own(root);
    const label = root.querySelector("[data-ok-organization-chart-label]") as HTMLElement;
    const pointer = (type: string, init: PointerEventInit) =>
      label.dispatchEvent(
        new PointerEvent(type, {
          bubbles: true,
          cancelable: true,
          pointerId: 1,
          pointerType: "mouse",
          ...init,
        }),
      );
    pointer("pointerdown", { clientX: 100, clientY: 100, button: 0 });
    pointer("pointermove", { clientX: 98, clientY: 99 });
    expect(root.hasAttribute("data-ok-panning")).toBe(false);
    pointer("pointermove", { clientX: 60, clientY: 70 });
    expect(root.hasAttribute("data-ok-panning")).toBe(true);
    expect(area.scrollLeft).toBe(40);
    expect(area.scrollTop).toBe(30);
    pointer("pointermove", { clientX: 50, clientY: 70, pointerId: 2 });
    expect(area.scrollLeft).toBe(40);
    pointer("pointerup", { clientX: 60, clientY: 70 });
    expect(root.hasAttribute("data-ok-panning")).toBe(false);
    const click = new MouseEvent("click", { bubbles: true, cancelable: true });
    label.dispatchEvent(click);
    expect(click.defaultPrevented).toBe(true);
    const next = new MouseEvent("click", { bubbles: true, cancelable: true });
    label.dispatchEvent(next);
    expect(next.defaultPrevented).toBe(false);
  });

  it("drags never start on buttons, with touch or another button; a press without a move clicks", async () => {
    const { root, area } = mountZoom();
    own(root);
    const label = root.querySelector("[data-ok-organization-chart-label]") as HTMLElement;
    const inner = document.createElement("button");
    inner.type = "button";
    inner.textContent = "Menu";
    label.append(inner);
    const drag = (target: Element, init: PointerEventInit) => {
      const base = { bubbles: true, pointerId: 3, button: 0, pointerType: "mouse", ...init };
      target.dispatchEvent(
        new PointerEvent("pointerdown", { ...base, clientX: 100, clientY: 100 }),
      );
      target.dispatchEvent(new PointerEvent("pointermove", { ...base, clientX: 50, clientY: 50 }));
      target.dispatchEvent(new PointerEvent("pointercancel", base));
    };
    drag(inner, {});
    drag(label, { pointerType: "touch" });
    drag(label, { button: 2 });
    expect(area.scrollLeft).toBe(0);
    label.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true, pointerId: 4, pointerType: "mouse" }),
    );
    label.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, pointerId: 4 }));
    const click = new MouseEvent("click", { bubbles: true, cancelable: true });
    label.dispatchEvent(click);
    expect(click.defaultPrevented).toBe(false);
    // An abandoned pan's guard goes after a task.
    drag(label, {});
    await new Promise((resolve) => setTimeout(resolve, 0));
    const late = new MouseEvent("click", { bubbles: true, cancelable: true });
    label.dispatchEvent(late);
    expect(late.defaultPrevented).toBe(false);
  });

  it("does nothing while off; turning off removes the listeners; plan at the shown level", () => {
    const { host, root, area } = mountZoom({ id: "" });
    const onZoom = vi.fn();
    const controller = createOrganizationChartZoom(root, { onZoom });
    area.dispatchEvent(new WheelEvent("wheel", { ctrlKey: true, deltaY: -100, bubbles: true }));
    area.dispatchEvent(new KeyboardEvent("keydown", { key: "+", bubbles: true }));
    expect(onZoom).not.toHaveBeenCalled();
    // No id: the toolbar isn't this chart's.
    expect(value(host)).toBe("");
    controller.update({ enabled: true, onZoom });
    area.dispatchEvent(new KeyboardEvent("keydown", { key: "+", bubbles: true }));
    expect(onZoom).toHaveBeenCalledWith(1.25);
    controller.update({ enabled: false, onZoom });
    area.dispatchEvent(new KeyboardEvent("keydown", { key: "+", bubbles: true }));
    expect(onZoom).toHaveBeenCalledTimes(1);
    area.scrollLeft = 50;
    expect(controller.plan(1, { start: true })).toBe(1);
    expect(area.scrollLeft).toBe(0);
    // A planned level that never comes: the next update at another level doesn't scroll for it.
    controller.plan(2, { anchor: { x: 0, y: 0 } });
    controller.update({ zoom: 1.5 });
    expect(controller.fit()).toBe(0.5);
    controller.sync();
    controller.destroy();
    controller.destroy();
  });

  it("toolbars without a value or buttons are fine; the page scrolls without an area", () => {
    const { root, host } = mountZoom();
    host.querySelector("output")?.remove();
    button(host, "zoom-out").remove();
    own(root).controller().sync();
    const loose = document.createElement("ul");
    loose.setAttribute("data-ok-organization-chart", "");
    loose.innerHTML =
      "<li data-ok-organization-chart-node><div data-ok-organization-chart-label>Only</div></li>";
    document.body.append(loose);
    const scroll = vi.spyOn(window, "scrollBy");
    const controller = createOrganizationChartZoom(loose, { enabled: true, onZoom: vi.fn() });
    controller.plan(1.5);
    controller.update({ enabled: true, zoom: 1.5 });
    expect(scroll).toHaveBeenCalled();
    loose.dispatchEvent(new KeyboardEvent("keydown", { key: "0", bubbles: true }));
    controller.destroy();
    scroll.mockRestore();
  });
});

describe("centerOrganizationChartNode", () => {
  it("centers a label in the scroll area after its ancestors' animations", async () => {
    const { root, area } = mountZoom();
    const far = root.querySelector('[data-ok-node-id="far"]') as HTMLElement;
    await centerOrganizationChartNode(far);
    const box = area.getBoundingClientRect();
    // Smooth or not, the target is the label's center (finish a smooth scroll first).
    await new Promise((resolve) => setTimeout(resolve, 600));
    const now = (far.firstElementChild as Element).getBoundingClientRect();
    expect(Math.abs(now.left + now.width / 2 - (box.left + area.clientWidth / 2))).toBeLessThan(2);
    expect(Math.abs(now.top + now.height / 2 - (box.top + area.clientHeight / 2))).toBeLessThan(2);
  });

  it("without an area the page scrolls; detached nodes do nothing", async () => {
    const { root, area } = mountZoom();
    area.style.overflow = "visible";
    const scroll = vi.spyOn(window, "scrollBy");
    await centerOrganizationChartNode(root.querySelector('[data-ok-node-id="far"]') as HTMLElement);
    expect(scroll).toHaveBeenCalled();
    scroll.mockClear();
    const gone = root.querySelector('[data-ok-node-id="far"]') as HTMLElement;
    gone.remove();
    await centerOrganizationChartNode(gone);
    expect(scroll).not.toHaveBeenCalled();
    scroll.mockRestore();
  });
});

describe("organization chart zoom: edges", () => {
  it("detached charts: no viewport, level 1, fit 1", () => {
    const root = document.createElement("ul");
    root.setAttribute("data-ok-organization-chart", "");
    const node = document.createElement("li");
    root.append(node);
    const holder = document.createElement("div");
    holder.append(root);
    expect(organizationChartViewport(root)).toBeNull();
    expect(organizationChartFitZoom(root)).toBe(1);
  });

  it("plans against an empty root; skips other charts' toolbars; a long drag keeps panning", () => {
    const { host, root, area } = mountZoom();
    const other = document.createElement("div");
    other.setAttribute("data-ok-organization-chart-toolbar", "another");
    other.innerHTML = "<output data-ok-organization-chart-zoom-value></output>";
    host.prepend(other);
    const { controller } = own(root);
    expect(other.textContent).toBe("");
    const label = root.querySelector("[data-ok-organization-chart-label]") as HTMLElement;
    const pointer = (type: string, x: number) =>
      label.dispatchEvent(
        new PointerEvent(type, { bubbles: true, pointerId: 7, pointerType: "mouse", clientX: x }),
      );
    pointer("pointerdown", 200);
    pointer("pointermove", 180);
    pointer("pointermove", 150);
    expect(area.scrollLeft).toBe(50);
    pointer("pointerup", 150);
    root.replaceChildren();
    expect(controller().plan(1.5)).toBe(1.5);
  });

  it("toolbar clicks without a chart id do nothing", () => {
    const { host, root } = mountZoom({ id: "" });
    const onZoom = vi.fn();
    createOrganizationChartZoom(root, { enabled: true, onZoom });
    button(host, "zoom-in").click();
    expect(onZoom).not.toHaveBeenCalled();
  });

  it("centerOnNode waits for the ancestors' animations, and jumps with reduced motion", async () => {
    const { root, area } = mountZoom();
    const far = root.querySelector('[data-ok-node-id="far"]') as HTMLElement;
    const list = far.parentElement as HTMLElement;
    const running = list.animate([{ opacity: 0 }, { opacity: 1 }], 40);
    const cancelled = list.animate([{ opacity: 0 }, { opacity: 1 }], 1000);
    setTimeout(() => cancelled.cancel(), 40);
    const media = vi
      .spyOn(window, "matchMedia")
      .mockReturnValue({ matches: true } as MediaQueryList);
    await centerOrganizationChartNode(far);
    expect(running.playState).toBe("finished");
    // Reduced motion: the scroll is done at once.
    const label = (far.firstElementChild as Element).getBoundingClientRect();
    const box = area.getBoundingClientRect();
    expect(Math.abs(label.left + label.width / 2 - (box.left + area.clientWidth / 2))).toBeLessThan(
      2,
    );
    media.mockRestore();
    // A node outside any chart, without a label or in a detached chart does nothing.
    far.firstElementChild?.remove();
    await centerOrganizationChartNode(far);
    root.remove();
    await centerOrganizationChartNode(far);
    await centerOrganizationChartNode(document.createElement("li"));
  });
});
