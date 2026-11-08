import { afterEach, describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { cleanupDom, mount } from "../test-utils.js";
import type { DateRules } from "./calendar.js";
import { calendarWeeks } from "./calendar.js";
import { createCalendarController, focusCalendar } from "./calendar-controller.js";
import { formatIsoDate, isSameMonth, makeDate } from "./dates.js";

afterEach(cleanupDom);

/** A calendar like the components render (the day grid of `month`), with a re-rendering owner. */
function setup(rules: DateRules = {}, initial = makeDate(2025, 4, 20)) {
  const host = mount(`<div data-ok-date-calendar>
      <button data-ok-date-calendar-switch>switch</button>
      <button data-ok-date-calendar-prev>prev</button>
      <button data-ok-date-calendar-next>next</button>
      <div data-ok-view></div>
    </div>`);
  const root = host.firstElementChild as HTMLElement;
  const view = root.querySelector("[data-ok-view]") as HTMLElement;
  const state = {
    focused: initial,
    disabled: false,
    readOnly: false,
    view: "day" as "day" | "month" | "year",
  };
  const log: string[] = [];
  const render = () => {
    view.replaceChildren();
    if (state.view === "day") {
      for (const week of calendarWeeks(state.focused, 0))
        for (const { date, outside } of week) {
          if (outside) continue;
          const button = document.createElement("button");
          button.setAttribute("data-ok-picker-day", "");
          button.setAttribute("data-ok-date", formatIsoDate(date));
          button.tabIndex = formatIsoDate(date) === formatIsoDate(state.focused) ? 0 : -1;
          button.disabled = rules.shouldDisableDate?.(date) === true;
          button.textContent = String(date.getDate());
          view.append(button);
        }
    } else {
      const kind = state.view;
      const values =
        kind === "month" ? [...Array(12).keys()] : [2023, 2024, 2025, 2026, 2027, 2028];
      for (const value of values) {
        const button = document.createElement("button");
        button.setAttribute(`data-ok-picker-${kind}`, "");
        button.setAttribute("data-ok-value", String(value));
        button.disabled = kind === "year" && value === 2026;
        const current = kind === "month" ? state.focused.getMonth() : state.focused.getFullYear();
        button.tabIndex = value === current ? 0 : -1;
        view.append(button);
      }
    }
  };
  render();
  const controller = createCalendarController(root, {
    read: () => ({
      focusedDate: state.focused,
      rules,
      weekStart: 0,
      monthsPerRow: 3,
      yearsPerRow: 3,
      disabled: state.disabled,
      readOnly: state.readOnly,
    }),
    onFocusDate: (date) => {
      log.push(`focus ${formatIsoDate(date)}`);
      const rerender = !isSameMonth(date, state.focused);
      state.focused = date;
      if (rerender) render();
      else
        for (const day of view.querySelectorAll<HTMLElement>("[data-ok-picker-day]"))
          day.tabIndex = day.getAttribute("data-ok-date") === formatIsoDate(date) ? 0 : -1;
      controller.sync();
    },
    onSelectDate: (date) => log.push(`select ${formatIsoDate(date)}`),
    onSelectMonth: (month) => {
      log.push(`month ${month}`);
      state.view = "day";
      state.focused = makeDate(state.focused.getFullYear(), month, 1);
      render();
      controller.sync();
    },
    onSelectYear: (year) => log.push(`year ${year}`),
    onMonthStep: (delta) => log.push(`step ${delta}`),
    onSwitchView: () => log.push("switch"),
    onFocusMonth: (month) => {
      log.push(`focus-month ${month}`);
      state.focused = makeDate(state.focused.getFullYear(), month, 1);
      render();
      controller.sync();
    },
    onFocusYear: (year) => {
      log.push(`focus-year ${year}`);
      state.focused = makeDate(year, 0, 1);
      render();
      controller.sync();
    },
  });
  const show = (kind: "day" | "month" | "year") => {
    state.view = kind;
    render();
  };
  return { root, state, log, controller, show };
}

const focusedDate = () => document.activeElement?.getAttribute("data-ok-date");
const focusedValue = () => document.activeElement?.getAttribute("data-ok-value");

describe("createCalendarController — days", () => {
  it("moves through the grid with arrows, Home / End and Page keys", async () => {
    const { controller } = setup();
    controller.focus();
    expect(focusedDate()).toBe("2025-05-20");
    await userEvent.keyboard("{ArrowRight}");
    expect(focusedDate()).toBe("2025-05-21");
    await userEvent.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(focusedDate()).toBe("2025-05-19");
    await userEvent.keyboard("{ArrowDown}");
    expect(focusedDate()).toBe("2025-05-26");
    await userEvent.keyboard("{ArrowUp}");
    expect(focusedDate()).toBe("2025-05-19");
    await userEvent.keyboard("{Home}");
    expect(focusedDate()).toBe("2025-05-18");
    await userEvent.keyboard("{End}");
    expect(focusedDate()).toBe("2025-05-24");
    await userEvent.keyboard("{PageDown}");
    expect(focusedDate()).toBe("2025-06-24");
    await userEvent.keyboard("{PageUp}");
    expect(focusedDate()).toBe("2025-05-24");
    await userEvent.keyboard("{Shift>}{PageDown}{/Shift}");
    expect(focusedDate()).toBe("2026-05-24");
    await userEvent.keyboard("{Shift>}{PageUp}{/Shift}");
    expect(focusedDate()).toBe("2025-05-24");
    // Other keys are left alone.
    await userEvent.keyboard("{Tab}");
  });

  it("skips disabled days and stays inside the limits", async () => {
    const weekends = (date: Date) => date.getDay() === 0 || date.getDay() === 6;
    const { controller } = setup(
      { shouldDisableDate: weekends, maxDate: makeDate(2025, 4, 30) },
      makeDate(2025, 4, 23),
    );
    controller.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(focusedDate()).toBe("2025-05-26");
    await userEvent.keyboard("{Home}");
    // Sunday is disabled: the next enabled day.
    expect(focusedDate()).toBe("2025-05-26");
    await userEvent.keyboard("{PageDown}");
    // Past the limit: clamped to the max (a Friday).
    expect(focusedDate()).toBe("2025-05-30");
    await userEvent.keyboard("{End}");
    // Saturday 31 is past the max and disabled: back to an enabled day.
    expect(focusedDate()).toBe("2025-05-30");
  });

  it("clamps Page keys below the minimum", async () => {
    const { controller } = setup({ minDate: makeDate(2025, 4, 10) });
    controller.focus();
    await userEvent.keyboard("{PageUp}");
    expect(focusedDate()).toBe("2025-05-10");
  });

  it("reports presses on days and header buttons", async () => {
    const { root, log, state } = setup();
    await userEvent.click(root.querySelector('[data-ok-date="2025-05-03"]') as HTMLElement);
    expect(log).toContain("select 2025-05-03");
    expect(log).toContain("focus 2025-05-03");
    await userEvent.click(root.querySelector("[data-ok-date-calendar-prev]") as HTMLElement);
    await userEvent.click(root.querySelector("[data-ok-date-calendar-next]") as HTMLElement);
    await userEvent.click(root.querySelector("[data-ok-date-calendar-switch]") as HTMLElement);
    expect(log.slice(-3)).toEqual(["step -1", "step 1", "switch"]);
    // Read-only: browsing works, picking doesn't.
    state.readOnly = true;
    log.length = 0;
    await userEvent.click(root.querySelector('[data-ok-date="2025-05-04"]') as HTMLElement);
    expect(log).toEqual(["focus 2025-05-04"]);
    // A click on nothing in particular is ignored.
    root.click();
    expect(log).toEqual(["focus 2025-05-04"]);
  });

  it("disabled: ignores keys and presses", async () => {
    const { root, log, state, controller } = setup();
    state.disabled = true;
    controller.focus();
    await userEvent.keyboard("{ArrowRight}");
    (root.querySelector("[data-ok-date-calendar-next]") as HTMLElement).click();
    expect(log).toEqual([]);
  });

  it("ignores bad dates and keys outside the views", () => {
    const { root, log } = setup();
    const day = root.querySelector('[data-ok-date="2025-05-05"]') as HTMLElement;
    day.setAttribute("data-ok-date", "nope");
    day.click();
    day.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    day.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    (root.querySelector("[data-ok-date-calendar-switch]") as HTMLElement).dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
    );
    expect(log).toEqual([]);
  });
});

