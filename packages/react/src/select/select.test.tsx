import { act, render, screen } from "@testing-library/react";
import { StrictMode, useState } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { Chip } from "../chip/chip.js";
import { FormControl, FormHelperText } from "../form-control/form-control.js";
import { ListSubheader } from "../list/list.js";
import { MenuItem } from "../menu/menu.js";
import { TablePagination } from "../table/table.js";
import { expectNoAxeViolations, settled } from "../test-utils.js";
import { InputAdornment, TextField } from "../text-field/text-field.js";
import { InputLabel, Select, type SelectCloseReason } from "./select.js";

const AGES = [
  [10, "Ten"],
  [20, "Twenty"],
  [30, "Thirty"],
] as const;

function Age(props: Partial<Parameters<typeof Select>[0]>) {
  return (
    <FormControl>
      <InputLabel id="age-label">Age</InputLabel>
      <Select labelId="age-label" id="age" label="Age" {...props}>
        <MenuItem value="">
          <em>None</em>
        </MenuItem>
        {AGES.map(([value, text]) => (
          <MenuItem key={value} value={value} disabled={value === 30 && props.name === "off"}>
            {text}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

const combobox = () => screen.getByRole("combobox");
const listbox = () => screen.getByRole("listbox", { hidden: true });
const option = (name: string) => screen.getByRole("option", { name, hidden: true });
const isOpen = () => listbox().closest("[data-ok-popover]")?.hasAttribute("data-ok-open");

describe("Select", () => {
  it("renders the anatomy: field box, combobox, hidden input, icon, notch, listbox", () => {
    const { container } = render(<Age defaultValue={20} name="age" />);
    const root = container.querySelector<HTMLElement>("[data-ok-select]") as HTMLElement;
    expect(root.dataset).toMatchObject({
      okVariant: "outlined",
      okSize: "medium",
      okColor: "default",
      okRuntime: "off",
    });
    const trigger = combobox();
    expect(trigger.id).toBe("age");
    expect(trigger.getAttribute("tabindex")).toBe("0");
    expect(trigger.getAttribute("aria-haspopup")).toBe("listbox");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(trigger.getAttribute("aria-controls")).toBe("age-listbox");
    expect(trigger.getAttribute("aria-labelledby")).toBe("age-label");
    expect(trigger.textContent).toBe("Twenty");
    const input = root.querySelector("input") as HTMLInputElement;
    expect(input.dataset["okSelectInput"]).toBe("");
    expect(input.value).toBe("20");
    expect(input.name).toBe("age");
    expect(input.getAttribute("aria-hidden")).toBe("true");
    expect(root.querySelector("[data-ok-select-icon]")).not.toBeNull();
    expect(root.querySelector("[data-ok-select-outline] legend")?.textContent).toBe("Age");
    expect(listbox().id).toBe("age-listbox");
    expect(listbox().getAttribute("aria-labelledby")).toBe("age-label");
    expect(option("Twenty").getAttribute("aria-selected")).toBe("true");
    expect(option("Twenty").dataset).toMatchObject({ okSelected: "", okValue: "20" });
    expect(option("Ten").getAttribute("aria-selected")).toBe("false");
    expect(option("Ten").hasAttribute("value")).toBe(false);
    const label = screen.getByText("Age", { selector: "label" });
    expect(label.dataset).toMatchObject({ okFormLabel: "", okInputLabel: "" });
  });

  it("opens on the selected option; arrows, Home, End, typeahead; Enter picks and closes", async () => {
    const onChange = vi.fn();
    const onOpenChange = vi.fn();
    render(<Age defaultValue={20} onChange={onChange} onOpenChange={onOpenChange} />);
    combobox().focus();
    await userEvent.keyboard("{ArrowDown}");
    expect(isOpen()).toBe(true);
    expect(combobox().getAttribute("aria-expanded")).toBe("true");
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    expect(document.activeElement).toBe(option("Twenty"));
    await userEvent.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(option("Thirty"));
    await userEvent.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(option("None"));
    await userEvent.keyboard("{End}");
    expect(document.activeElement).toBe(option("Thirty"));
    await userEvent.keyboard("{Home}");
    expect(document.activeElement).toBe(option("None"));
    await userEvent.keyboard("t");
    expect(document.activeElement).toBe(option("Ten"));
    await userEvent.keyboard("{Enter}");
    expect(onChange).toHaveBeenCalledWith(10);
    expect(onOpenChange).toHaveBeenLastCalledWith(false, "select");
    expect(isOpen()).toBe(false);
    expect(document.activeElement).toBe(combobox());
    expect(combobox().textContent).toBe("Ten");
  });

  it("closed trigger: Home / End / a letter open on the first, last or matching option", async () => {
    render(<Age defaultValue="" />);
    combobox().focus();
    await userEvent.keyboard("{End}");
    expect(document.activeElement).toBe(option("Thirty"));
    await userEvent.keyboard("{Escape}");
    expect(isOpen()).toBe(false);
    expect(document.activeElement).toBe(combobox());
    await userEvent.keyboard("{Home}");
    expect(document.activeElement).toBe(option("None"));
    await userEvent.keyboard("{Escape}");
    await userEvent.keyboard("t");
    expect(document.activeElement).toBe(option("Ten"));
  });

  it("clicks: the trigger toggles, an option picks; Tab closes and keeps focus on the trigger", async () => {
    const onOpenChange = vi.fn<(open: boolean, reason?: SelectCloseReason) => void>();
    render(<Age defaultValue={10} onOpenChange={onOpenChange} />);
    await userEvent.click(combobox());
    expect(isOpen()).toBe(true);
    await userEvent.click(option("Thirty"));
    expect(combobox().textContent).toBe("Thirty");
    expect(isOpen()).toBe(false);
    await userEvent.click(combobox());
    await userEvent.keyboard("{Tab}");
    expect(onOpenChange).toHaveBeenLastCalledWith(false, "tab");
    expect(document.activeElement).toBe(combobox());
    await userEvent.click(combobox());
    act(() => combobox().click());
    expect(onOpenChange).toHaveBeenLastCalledWith(false, "toggle");
  });

  it("controlled value and open state; refusals keep the state", async () => {
    const onChange = vi.fn();
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <Age value={10} open={false} onChange={onChange} onOpenChange={onOpenChange} />,
    );
    combobox().focus();
    await userEvent.keyboard("{Enter}");
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    expect(isOpen()).toBe(false);
    rerender(<Age value={10} open onChange={onChange} onOpenChange={onOpenChange} />);
    expect(isOpen()).toBe(true);
    act(() => option("Twenty").click());
    expect(onChange).toHaveBeenLastCalledWith(20);
    expect(combobox().textContent).toBe("Ten");
    rerender(<Age value={20} open={false} onChange={onChange} onOpenChange={onOpenChange} />);
    expect(combobox().textContent).toBe("Twenty");
  });

  it("defaultOpen opens at mount; the paper takes the field's width unless autoWidth", async () => {
    const { unmount } = render(<Age defaultOpen defaultValue={10} />);
    expect(isOpen()).toBe(true);
    const paper = listbox().closest<HTMLElement>("[data-ok-popover]") as HTMLElement;
    expect(paper.style.getPropertyValue("--_ok-select-width")).toMatch(/px$/);
    unmount();
    render(<Age defaultOpen autoWidth defaultValue={10} />);
    const paper2 = listbox().closest<HTMLElement>("[data-ok-popover]") as HTMLElement;
    expect(paper2.style.getPropertyValue("--_ok-select-width")).toBe("");
    expect(paper2.closest("[data-ok-select]")?.hasAttribute("data-ok-auto-width")).toBe(true);
  });

  it("multiple: options toggle, the list stays open, values joined in the field", async () => {
    const onChange = vi.fn();
    render(<Age multiple defaultValue={[10]} onChange={onChange} name="ages" />);
    expect(listbox().getAttribute("aria-multiselectable")).toBe("true");
    await userEvent.click(combobox());
    await userEvent.click(option("Thirty"));
    expect(onChange).toHaveBeenLastCalledWith([10, 30]);
    expect(isOpen()).toBe(true);
    expect(combobox().textContent).toBe("Ten, Thirty");
    await userEvent.keyboard("{Home}{ArrowDown}{Space}");
    expect(onChange).toHaveBeenLastCalledWith([30]);
    const input = document.querySelector<HTMLInputElement>("[data-ok-select-input]");
    expect(input?.value).toBe("30");
  });

  it("renderValue and displayEmpty: chips, placeholder; the empty option shows with displayEmpty", () => {
    const { rerender } = render(
      <Select
        multiple
        aria-label="Names"
        defaultValue={["A", "B"]}
        renderValue={(value) =>
          (value as string[]).map((v) => <Chip key={v} size="small" label={v} />)
        }
      >
        <MenuItem value="A">A</MenuItem>
        <MenuItem value="B">B</MenuItem>
      </Select>,
    );
    expect(combobox().querySelectorAll("[data-ok-chip]")).toHaveLength(2);
    rerender(
      <Select
        multiple
        displayEmpty
        aria-label="Names"
        value={[]}
        renderValue={(value) => ((value as string[]).length ? "x" : <em>Placeholder</em>)}
      >
        <MenuItem value="A">A</MenuItem>
      </Select>,
    );
    expect(combobox().textContent).toBe("Placeholder");
    rerender(<Age value="" displayEmpty />);
    expect(combobox().textContent).toBe("None");
    rerender(<Age value="" />);
    expect(combobox().textContent).toBe("");
    expect(option("None").getAttribute("aria-selected")).toBe("true");
  });

  it("takes variant, size, color and states from the FormControl; own props win", () => {
    const { container, rerender } = render(
      <FormControl variant="filled" size="small" color="primary" error disabled required fullWidth>
        <InputLabel id="l">Label</InputLabel>
        <Select labelId="l" defaultValue="">
          <MenuItem value="a">A</MenuItem>
        </Select>
        <FormHelperText>Help</FormHelperText>
      </FormControl>,
    );
    const root = container.querySelector<HTMLElement>("[data-ok-select]") as HTMLElement;
    expect(root.dataset).toMatchObject({
      okVariant: "filled",
      okSize: "small",
      okColor: "primary",
      okError: "",
      okFullWidth: "",
    });
    expect(combobox().getAttribute("aria-disabled")).toBe("true");
    expect(combobox().getAttribute("aria-invalid")).toBe("true");
    expect(combobox().getAttribute("aria-required")).toBe("true");
    expect(combobox().getAttribute("tabindex")).toBe("-1");
    const input = root.querySelector("input") as HTMLInputElement;
    expect(input.disabled).toBe(true);
    expect(input.required).toBe(true);
    expect(root.querySelector("[data-ok-select-outline]")).toBeNull();
    act(() => combobox().click());
    expect(isOpen()).toBe(false);
    rerender(
      <FormControl variant="filled" error disabled>
        <Select variant="standard" error={false} disabled={false} readOnly defaultValue="">
          <MenuItem value="a">A</MenuItem>
        </Select>
      </FormControl>,
    );
    const own = container.querySelector<HTMLElement>("[data-ok-select]") as HTMLElement;
    expect(own.dataset["okVariant"]).toBe("standard");
    expect(own.hasAttribute("data-ok-error")).toBe(false);
    expect(combobox().getAttribute("aria-readonly")).toBe("true");
    act(() => combobox().click());
    expect(isOpen()).toBe(false);
  });

  it("filled: the value sits lower under a label, centered with hiddenLabel (CSS)", () => {
    const pad = (hiddenLabel: boolean) => {
      const { container, unmount } = render(
        <FormControl variant="filled" hiddenLabel={hiddenLabel}>
          {hiddenLabel ? null : <InputLabel id="l">Label</InputLabel>}
          <Select labelId="l" aria-label="Value" defaultValue="a">
            <MenuItem value="a">A</MenuItem>
          </Select>
        </FormControl>,
      );
      const display = container.querySelector("[data-ok-select-display]") as HTMLElement;
      const top = getComputedStyle(display).paddingTop;
      expect(container.firstElementChild?.hasAttribute("data-ok-hidden-label")).toBe(hiddenLabel);
      unmount();
      return top;
    };
    expect(pad(false)).toBe("24px");
    expect(pad(true)).toBe("16px");
  });

  it("InputLabel: shrink and disableAnimation; required adds the asterisk and the notch's", () => {
    const { container } = render(
      <FormControl required>
        <InputLabel id="l" shrink disableAnimation>
          Age
        </InputLabel>
        <Select labelId="l" label="Age" defaultValue="">
          <MenuItem value="a">A</MenuItem>
        </Select>
      </FormControl>,
    );
    const label = container.querySelector<HTMLElement>("label") as HTMLElement;
    expect(label.dataset).toMatchObject({ okShrink: "", okDisableAnimation: "" });
    expect(label.querySelector("[data-ok-form-label-asterisk]")).not.toBeNull();
    expect(container.querySelector("legend")?.textContent).toBe("Age *");
  });

  it("the label floats with focus or a value (CSS)", async () => {
    const { container } = render(<Age defaultValue="" />);
    const label = container.querySelector("label") as HTMLElement;
    const transform = () => getComputedStyle(label).transform;
    const rest = transform();
    combobox().focus();
    await settled(label);
    expect(transform()).not.toBe(rest);
    combobox().blur();
    await settled(label);
    expect(transform()).toBe(rest);
    await userEvent.click(combobox());
    await userEvent.click(option("Ten"));
    combobox().blur();
    await settled(label);
    expect(transform()).not.toBe(rest);
  });

  it("startAdornment / endAdornment: inside the box, the end one before the arrow; the label floats", async () => {
    const { container } = render(
      <>
        <Age
          defaultValue=""
          startAdornment={<InputAdornment position="start">$</InputAdornment>}
          endAdornment={<InputAdornment position="end">kg</InputAdornment>}
        />
        <Select
          aria-label="Native"
          native
          startAdornment={<InputAdornment position="start">#</InputAdornment>}
        >
          <option value="a">A</option>
        </Select>
      </>,
    );
    const box = container.querySelector("[data-ok-select]") as HTMLElement;
    const parts = [...box.children].map(
      (child) =>
        child.getAttribute("data-ok-text-field-adornment") ??
        [...child.attributes].find((a) => a.name.startsWith("data-ok-select"))?.name,
    );
    expect(parts.slice(0, 6)).toEqual([
      "start",
      "data-ok-select-display",
      "data-ok-select-input",
      "data-ok-select-icon",
      "end",
      "data-ok-select-outline",
    ]);
    const start = box.querySelector('[data-ok-text-field-adornment="start"]') as HTMLElement;
    const end = box.querySelector('[data-ok-text-field-adornment="end"]') as HTMLElement;
    const icon = box.querySelector("[data-ok-select-icon]") as HTMLElement;
    const trigger = screen.getByRole("combobox", { name: "Age" });
    const r = (element: Element) => element.getBoundingClientRect();
    expect(r(start).right).toBeLessThanOrEqual(r(trigger).left + 0.5);
    expect(r(end).left).toBeGreaterThanOrEqual(r(trigger).right - 0.5);
    expect(r(end).right).toBeLessThanOrEqual(r(icon).left + 0.5);
    // A start adornment floats the label and opens the notch, as in TextField.
    const label = container.querySelector("label") as HTMLElement;
    await settled(label);
    expect(new DOMMatrix(getComputedStyle(label).transform).a).toBe(0.75);
    const legend = box.querySelector("legend") as HTMLElement;
    expect(legend.getBoundingClientRect().width).toBeGreaterThan(1);
    const native = screen.getByRole("combobox", { name: "Native" });
    expect(native.previousElementSibling?.getAttribute("data-ok-text-field-adornment")).toBe(
      "start",
    );
    await userEvent.click(trigger);
    expect(isOpen()).toBe(true);
    await expectNoAxeViolations(container);
  });

  it("grouping: ListSubheaders are presentational, skipped by the keys", async () => {
    render(
      <Select aria-label="Grouped" defaultValue="">
        <ListSubheader>Category 1</ListSubheader>
        <MenuItem value={1}>Option 1</MenuItem>
        <ListSubheader role="none">Category 2</ListSubheader>
        <MenuItem value={2}>Option 2</MenuItem>
      </Select>,
    );
    const [first, second] = listbox().querySelectorAll("[data-ok-list-subheader]");
    expect(first?.getAttribute("role")).toBe("presentation");
    expect(second?.getAttribute("role")).toBe("none");
    combobox().focus();
    await userEvent.keyboard("{ArrowDown}{ArrowDown}");
    expect(document.activeElement).toBe(option("Option 2"));
  });

  it("native: a select with options, the icon, multiple without the icon", async () => {
    const onChange = vi.fn();
    const { container, rerender } = render(
      <Select
        native
        id="n"
        label="Age"
        defaultValue="20"
        onChange={onChange}
        inputProps={{ name: "n" }}
      >
        <option value="10">Ten</option>
        <option value="20">Twenty</option>
      </Select>,
    );
    const select = container.querySelector("select") as HTMLSelectElement;
    expect(select.dataset["okSelectNative"]).toBe("");
    expect(select.name).toBe("n");
    expect(container.querySelector("[data-ok-select-icon]")).not.toBeNull();
    await userEvent.selectOptions(select, "10");
    expect(onChange).toHaveBeenLastCalledWith("10");
    rerender(
      <Select native multiple aria-label="Many" defaultValue={["10"]} onChange={onChange} error>
        <option value="10">Ten</option>
        <option value="20">Twenty</option>
      </Select>,
    );
    const many = container.querySelector("select") as HTMLSelectElement;
    expect(many.multiple).toBe(true);
    expect(many.getAttribute("aria-invalid")).toBe("true");
    expect(container.querySelector("[data-ok-select-icon]")).toBeNull();
    await userEvent.selectOptions(many, ["10", "20"]);
    expect(onChange).toHaveBeenLastCalledWith(["10", "20"]);
  });

  it("autofill of the hidden input picks the matching option", () => {
    const onChange = vi.fn();
    const { container, rerender } = render(<Age defaultValue="" onChange={onChange} />);
    const input = () => container.querySelector("[data-ok-select-input]") as HTMLInputElement;
    const fill = (value: string) => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
      setter?.call(input(), value);
      input().dispatchEvent(new Event("input", { bubbles: true }));
    };
    act(() => fill("30"));
    expect(onChange).toHaveBeenLastCalledWith(30);
    act(() => fill("nope"));
    expect(onChange).toHaveBeenCalledTimes(1);
    rerender(<Age multiple value={[]} onChange={onChange} />);
    act(() => fill("10,20,x"));
    expect(onChange).toHaveBeenLastCalledWith([10, 20]);
  });

  it("menuProps: placement, paper and list props; displayProps go to the trigger", () => {
    render(
      <Age
        defaultValue=""
        menuProps={{
          placement: "top-start",
          paperProps: { className: "paper" },
          listProps: { className: "list" },
        }}
        displayProps={{ className: "display" }}
      />,
    );
    const paper = listbox().closest("[data-ok-popover]") as HTMLElement;
    expect(paper.dataset["okPlacement"]).toBe("top-start");
    expect(paper.className).toBe("paper");
    expect(listbox().className).toBe("list");
    expect(combobox().className).toBe("display");
  });

  it("works in StrictMode and renders on the server", async () => {
    render(
      <StrictMode>
        <Age defaultValue={10} />
      </StrictMode>,
    );
    await userEvent.click(combobox());
    expect(isOpen()).toBe(true);
    const html = renderToString(<Age defaultValue={10} />);
    expect(html).toContain('role="combobox"');
    expect(html).toContain("Ten");
  });

  it("has no axe violations, closed and open, single and multiple", async () => {
    const { container } = render(
      <>
        <Age defaultValue={10} />
        <Select multiple aria-label="Many" defaultValue={["a"]}>
          <MenuItem value="a">A</MenuItem>
          <MenuItem value="b">B</MenuItem>
        </Select>
      </>,
    );
    await expectNoAxeViolations(container);
    await userEvent.click(screen.getAllByRole("combobox")[0] as HTMLElement);
    await expectNoAxeViolations(document.body);
  });
});

function CurrencyDemo({ onChange }: { onChange?: (value: string) => void }) {
  const [value, setValue] = useState("EUR");
  return (
    <TextField
      select
      selectProps={{ native: false }}
      id="currency"
      label="Currency"
      helperText="Please select your currency"
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange?.(next);
      }}
    >
      <MenuItem value="USD">$</MenuItem>
      <MenuItem value="EUR">€</MenuItem>
    </TextField>
  );
}

describe("TextField select (listbox)", () => {
  it("composes the select in TextField's control; the label names it", async () => {
    const onChange = vi.fn();
    const { container } = render(<CurrencyDemo onChange={onChange} />);
    const control = container.querySelector<HTMLElement>("[data-ok-text-field-control]");
    expect(control?.dataset).toMatchObject({ okSelect: "" });
    expect(control?.hasAttribute("data-ok-variant")).toBe(false);
    const trigger = screen.getByRole("combobox", { name: "Currency" });
    expect(trigger.dataset).toMatchObject({ okTextFieldInput: "", okSelectDisplay: "" });
    expect(trigger.getAttribute("aria-describedby")).toBe("currency-helper-text");
    expect(container.querySelector("label")?.id).toBe("currency-label");
    expect(
      container.querySelector("[data-ok-text-field-select-icon][data-ok-select-icon]"),
    ).not.toBeNull();
    await userEvent.click(trigger);
    await userEvent.click(option("$"));
    expect(onChange).toHaveBeenCalledWith("USD");
    expect(trigger.textContent).toBe("$");
    await expectNoAxeViolations(container);
  });

  it("keeps the native select by default", () => {
    const { container } = render(
      <TextField select label="Native" defaultValue="b">
        <option value="a">A</option>
        <option value="b">B</option>
      </TextField>,
    );
    expect(container.querySelector("select")).not.toBeNull();
    expect(container.querySelector("[data-ok-select]")).toBeNull();
    expect(container.querySelector("label")?.hasAttribute("id")).toBe(false);
  });
});

describe("TablePagination select", () => {
  it("keeps the native select by default; selectProps.native false makes a listbox", async () => {
    const onRows = vi.fn();
    const { container, rerender } = render(
      <TablePagination
        count={50}
        page={0}
        rowsPerPage={5}
        rowsPerPageOptions={[5, 10]}
        onPageChange={() => {}}
      />,
    );
    expect(container.querySelector("label[data-ok-table-pagination-rows] > select")).not.toBeNull();
    rerender(
      <TablePagination
        count={50}
        page={0}
        rowsPerPage={5}
        rowsPerPageOptions={[5, { label: "All", value: -1 }]}
        onPageChange={() => {}}
        onRowsPerPageChange={onRows}
        selectProps={{ native: false }}
      />,
    );
    const rows = container.querySelector("div[data-ok-table-pagination-rows]") as HTMLElement;
    const trigger = screen.getByRole("combobox", { name: "Rows per page:" });
    expect(rows.contains(trigger)).toBe(true);
    expect(trigger.closest("[data-ok-select]")?.hasAttribute("data-ok-variant")).toBe(false);
    expect(trigger.textContent).toBe("5");
    await userEvent.click(trigger);
    await userEvent.click(option("All"));
    expect(onRows).toHaveBeenCalledWith(-1);
    await expectNoAxeViolations(container);
  });
});
