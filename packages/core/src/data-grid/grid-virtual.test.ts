import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanupDom, mount } from "../test-utils.js";
import {
  createGridDataSourceCache,
  createGridScrollWatcher,
  gridRowWindow,
  isNearGridScrollEnd,
} from "./grid-virtual.js";

afterEach(() => {
  cleanupDom();
  vi.unstubAllGlobals();
});

describe("gridRowWindow", () => {
  it("renders the visible rows plus the buffer, with spacers", () => {
    expect(gridRowWindow(1000, 50, 0, 500)).toEqual({ start: 0, end: 13, before: 0, after: 49350 });
    expect(gridRowWindow(1000, 50, 5000, 500, 100)).toEqual({
      start: 98,
      end: 112,
      before: 4900,
      after: 44400,
    });
    expect(gridRowWindow(10, 50, 9999, 500)).toEqual({ start: 10, end: 10, before: 500, after: 0 });
  });

  it("renders every row without a row height or rows", () => {
    expect(gridRowWindow(5, 0, 0, 500)).toEqual({ start: 0, end: 5, before: 0, after: 0 });
    expect(gridRowWindow(0, 50, 0, 500)).toEqual({ start: 0, end: 0, before: 0, after: 0 });
  });

  it("near the end within the threshold", () => {
    expect(isNearGridScrollEnd({ scrollTop: 900, clientHeight: 100, scrollHeight: 1050 }, 80)).toBe(
      true,
    );
    expect(isNearGridScrollEnd({ scrollTop: 800, clientHeight: 100, scrollHeight: 1050 }, 80)).toBe(
      false,
    );
  });
});

describe("createGridScrollWatcher", () => {
  const GRID = `<div data-ok-data-grid-main style="height:200px;overflow:auto">
    <div data-ok-data-grid-header style="height:40px">h</div>
    <div data-ok-data-grid-body>${'<div role="row" style="height:50px">r</div>'.repeat(20)}</div>
  </div>`;

  it("measures the rows and the viewport, reports scrolling and the end", async () => {
    const main = mount(GRID).firstElementChild as HTMLElement;
    const onChange = vi.fn();
    const onScrollEnd = vi.fn();
    const watcher = createGridScrollWatcher(main, { onChange, onScrollEnd, threshold: () => 80 });
    watcher.measure();
    expect(onChange).toHaveBeenLastCalledWith({
      offset: 0,
      viewport: 160,
      rowHeight: 50,
      scrolls: true,
      left: 0,
      width: expect.any(Number),
    });
    main.scrollTop = 300;
    main.dispatchEvent(new Event("scroll"));
    expect(onChange).toHaveBeenLastCalledWith({
      offset: 300,
      viewport: 160,
      rowHeight: 50,
      scrolls: true,
      left: 0,
      width: expect.any(Number),
    });
    expect(onScrollEnd).not.toHaveBeenCalled();
    main.scrollTop = main.scrollHeight;
    main.dispatchEvent(new Event("scroll"));
    expect(onScrollEnd).toHaveBeenCalledTimes(1);
    watcher.destroy();
    main.dispatchEvent(new Event("scroll"));
    expect(onScrollEnd).toHaveBeenCalledTimes(1);
  });

  it("measures again when the scroll area resizes", async () => {
    const main = mount(GRID).firstElementChild as HTMLElement;
    const sizes: number[] = [];
    let resized: () => void = () => {};
    const done = new Promise<void>((resolve) => {
      resized = resolve;
    });
    const watcher = createGridScrollWatcher(main, {
      onChange: (viewport) => {
        sizes.push(viewport.viewport);
        if (viewport.viewport === 260) resized();
      },
      onScrollEnd: () => {},
      threshold: () => 80,
    });
    main.style.height = "300px";
    await done;
    expect(sizes.at(-1)).toBe(260);
    watcher.destroy();
  });

  it("keeps the last row height without rows; works without ResizeObserver", () => {
    vi.stubGlobal("ResizeObserver", undefined);
    const main = mount('<div style="height:100px;overflow:auto"></div>')
      .firstElementChild as HTMLElement;
    const onChange = vi.fn();
    createGridScrollWatcher(main, { onChange, onScrollEnd: vi.fn(), threshold: () => 0 }).measure();
    expect(onChange).toHaveBeenLastCalledWith({
      offset: 0,
      viewport: 100,
      rowHeight: 0,
      scrolls: false,
      left: 0,
      width: expect.any(Number),
    });
  });
});

describe("createGridDataSourceCache", () => {
  it("keys responses by request, drops the oldest past the limit, clears", () => {
    const cache = createGridDataSourceCache<number>(2);
    const params = (page: number) => ({
      sortModel: [],
      filterModel: { items: [] },
      paginationModel: { page, pageSize: 10 },
    });
    cache.set(params(0), { rows: [0] });
    cache.set(params(1), { rows: [1], rowCount: 9 });
    cache.set(params(0), { rows: [0, 0] });
    cache.set(params(2), { rows: [2] });
    expect(cache.get(params(1))).toBeUndefined();
    expect(cache.get(params(0))).toEqual({ rows: [0, 0] });
    expect(cache.get(params(2))).toEqual({ rows: [2] });
    cache.clear();
    expect(cache.get(params(2))).toBeUndefined();
  });
});
