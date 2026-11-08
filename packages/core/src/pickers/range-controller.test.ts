import { afterEach, describe, expect, it } from "vitest";
import { cleanupDom, mount } from "../test-utils.js";
import { formatIsoDate } from "./dates.js";
import type { RangePosition } from "./range.js";
import { createRangeDragController } from "./range-controller.js";

afterEach(() => cleanupDom());

/** Five days in a row; 20 is the start, 23 the end. */
function calendar(options: { oneDay?: boolean; disableDragEditing?: boolean } = {}) {
  const day = (n: number, extra = "") =>
    `<button type="button" data-ok-picker-day data-ok-date="2025-05-${n}" ${extra} style="width:36px;height:36px">${n}</button>`;
  const host = mount(`
    <div data-root style="display:flex">
      ${day(19)}
      ${day(20, options.oneDay ? "data-ok-range-start data-ok-range-end" : "data-ok-range-start")}
      ${day(21)}
      ${day(22, "disabled")}
      ${day(23, options.oneDay ? "" : "data-ok-range-end")}
    </div>`);
  const root = host.querySelector<HTMLElement>("[data-root]") as HTMLElement;
  const state = {
    disabled: false,
    readOnly: false,
    disableDragEditing: options.disableDragEditing ?? false,
  };
  const log: string[] = [];
  const controller = createRangeDragController(root, {
    read: () => state,
    onPreview: (date) => log.push(`preview ${date ? formatIsoDate(date) : null}`),
    onDrag: (date, position: RangePosition) => log.push(`drag ${formatIsoDate(date)} ${position}`),
    onDrop: (date, position: RangePosition) => log.push(`drop ${formatIsoDate(date)} ${position}`),
    onDragEnd: () => log.push("end"),
  });
  const button = (n: number) =>
    root.querySelector<HTMLElement>(`[data-ok-date="2025-05-${n}"]`) as HTMLElement;
  const pointer = (type: string, n: number, init: PointerEventInit = {}) => {
    const target = button(n);
    const rect = target.getBoundingClientRect();
    target.dispatchEvent(
      new PointerEvent(type, {
        bubbles: true,
        cancelable: true,
        pointerId: 7,
        pointerType: "mouse",
        button: 0,
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2,
        ...init,
      }),
    );
  };
  return { root, state, log, controller, pointer, button };
}

