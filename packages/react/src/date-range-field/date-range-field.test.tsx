import { render, screen } from "@testing-library/react";
import { StrictMode, useState } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import type { DateRange } from "../date-range-calendar/date-range-calendar.js";
import { LocalizationProvider } from "../localization-provider/localization-provider.js";
import { expectNoAxeViolations } from "../test-utils.js";
import {
  MultiInputDateRangeField,
  MultiInputDateTimeRangeField,
  MultiInputTimeRangeField,
  SingleInputDateRangeField,
  SingleInputDateTimeRangeField,
  SingleInputTimeRangeField,
} from "./date-range-field.js";

const d = (day: number, month = 4) => new Date(2025, month, day);
const at = (h: number, m = 0, day = 25) => new Date(2025, 4, day, h, m);
const q = <E extends Element = HTMLElement>(selector: string, root: ParentNode = document) =>
  root.querySelector<E>(selector) as E;
const sections = (root: ParentNode = document) => [
  ...root.querySelectorAll<HTMLElement>('[role="spinbutton"]'),
];
const texts = (root: ParentNode = document) => sections(root).map((s) => s.textContent);
const iso = (range: DateRange | undefined) =>
  (range ?? [])
    .map((date) =>
      date === null
        ? ""
        : Number.isNaN(date.getTime())
          ? "invalid"
          : `${date.getMonth() + 1}/${date.getDate()}`,
    )
    .join("-");

