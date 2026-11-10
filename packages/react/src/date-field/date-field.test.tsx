import type { FieldApi, FieldSelectedSections } from "@owlky/core";
import { act, render, screen } from "@testing-library/react";
import { createRef, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { DatePicker } from "../date-picker/date-picker.js";
import { SingleInputDateRangeField } from "../date-range-field/date-range-field.js";
import { expectNoAxeViolations } from "../test-utils.js";
import { InputAdornment } from "../text-field/text-field.js";
import { TimeField } from "../time-field/time-field.js";
import { DateField } from "./date-field.js";

const d = (y: number, m: number, day: number) => new Date(y, m - 1, day);
const spinbuttons = (root: ParentNode = document) => [
  ...root.querySelectorAll<HTMLElement>('[role="spinbutton"]'),
];
const texts = (root?: ParentNode) => spinbuttons(root).map((s) => s.textContent);
const fieldRoot = () => document.querySelector("[data-ok-date-field]") as HTMLElement;
const control = () => fieldRoot().querySelector("[data-ok-text-field-control]") as HTMLElement;
/** The control's children: the adornments by side, the sections group and the hidden input. */
const layout = () =>
  [...control().children].map(
    (child) =>
      child.getAttribute("data-ok-text-field-adornment") ??
      (child.hasAttribute("data-ok-date-field-sections")
        ? "sections"
        : child.localName === "input"
          ? "input"
          : child.localName),
  );

/** A field whose selected sections are state, set by two buttons and by the field itself. */
function ControlledSections({ reported }: { reported: FieldSelectedSections[] }) {
  const [selected, setSelected] = useState<FieldSelectedSections>(null);
  return (
    <>
      <DateField
        label="Date"
        defaultValue={d(2025, 5, 25)}
        selectedSections={selected}
        onSelectedSectionsChange={(next) => {
          reported.push(next);
          setSelected(next);
        }}
      />
      <button type="button" onClick={() => setSelected("year")}>
        year
      </button>
      <button type="button" onClick={() => setSelected("all")}>
        all
      </button>
    </>
  );
}

describe("DateField: TextField props, adornments and button positions", () => {
  it("takes color, margin, hiddenLabel and focused like a TextField", () => {
    render(
      <DateField
        label="Date"
        color="primary"
        margin="dense"
        hiddenLabel
        focused
        defaultValue={d(2025, 5, 25)}
      />,
    );
    const root = fieldRoot();
    expect(root.dataset).toMatchObject({
      okColor: "primary",
      okMargin: "dense",
      okHiddenLabel: "",
      okFocused: "",
    });
    expect(getComputedStyle(root).marginTop).toBe("8px");
    // The label is hidden but still names the group; the sections show.
    expect(screen.getByRole("group", { name: "Date" })).toBeTruthy();
    const sections = root.querySelector("[data-ok-date-field-sections]") as HTMLElement;
    expect(getComputedStyle(sections).opacity).toBe("1");
  });

  it("an empty field with a label hides its sections, unless focused, hiddenLabel or a start adornment", () => {
    render(
      <>
        <DateField label="Plain" />
        <DateField label="Focused" focused />
        <DateField label="Hidden" hiddenLabel />
        <DateField
          label="Adorned"
          startAdornment={<InputAdornment position="start">From</InputAdornment>}
        />
      </>,
    );
    const opacity = (name: string) =>
      getComputedStyle(
        screen
          .getByRole("group", { name })
          .closest("[data-ok-date-field]")
          ?.querySelector("[data-ok-date-field-sections]") as HTMLElement,
      ).opacity;
    expect(opacity("Plain")).toBe("0");
    expect(opacity("Focused")).toBe("1");
    expect(opacity("Hidden")).toBe("1");
    expect(opacity("Adorned")).toBe("1");
  });

  it("startAdornment / endAdornment go around the sections, the buttons outside them", () => {
    render(
      <DateField
        label="Date"
        clearable
        defaultValue={d(2025, 5, 25)}
        startAdornment={<InputAdornment position="start">From</InputAdornment>}
        endAdornment={<InputAdornment position="end">UTC</InputAdornment>}
      />,
    );
    expect(layout()).toEqual(["start", "sections", "input", "end", "end", "fieldset"]);
    const ends = control().querySelectorAll(':scope > [data-ok-text-field-adornment="end"]');
    expect(ends[0]?.textContent).toBe("UTC");
    expect(ends[1]?.querySelector("[data-ok-date-field-clear]")).not.toBeNull();
  });

  it("clearButtonPosition start puts the clear button in a start adornment", async () => {
    const onClear = vi.fn();
    render(
      <DateField
        label="Date"
        clearable
        clearButtonPosition="start"
        onClear={onClear}
        defaultValue={d(2025, 5, 25)}
      />,
    );
    expect(fieldRoot().getAttribute("data-ok-clear-button-position")).toBe("start");
    expect(layout()).toEqual(["start", "sections", "input", "fieldset"]);
    const clear = screen.getByRole("button", { name: "Clear" });
    expect(clear.closest('[data-ok-text-field-adornment="start"]')).not.toBeNull();
    await userEvent.click(clear);
    expect(onClear).toHaveBeenCalledOnce();
    expect(texts()).toEqual(["MM", "DD", "YYYY"]);
  });

  it("DatePicker openPickerButtonPosition start: the open button leads, the clear one follows its side", async () => {
    render(
      <DatePicker
        label="Date"
        clearable
        openPickerButtonPosition="start"
        defaultValue={d(2025, 5, 25)}
        today={d(2025, 5, 20)}
      />,
    );
    expect(fieldRoot().getAttribute("data-ok-open-picker-button-position")).toBe("start");
    expect(layout()).toEqual(["start", "sections", "input", "end", "fieldset"]);
    const open = screen.getByRole("button", { name: /Choose date/ });
    expect(open.closest('[data-ok-text-field-adornment="start"]')).not.toBeNull();
    expect(open.getAttribute("data-ok-edge")).toBe("start");
    expect(
      screen.getByRole("button", { name: "Clear" }).closest('[data-ok-text-field-adornment="end"]'),
    ).not.toBeNull();
    await userEvent.click(open);
    expect(document.querySelector("[data-ok-date-picker-paper][data-ok-open]")).not.toBeNull();
    await userEvent.keyboard("{Escape}");
  });

  it("both buttons at the start share one adornment, open first", () => {
    render(
      <DatePicker
        label="Date"
        clearable
        clearButtonPosition="start"
        openPickerButtonPosition="start"
        defaultValue={d(2025, 5, 25)}
      />,
    );
    expect(layout()).toEqual(["start", "sections", "input", "fieldset"]);
    const start = control().firstElementChild as HTMLElement;
    expect(
      [...start.querySelectorAll("button")].map((b) => b.hasAttribute("data-ok-date-picker-open")),
    ).toEqual([true, false]);
  });
});

describe("DateField: leading zeros", () => {
  it("pads D / M / h by default, keeps the format's padding with shouldRespectLeadingZeros", async () => {
    const { unmount } = render(
      <DateField label="Date" format="M/D/YYYY" defaultValue={d(2025, 5, 7)} />,
    );
    expect(texts()).toEqual(["05", "07", "2025"]);
    unmount();
    render(
      <DateField
        label="Date"
        format="M/D/YYYY"
        shouldRespectLeadingZeros
        defaultValue={d(2025, 5, 7)}
      />,
    );
    expect(fieldRoot().hasAttribute("data-ok-should-respect-leading-zeros")).toBe(true);
    expect(texts()).toEqual(["5", "7", "2025"]);
    const [month] = spinbuttons();
    (month as HTMLElement).focus();
    await userEvent.keyboard("{ArrowUp}");
    expect(texts()[0]).toBe("6");
  });

  it("time fields and range fields pad too", () => {
    render(
      <>
        <div data-testid="time">
          <TimeField label="Time" format="h:m A" defaultValue={new Date(2025, 4, 7, 9, 5)} />
        </div>
        <div data-testid="range">
          <SingleInputDateRangeField
            label="Range"
            format="M/D/YYYY"
            defaultValue={[d(2025, 5, 7), d(2025, 6, 1)]}
          />
        </div>
      </>,
    );
    expect(texts(screen.getByTestId("time"))).toEqual(["09", "05", "AM"]);
    expect(texts(screen.getByTestId("range"))).toEqual(["05", "07", "2025", "06", "01", "2025"]);
  });
});

describe("DateField: fieldRef and selectedSections", () => {
  it("fieldRef: sections, focus, selection by index, type and all", () => {
    const ref = createRef<FieldApi>();
    render(<DateField label="Date" fieldRef={ref} defaultValue={d(2025, 5, 25)} />);
    const api = ref.current as FieldApi;
    expect(api.getSections().map((s) => [s.type, s.value])).toEqual([
      ["month", "05"],
      ["day", "25"],
      ["year", "2025"],
    ]);
    expect(api.isFieldFocused()).toBe(false);
    expect(api.getActiveSectionIndex()).toBeNull();
    act(() => api.focusField("year"));
    expect(document.activeElement).toBe(spinbuttons()[2]);
    expect(api.isFieldFocused()).toBe(true);
    act(() => api.setSelectedSections("day"));
    expect(api.getActiveSectionIndex()).toBe(1);
    act(() => api.setSelectedSections("all"));
    const group = screen.getByRole("group", { name: "Date" });
    expect(group.hasAttribute("data-ok-all-selected")).toBe(true);
    act(() => api.setSelectedSections(null));
    expect(group.hasAttribute("data-ok-all-selected")).toBe(false);
  });

  it("fieldRef on pickers and single input range fields", () => {
    const picker = createRef<FieldApi>();
    const range = createRef<FieldApi>();
    render(
      <>
        <DatePicker label="Date" fieldRef={picker} defaultValue={d(2025, 5, 25)} />
        <SingleInputDateRangeField
          label="Range"
          fieldRef={range}
          defaultValue={[d(2025, 5, 7), d(2025, 6, 1)]}
        />
      </>,
    );
    expect(picker.current?.getSections()).toHaveLength(3);
    expect(range.current?.getSections()).toHaveLength(6);
    act(() => range.current?.focusField(4));
    expect(document.activeElement?.textContent).toBe("01");
  });

  it('selectedSections takes "all" and a section type; select-all is reported as "all"', async () => {
    const reported: FieldSelectedSections[] = [];
    render(<ControlledSections reported={reported} />);
    await userEvent.click(screen.getByRole("button", { name: "year" }));
    expect(document.activeElement).toBe(spinbuttons()[2]);
    expect(reported.at(-1)).toBe(2);
    await userEvent.click(screen.getByRole("button", { name: "all" }));
    expect(screen.getByRole("group", { name: "Date" }).hasAttribute("data-ok-all-selected")).toBe(
      true,
    );
    expect(reported.at(-1)).toBe("all");
    (spinbuttons()[0] as HTMLElement).focus();
    await userEvent.keyboard("{Control>}a{/Control}");
    expect(reported.at(-1)).toBe("all");
  });

  it("an API from an unmounted field reads nothing", () => {
    const ref = createRef<FieldApi>();
    const { unmount } = render(<DateField label="Date" fieldRef={ref} />);
    const api = ref.current as FieldApi;
    unmount();
    expect(ref.current).toBeNull();
    expect(api.getSections()).toBeDefined();
  });

  it("has no axe violations with adornments and buttons at the start", async () => {
    const { container } = render(
      <>
        <DatePicker
          label="Start"
          clearable
          clearButtonPosition="start"
          openPickerButtonPosition="start"
          defaultValue={d(2025, 5, 25)}
        />
        <DateField
          label="Hidden"
          hiddenLabel
          startAdornment={<InputAdornment position="start">From</InputAdornment>}
        />
      </>,
    );
    await expectNoAxeViolations(container);
  });
});