describe("createRangeDragController", () => {
  it("previews the hovered day for mice, not for touch", () => {
    const { root, log, pointer } = calendar();
    pointer("pointerover", 21);
    pointer("pointerover", 19, { pointerType: "touch" });
    pointer("pointerover", 22);
    root.dispatchEvent(new PointerEvent("pointerleave"));
    expect(log).toEqual(["preview 2025-05-21", "preview null"]);
  });

  it("drags the start onto another day and swallows the click that follows", () => {
    const { log, pointer, controller } = calendar();
    pointer("pointerdown", 20);
    pointer("pointermove", 20);
    pointer("pointermove", 21);
    pointer("pointermove", 22);
    pointer("pointermove", 19);
    pointer("pointerup", 19);
    expect(log).toEqual([
      "drag 2025-05-21 start",
      "drag 2025-05-19 start",
      "drop 2025-05-19 start",
    ]);
    expect(controller.consumeClick()).toBe(true);
    expect(controller.consumeClick()).toBe(false);
  });

  it("drags the end; a one-day range picks the end by direction", () => {
    const end = calendar();
    end.pointer("pointerdown", 23);
    end.pointer("pointermove", 21);
    end.pointer("pointerup", 21);
    expect(end.log).toEqual(["drag 2025-05-21 end", "drop 2025-05-21 end"]);
    cleanupDom();
    const one = calendar({ oneDay: true });
    one.pointer("pointerdown", 20);
    one.pointer("pointermove", 19);
    one.pointer("pointerup", 19);
    expect(one.log).toEqual(["drag 2025-05-19 start", "drop 2025-05-19 start"]);
    cleanupDom();
    const later = calendar({ oneDay: true });
    later.pointer("pointerdown", 20);
    later.pointer("pointermove", 21);
    later.pointer("pointerup", 21);
    expect(later.log).toEqual(["drag 2025-05-21 end", "drop 2025-05-21 end"]);
  });

  it("ends without a drop when released where it started or canceled", () => {
    const back = calendar();
    back.pointer("pointerdown", 20);
    back.pointer("pointermove", 21);
    back.pointer("pointermove", 20);
    back.pointer("pointerup", 20);
    expect(back.log).toEqual(["drag 2025-05-21 start", "drag 2025-05-20 start", "end"]);
    expect(back.controller.consumeClick()).toBe(true);
    cleanupDom();
    const canceled = calendar();
    canceled.pointer("pointerdown", 20);
    canceled.pointer("pointermove", 21);
    canceled.pointer("pointercancel", 21);
    expect(canceled.log).toEqual(["drag 2025-05-21 start", "end"]);
    cleanupDom();
    const still = calendar();
    still.pointer("pointerdown", 20);
    still.pointer("pointerup", 20);
    expect(still.log).toEqual(["end"]);
    expect(still.controller.consumeClick()).toBe(false);
  });

  it("ignores other pointers, plain days, other buttons and locked calendars", () => {
    const c = calendar();
    c.pointer("pointerdown", 21);
    c.pointer("pointermove", 19);
    c.pointer("pointerdown", 20, { button: 2 });
    c.pointer("pointermove", 19);
    c.pointer("pointerdown", 20);
    c.pointer("pointermove", 19, { pointerId: 8 });
    c.pointer("pointerup", 19, { pointerId: 8 });
    expect(c.log).toEqual([]);
    c.pointer("pointerup", 20);
    c.state.readOnly = true;
    c.pointer("pointerover", 21);
    c.pointer("pointerdown", 20);
    c.pointer("pointermove", 19);
    expect(c.log).toEqual(["end"]);
    cleanupDom();
    const locked = calendar({ disableDragEditing: true });
    locked.pointer("pointerdown", 20);
    locked.pointer("pointermove", 19);
    expect(locked.log).toEqual([]);
  });

  it("forgets a swallowed click on the next key and after destroy stops listening", () => {
    const c = calendar();
    c.pointer("pointerdown", 20);
    c.pointer("pointermove", 21);
    c.pointer("pointerup", 21);
    c.root.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    expect(c.controller.consumeClick()).toBe(false);
    c.controller.destroy();
    c.pointer("pointerover", 21);
    expect(c.log).toEqual(["drag 2025-05-21 start", "drop 2025-05-21 start"]);
  });

  it("keeps the preview while dragging out of the days; ignores other targets and bad dates", () => {
    const c = calendar();
    c.root.insertAdjacentElement(
      "beforeend",
      Object.assign(document.createElement("button"), { type: "button" }),
    );
    const bad = document.createElement("button");
    bad.setAttribute("data-ok-picker-day", "");
    bad.setAttribute("data-ok-date", "bad");
    bad.style.cssText = "width:36px;height:36px";
    c.root.append(bad);
    c.pointer("pointerover", 19);
    (c.root.lastElementChild as HTMLElement).previousElementSibling?.dispatchEvent(
      new PointerEvent("pointerover", { bubbles: true, pointerType: "mouse" }),
    );
    (c.root.lastElementChild as HTMLElement).previousElementSibling?.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true, button: 0, pointerId: 7 }),
    );
    c.pointer("pointerdown", 20);
    c.root.dispatchEvent(new PointerEvent("pointerleave"));
    const rect = bad.getBoundingClientRect();
    c.root.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        pointerId: 7,
        clientX: rect.left + 10,
        clientY: rect.top + 10,
      }),
    );
    c.root.dispatchEvent(
      new PointerEvent("pointermove", { bubbles: true, pointerId: 7, clientX: -50, clientY: -50 }),
    );
    expect(c.log).toEqual(["preview 2025-05-19"]);
  });
});