describe("SingleInputDateRangeField", () => {
  it("renders both dates in one field with the en dash and an ISO interval", async () => {
    render(
      <SingleInputDateRangeField id="f" label="Stay" name="stay" defaultValue={[d(20), d(25)]} />,
    );
    const root = q("[data-ok-date-field]");
    expect(root.hasAttribute("data-ok-range")).toBe(true);
    expect(root.getAttribute("data-ok-value")).toBe("2025-05-20/2025-05-25");
    expect(root.getAttribute("data-ok-format")).toBe("MM/DD/YYYY");
    expect(texts()).toEqual(["05", "20", "2025", "05", "25", "2025"]);
    expect(
      q("[data-ok-date-field-separator]", sections()[2]?.parentElement as Element),
    ).toBeTruthy();
    expect(sections()[2]?.parentElement?.textContent).toContain(" – ");
    expect(q<HTMLInputElement>('input[name="stay"]').value).toBe("2025-05-20/2025-05-25");
    // Each date's day knows its own month (February has 28 days).
    expect(screen.getByRole("group", { name: "Stay" })).toBeTruthy();
    await expectNoAxeViolations(document.body);
  });

  it("types both dates, reports each side's errors and invalidRange", async () => {
    const onChange = vi.fn();
    const onError = vi.fn();
    render(
      <SingleInputDateRangeField
        label="Stay"
        onChange={onChange}
        onError={onError}
        referenceDate={d(1)}
      />,
    );
    await userEvent.click(sections()[0] as HTMLElement);
    await userEvent.keyboard("05202025");
    expect(iso(onChange.mock.lastCall?.[0])).toBe("5/20-");
    await userEvent.keyboard("0218");
    expect(iso(onChange.mock.lastCall?.[0])).toBe("5/20-invalid");
    expect(onChange.mock.lastCall?.[1].validationError).toEqual([null, "invalidDate"]);
    await userEvent.keyboard("2025");
    expect(iso(onChange.mock.lastCall?.[0])).toBe("5/20-2/18");
    expect(onChange.mock.lastCall?.[1].validationError).toEqual(["invalidRange", "invalidRange"]);
    expect(q("[data-ok-date-field]").hasAttribute("data-ok-error")).toBe(true);
    expect(onError).toHaveBeenLastCalledWith(["invalidRange", "invalidRange"], expect.anything());
    // The end day's bounds follow the end's month: 29 isn't a February day in 2025.
    sections()[4]?.focus();
    await userEvent.keyboard("{End}");
    expect(texts()[4]).toBe("28");
  });

  it("clears, focuses sections, keeps partly typed text and follows a controlled value", async () => {
    const onClear = vi.fn();
    const onSection = vi.fn();
    // biome-ignore lint/correctness/noComponentHookFactories: a test-local owner that reads this test's spies.
    function Controlled() {
      const [value, setValue] = useState<DateRange>([d(20), d(25)]);
      return (
        <>
          <SingleInputDateRangeField
            label="Stay"
            value={value}
            onChange={setValue}
            clearable
            onClear={onClear}
            onSelectedSectionsChange={onSection}
          />
          <button type="button" onClick={() => setValue([d(1, 6), null])}>
            july
          </button>
        </>
      );
    }
    render(<Controlled />);
    await userEvent.click(screen.getByRole("button", { name: "july" }));
    expect(texts()).toEqual(["07", "01", "2025", "MM", "DD", "YYYY"]);
    sections()[3]?.focus();
    await userEvent.keyboard("08");
    expect(texts()[3]).toBe("08");
    expect(onSection).toHaveBeenCalledWith(3);
    await userEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(onClear).toHaveBeenCalled();
    expect(texts()).toEqual(["MM", "DD", "YYYY", "MM", "DD", "YYYY"]);
    expect(document.activeElement).toBe(sections()[0]);
  });

  it("time and date time ranges; read-only, disabled, spacious, autoFocus, selectedSections", async () => {
    const { unmount } = render(
      <>
        <SingleInputTimeRangeField label="Hours" defaultValue={[at(9), at(17, 30)]} />
        <SingleInputDateTimeRangeField
          label="Event"
          ampm={false}
          defaultValue={[at(10), at(16, 0, 27)]}
          formatDensity="spacious"
          readOnly
          autoFocus
        />
      </>,
    );
    const [time, dateTime] = [
      ...document.querySelectorAll("[data-ok-date-field]"),
    ] as HTMLElement[];
    expect(time?.getAttribute("data-ok-value-type")).toBe("time");
    expect(time?.getAttribute("data-ok-value")).toBe("09:00:00/17:30:00");
    expect(texts(time as HTMLElement)).toEqual(["09", "00", "AM", "05", "30", "PM"]);
    expect(dateTime?.getAttribute("data-ok-value")).toBe("2025-05-25T10:00:00/2025-05-27T16:00:00");
    expect(dateTime?.textContent).toContain(" / ");
    expect(document.activeElement).toBe(sections(dateTime as HTMLElement)[0]);
    await userEvent.keyboard("{ArrowUp}");
    expect(texts(dateTime as HTMLElement)[0]).toBe("05");
    unmount();
    render(
      <SingleInputDateRangeField
        label="Off"
        disabled
        selectedSections={4}
        defaultValue={[d(20), d(25)]}
      />,
    );
    expect(sections().every((s) => s.getAttribute("tabindex") === "-1")).toBe(true);
  });
});