describe("createCalendarController — months and years", () => {
  it("moves through months by row and picks one", async () => {
    const { log, show, controller } = setup();
    show("month");
    controller.focus();
    expect(focusedValue()).toBe("4");
    await userEvent.keyboard("{ArrowDown}");
    expect(focusedValue()).toBe("7");
    await userEvent.keyboard("{ArrowLeft}");
    expect(focusedValue()).toBe("6");
    await userEvent.keyboard("{ArrowUp}{ArrowRight}");
    expect(focusedValue()).toBe("4");
    await userEvent.keyboard("{End}");
    expect(focusedValue()).toBe("11");
    await userEvent.keyboard("{Home}");
    expect(focusedValue()).toBe("0");
    await userEvent.keyboard("{ArrowLeft}");
    expect(focusedValue()).toBe("0");
    await userEvent.keyboard("{Enter}");
    expect(log.at(-1)).toBe("month 0");
    // After the pick, focus moves to the day view's focused day.
    expect(focusedDate()).toBe("2025-01-01");
  });

  it("skips disabled years and reports picks", async () => {
    const { log, show, controller, root } = setup();
    show("year");
    controller.focus();
    expect(focusedValue()).toBe("2025");
    await userEvent.keyboard("{ArrowRight}");
    expect(focusedValue()).toBe("2027");
    await userEvent.keyboard("{ArrowUp}");
    expect(focusedValue()).toBe("2024");
    await userEvent.keyboard("{Enter}");
    expect(log.at(-1)).toBe("year 2024");
    await userEvent.keyboard("q");
    expect(log.at(-1)).toBe("year 2024");
    (root.querySelector('[data-ok-value="2026"]') as HTMLElement).click();
    expect(log.at(-1)).toBe("year 2024");
  });

  it("works without focus callbacks, in right-to-left", async () => {
    const host = mount(
      '<div dir="rtl"><button data-ok-picker-year data-ok-value="1" tabindex="0"></button><button data-ok-picker-year data-ok-value="2" tabindex="-1"></button><button data-ok-picker-day data-ok-date="2025-05-20" tabindex="-1"></button></div>',
    );
    const log: string[] = [];
    const controller = createCalendarController(host.firstElementChild as HTMLElement, {
      read: () => ({
        focusedDate: makeDate(2025, 4, 20),
        rules: {},
        weekStart: 0,
        monthsPerRow: 3,
        yearsPerRow: 4,
        disabled: false,
        readOnly: false,
      }),
      onFocusDate: (date) => log.push(formatIsoDate(date)),
      onSelectDate: () => {},
      onSelectMonth: () => {},
      onSelectYear: () => {},
      onMonthStep: () => {},
      onSwitchView: () => {},
    });
    controller.focus();
    await userEvent.keyboard("{ArrowLeft}{ArrowRight}");
    controller.sync();
    controller.sync();
    (host.querySelector("[data-ok-picker-day]") as HTMLElement).focus();
    await userEvent.keyboard("{ArrowLeft}{ArrowRight}");
    expect(log.slice(-2)).toEqual(["2025-05-21", "2025-05-19"]);
    controller.destroy();
    await userEvent.keyboard("{ArrowLeft}");
    expect(log).toHaveLength(3);
  });
});

describe("focusCalendar and edge keys", () => {
  it("falls back to the first enabled item", () => {
    const host = mount(
      '<div><button data-ok-picker-year data-ok-value="1" disabled></button><button data-ok-picker-year data-ok-value="2" tabindex="-1"></button></div>',
    );
    focusCalendar(host.firstElementChild as Element);
    expect(document.activeElement?.getAttribute("data-ok-value")).toBe("2");
  });

  it("End on a disabled last day with nothing after it steps back", async () => {
    const { controller } = setup(
      { maxDate: makeDate(2025, 4, 31), shouldDisableDate: (d) => d.getDate() === 31 },
      makeDate(2025, 4, 26),
    );
    controller.focus();
    await userEvent.keyboard("{End}");
    expect(focusedDate()).toBe("2025-05-30");
  });

  it("End with every month disabled stays put", async () => {
    const { show, controller, root } = setup();
    show("month");
    for (const b of root.querySelectorAll<HTMLButtonElement>("[data-ok-picker-month]"))
      if (b.tabIndex !== 0) b.disabled = true;
    controller.focus();
    await userEvent.keyboard("{End}");
    expect(focusedValue()).toBe("4");
  });
});