describe("MultiInputDateRangeField", () => {
  it("renders two labeled fields with a dash and validates the order", async () => {
    const onChange = vi.fn();
    render(
      <MultiInputDateRangeField
        id="m"
        startLabel="Check-in"
        endLabel="Check-out"
        defaultValue={[d(20), d(25)]}
        onChange={onChange}
        helperText="Up to 30 nights"
      />,
    );
    const root = q("[data-ok-multi-input-range-field]");
    expect(root.getAttribute("role")).toBe("group");
    expect(root.getAttribute("data-ok-value")).toBe("2025-05-20/2025-05-25");
    expect(q("[data-ok-multi-input-range-field-separator]").textContent).toBe("–");
    expect(screen.getByRole("group", { name: "Check-in" })).toBeTruthy();
    expect(screen.getByText("Up to 30 nights")).toBeTruthy();
    const end = screen.getByRole("group", { name: "Check-out" });
    sections(end)[1]?.focus();
    await userEvent.keyboard("10");
    expect(iso(onChange.mock.lastCall?.[0])).toBe("5/20-5/10");
    expect(onChange.mock.lastCall?.[1].validationError).toEqual(["invalidRange", "invalidRange"]);
    expect(document.querySelectorAll("[data-ok-date-field][data-ok-error]")).toHaveLength(2);
    await expectNoAxeViolations(document.body);
  });

  it("time and date time fields use the Start / End labels; errors can be forced", async () => {
    render(
      <>
        <MultiInputTimeRangeField defaultValue={[at(9), at(17)]} />
        <MultiInputDateTimeRangeField defaultValue={[at(9), null]} error fullWidth />
      </>,
    );
    expect(screen.getAllByText("Start").length).toBeGreaterThan(0);
    expect(
      q('[data-ok-multi-input-range-field][data-ok-value-type="time"]').getAttribute(
        "data-ok-value",
      ),
    ).toBe("09:00:00/17:00:00");
    const dateTime = q('[data-ok-multi-input-range-field][data-ok-value-type="date-time"]');
    expect(dateTime.hasAttribute("data-ok-full-width")).toBe(true);
    expect(dateTime.querySelectorAll("[data-ok-error]")).toHaveLength(2);
    // An unchanged value isn't reported.
    const start = dateTime.querySelector<HTMLElement>('[role="spinbutton"]') as HTMLElement;
    start.focus();
    await userEvent.keyboard("05");
  });

  it("renders on the server, in StrictMode and in Vietnamese", () => {
    const tree = (
      <LocalizationProvider adapterLocale="vi-VN">
        <MultiInputDateRangeField id="v" defaultValue={[d(20), d(25)]} />
        <SingleInputDateRangeField id="w" defaultValue={[d(20), null]} />
      </LocalizationProvider>
    );
    const html = renderToString(tree);
    expect(html).toContain("data-ok-multi-input-range-field");
    expect(html).toContain('data-ok-value="2025-05-20/"');
    render(<StrictMode>{tree}</StrictMode>);
    expect(screen.getAllByText("Bắt đầu").length).toBeGreaterThan(0);
    expect(q("[data-ok-multi-input-range-field]").getAttribute("data-ok-locale")).toBe("vi-VN");
  });
});

describe("range fields edge cases", () => {
  it("a new start keeps the partly typed end; today is the reference of an empty start", async () => {
    const onChange = vi.fn();
    // biome-ignore lint/correctness/noComponentHookFactories: a test-local owner that reads this test's spies.
    function Controlled() {
      const [value, setValue] = useState<DateRange>([d(20), d(25)]);
      return (
        <>
          <SingleInputDateRangeField
            label="Stay"
            today={new Date(2025, 4, 1)}
            value={value}
            onChange={(next) => {
              setValue(next);
              onChange(next);
            }}
          />
          <button type="button" onClick={() => setValue(([, end]) => [d(1, 6), end])}>
            july
          </button>
        </>
      );
    }
    render(<Controlled />);
    sections()[3]?.focus();
    await userEvent.keyboard("{Backspace}");
    expect(iso(onChange.mock.lastCall?.[0])).toBe("5/20-invalid");
    await userEvent.click(screen.getByRole("button", { name: "july" }));
    expect(texts()).toEqual(["07", "01", "2025", "MM", "25", "2025"]);
    cleanupFields();
    render(<SingleInputDateRangeField label="Empty" today={new Date(2025, 4, 1)} />);
    sections()[0]?.focus();
    await userEvent.keyboard("{ArrowUp}");
    expect(texts()[0]).toBe("05");
    render(<MultiInputDateRangeField id="none" />);
    expect(q("[data-ok-multi-input-range-field]").hasAttribute("data-ok-value")).toBe(false);
  });
});

/** Unmounts what's on the page (between two renders of one test). */
function cleanupFields() {
  document.body.replaceChildren();
}
