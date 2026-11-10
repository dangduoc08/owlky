import { type AutocompleteOption, createFilterOptions } from "@owlky/core";
import { act, render, screen } from "@testing-library/react";
import { createRef, forwardRef, type HTMLAttributes, StrictMode, useState } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { Checkbox } from "../checkbox/checkbox.js";
import { Chip } from "../chip/chip.js";
import { expectNoAxeViolations } from "../test-utils.js";
import { Autocomplete } from "./autocomplete.js";
import { useAutocomplete } from "./use-autocomplete.js";

const FRUITS = ["Apple", "Apricot", "Banana", "Cherry"];
const COUNTRIES = [
  { value: "AR", label: "Argentina" },
  { value: "DE", label: "Germany" },
  { value: "XX", label: "Nowhere", disabled: true },
];
const combo = () => screen.getByRole("combobox") as HTMLInputElement;
const visible = () =>
  [...document.querySelectorAll<HTMLElement>('[role="option"]:not([hidden])')].map(
    (o) => o.textContent,
  );
const root = () => document.querySelector("[data-ok-autocomplete]") as HTMLElement;

function Controlled({ onChange }: { onChange?: (value: string | string[] | null) => void }) {
  const [value, setValue] = useState<string | string[] | null>(null);
  return (
    <Autocomplete
      id="c"
      label="Fruit"
      options={FRUITS}
      value={value}
      onChange={(next) => {
        onChange?.(next);
        setValue(next);
      }}
    />
  );
}

describe("Autocomplete", () => {
  it("a combobox in a TextField with a listbox popup", async () => {
    render(<Autocomplete id="a" label="Fruit" options={FRUITS} />);
    expect({ ...root().dataset }).toEqual({ okAutocomplete: "", okRuntime: "off" });
    const input = combo();
    expect(input.getAttribute("aria-autocomplete")).toBe("list");
    expect(input.getAttribute("aria-expanded")).toBe("false");
    expect(input.getAttribute("aria-controls")).toBe("a-listbox");
    expect(input.getAttribute("autocomplete")).toBe("off");
    expect(screen.getByRole("button", { name: "Open", hidden: true })).toBeTruthy();
    expect(screen.getByRole("listbox", { hidden: true }).getAttribute("aria-label")).toBe("Fruit");
    await expectNoAxeViolations();
  });

  it("typing filters and opens; arrows highlight; Enter picks; the text shows the label", async () => {
    const onChange = vi.fn();
    render(
      <StrictMode>
        <Controlled onChange={onChange} />
      </StrictMode>,
    );
    await userEvent.click(combo());
    await userEvent.keyboard("ap");
    expect(combo().getAttribute("aria-expanded")).toBe("true");
    expect(root().hasAttribute("data-ok-open")).toBe(true);
    expect(visible()).toEqual(["Apple", "Apricot"]);
    await userEvent.keyboard("{ArrowDown}{ArrowDown}");
    expect(combo().getAttribute("aria-activedescendant")).toBe("c-option-1");
    expect(document.getElementById("c-option-1")?.hasAttribute("data-ok-focused")).toBe(true);
    await userEvent.keyboard("{Enter}");
    expect(onChange).toHaveBeenCalledExactlyOnceWith("Apricot");
    expect(combo().value).toBe("Apricot");
    expect(combo().getAttribute("aria-expanded")).toBe("false");
    // Reopened: every option shows, the chosen one is selected.
    await userEvent.keyboard("{ArrowDown}");
    expect(visible()).toHaveLength(4);
    expect(document.getElementById("c-option-1")?.getAttribute("aria-selected")).toBe("true");
    await userEvent.keyboard("{Escape}");
    expect(combo().getAttribute("aria-expanded")).toBe("false");
  });

  it("click on an option picks it; the toggle opens and closes; clear empties", async () => {
    const onChange = vi.fn();
    render(<Autocomplete id="k" label="Fruit" options={FRUITS} onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: "Open", hidden: true }));
    expect(combo().getAttribute("aria-expanded")).toBe("true");
    await userEvent.click(screen.getByRole("option", { name: "Banana" }));
    expect(onChange).toHaveBeenLastCalledWith("Banana");
    const clear = screen.getByRole("button", { name: "Clear", hidden: true });
    expect(clear.hidden).toBe(false);
    await userEvent.click(clear);
    expect(onChange).toHaveBeenLastCalledWith(null);
    expect(combo().value).toBe("");
    await userEvent.click(screen.getByRole("button", { name: "Open", hidden: true }));
    await userEvent.click(screen.getByRole("button", { name: "Close", hidden: true }));
    expect(combo().getAttribute("aria-expanded")).toBe("false");
  });

  it("blur closes and puts back the chosen label; no options text", async () => {
    render(
      <>
        <Autocomplete
          id="b"
          label="Country"
          options={COUNTRIES}
          defaultValue="DE"
          noOptionsText="Nothing"
        />
        <button type="button">After</button>
      </>,
    );
    expect(combo().value).toBe("Germany");
    await userEvent.click(combo());
    await userEvent.clear(combo());
    await userEvent.keyboard("zz");
    expect(screen.getByText("Nothing").hidden).toBe(false);
    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "After" }));
    expect(combo().value).toBe("Germany");
    expect(combo().getAttribute("aria-expanded")).toBe("false");
  });

  it("disabled options can't be highlighted or picked", async () => {
    const onChange = vi.fn();
    render(<Autocomplete id="d" label="Country" options={COUNTRIES} onChange={onChange} />);
    combo().focus();
    await userEvent.keyboard("{ArrowDown}{End}");
    expect(combo().getAttribute("aria-activedescendant")).toBe("d-option-1");
    act(() => screen.getByRole("option", { name: "Nowhere" }).click());
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("option", { name: "Nowhere" }).getAttribute("aria-disabled")).toBe(
      "true",
    );
  });

  it("multiple: chips, Backspace and chip delete remove, limitTags hides the rest", async () => {
    const onChange = vi.fn();
    render(
      <Autocomplete
        id="m"
        label="Fruits"
        multiple
        limitTags={1}
        options={FRUITS}
        defaultValue={["Apple", "Banana"]}
        onChange={onChange}
        getLimitTagsText={(n) => `and ${n} more`}
      />,
    );
    expect(root().dataset["okLimitTags"]).toBe("1");
    const chips = () => [...document.querySelectorAll<HTMLElement>("[data-ok-chip]")];
    expect(chips().map((c) => c.hidden)).toEqual([false, true]);
    expect(screen.getByText("and 1 more")).toBeTruthy();
    await userEvent.click(combo());
    expect(chips().map((c) => c.hidden)).toEqual([false, false]);
    await userEvent.keyboard("{ArrowDown}");
    await userEvent.click(screen.getByRole("option", { name: "Cherry" }));
    expect(onChange).toHaveBeenLastCalledWith(["Apple", "Banana", "Cherry"]);
    expect(combo().value).toBe("");
    await userEvent.keyboard("{Backspace}");
    expect(onChange).toHaveBeenLastCalledWith(["Apple", "Banana"]);
    await userEvent.click(screen.getByRole("button", { name: "Remove Apple" }));
    expect(onChange).toHaveBeenLastCalledWith(["Banana"]);
    await expectNoAxeViolations();
  });

  it("multiple + disableCloseOnSelect + checkboxes: picks toggle and the list stays open", async () => {
    render(
      <Autocomplete
        id="x"
        label="Fruits"
        multiple
        disableCloseOnSelect
        options={FRUITS}
        renderOption={(option, { selected }) => (
          <>
            <Checkbox size="small" checked={selected} readOnly tabIndex={-1} aria-hidden="true" />
            {option.label}
          </>
        )}
      />,
    );
    await userEvent.click(combo());
    await userEvent.click(screen.getByRole("option", { name: "Apple" }));
    expect(combo().getAttribute("aria-expanded")).toBe("true");
    expect(
      (screen.getByRole("option", { name: "Apple" }).querySelector("input") as HTMLInputElement)
        .checked,
    ).toBe(true);
    await userEvent.click(screen.getByRole("option", { name: "Apple" }));
    expect(document.querySelectorAll("[data-ok-chip]")).toHaveLength(0);
  });

  it("free solo: Enter commits typed text; no toggle; multiple free solo adds chips", async () => {
    const onChange = vi.fn();
    const { unmount } = render(
      <Autocomplete id="f" label="Search" freeSolo options={FRUITS} onChange={onChange} />,
    );
    expect(screen.queryByRole("button", { name: "Open", hidden: true })).toBeNull();
    combo().focus();
    await userEvent.keyboard("Kiwi{Enter}");
    expect(onChange).toHaveBeenLastCalledWith("Kiwi");
    await userEvent.tab();
    expect(combo().value).toBe("Kiwi");
    unmount();
    render(
      <Autocomplete
        id="g"
        label="Tags"
        freeSolo
        multiple
        disableClearable
        options={[]}
        onChange={onChange}
      />,
    );
    expect(screen.queryByRole("button", { name: "Clear", hidden: true })).toBeNull();
    combo().focus();
    await userEvent.keyboard("one{Enter}one{Enter}two{Enter}");
    expect(onChange).toHaveBeenLastCalledWith(["one", "two"]);
  });

  it("openOnFocus and autoHighlight; controlled open and input value", async () => {
    const onOpenChange = vi.fn();
    const onInputChange = vi.fn();
    render(
      <Autocomplete
        id="o"
        label="Fruit"
        options={FRUITS}
        openOnFocus
        autoHighlight
        onOpenChange={onOpenChange}
        onInputChange={onInputChange}
      />,
    );
    act(() => combo().focus());
    expect(onOpenChange).toHaveBeenCalledWith(true, "focus");
    await userEvent.keyboard("b");
    expect(onInputChange).toHaveBeenLastCalledWith("b");
    expect(combo().getAttribute("aria-activedescendant")).toBe("o-option-2");
  });

  it("controlled refusal: open and value stay as given", async () => {
    render(
      <Autocomplete
        id="r"
        label="Fruit"
        options={FRUITS}
        open={false}
        value="Apple"
        inputValue="Apple"
      />,
    );
    await userEvent.click(combo());
    await userEvent.keyboard("{ArrowDown}");
    expect(combo().getAttribute("aria-expanded")).toBe("false");
    expect(combo().value).toBe("Apple");
  });

  it("outside press closes the list (popover)", async () => {
    render(
      <>
        <Autocomplete id="p" label="Fruit" options={FRUITS} />
        <p>Outside</p>
      </>,
    );
    await userEvent.click(combo());
    expect(combo().getAttribute("aria-expanded")).toBe("true");
    await act(async () => {
      document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    });
    expect(combo().getAttribute("aria-expanded")).toBe("false");
  });

  it("the paper takes the field's width; disabled fields ignore input", async () => {
    render(
      <div style={{ width: 320 }}>
        <Autocomplete id="w" label="Fruit" options={FRUITS} />
      </div>,
    );
    await userEvent.click(combo());
    const paper = document.querySelector("[data-ok-autocomplete-paper]") as HTMLElement;
    expect(paper.style.getPropertyValue("--_ok-autocomplete-width")).toBe("320px");
    render(<Autocomplete id="z" label="Off" options={FRUITS} disabled />);
    expect((screen.getByRole("combobox", { name: "Off" }) as HTMLInputElement).disabled).toBe(true);
  });

  it("custom filter, ref and DOM props; server render matches", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Autocomplete
        ref={ref}
        className="mine"
        id="s"
        label="Fruit"
        options={FRUITS}
        filterOptions={(options) => options.slice(0, 1)}
        variant="filled"
        size="small"
      />,
    );
    expect(ref.current?.className).toBe("mine");
    const element = (
      <Autocomplete id="ssr" label="Fruit" multiple options={FRUITS} defaultValue={["Apple"]} />
    );
    const html = renderToString(element);
    const { container } = render(element);
    const server = document.createElement("div");
    server.innerHTML = html;
    for (const el of [...server.querySelectorAll("*"), ...container.querySelectorAll("*")])
      el.removeAttribute("style");
    expect(container.firstElementChild?.isEqualNode(server.firstElementChild)).toBe(true);
  });
});

const Listbox = forwardRef<HTMLUListElement, HTMLAttributes<HTMLUListElement>>(
  function Listbox(props, ref) {
    return <ul ref={ref} data-custom="" {...props} />;
  },
);

/** A field built from useAutocomplete's prop getters. */
function Custom({ onChange }: { onChange: (value: unknown) => void }) {
  const ac = useAutocomplete({
    id: "hk",
    options: FRUITS,
    onChange,
    filterOptions: createFilterOptions<AutocompleteOption>({ matchFrom: "start" }),
  });
  return (
    <div {...ac.getRootProps()}>
      {/* biome-ignore lint/a11y/noLabelWithoutControl: getInputLabelProps() sets htmlFor. */}
      <label {...ac.getInputLabelProps()}>Fruit</label>
      <input {...ac.getInputProps()} />
      <button type="button" aria-label="Clear" {...ac.getClearProps()} />
      <button type="button" aria-label="Open" {...ac.getPopupIndicatorProps()} />
      {ac.popupOpen && (
        <ul {...ac.getListboxProps()}>
          {(ac.groupedOptions as AutocompleteOption[]).map((option) => (
            <li key={option.value} {...ac.getOptionProps({ option })}>
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Reports useAutocomplete's groups. */
function Grouped({ onGroups }: { onGroups: (groups: unknown) => void }) {
  const ac = useAutocomplete({
    options: FRUITS,
    groupBy: (o) => (o.label.startsWith("A") ? "A" : "B"),
  });
  onGroups(ac.groupedOptions);
  return <input {...ac.getInputProps()} aria-label="Fruit" />;
}

describe("Autocomplete (phase 4)", () => {
  it("readOnly: no list, no clear, no chip removal; the input is read only", async () => {
    const onChange = vi.fn();
    render(
      <Autocomplete
        id="ro"
        label="Fruits"
        readOnly
        multiple
        options={FRUITS}
        defaultValue={["Apple"]}
        onChange={onChange}
      />,
    );
    expect(root().dataset["okReadOnly"]).toBe("");
    expect(combo().readOnly).toBe(true);
    await userEvent.click(combo());
    await userEvent.keyboard("{ArrowDown}");
    expect(combo().getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByRole("button", { name: "Remove Apple" })).toBeNull();
    await userEvent.keyboard("{Backspace}");
    expect(onChange).not.toHaveBeenCalled();
    expect((document.querySelector("[data-ok-autocomplete-toggle]") as HTMLElement).hidden).toBe(
      true,
    );
    expect((document.querySelector("[data-ok-autocomplete-clear]") as HTMLElement).hidden).toBe(
      true,
    );
  });

  it("onHighlightChange reports the option and the reason; disableListWrap stops at the end", async () => {
    const onHighlightChange = vi.fn();
    render(
      <Autocomplete
        id="hl"
        label="Fruit"
        options={FRUITS}
        disableListWrap
        onHighlightChange={onHighlightChange}
      />,
    );
    combo().focus();
    await userEvent.keyboard("{ArrowDown}{ArrowDown}");
    expect(onHighlightChange).toHaveBeenLastCalledWith(
      { value: "Apple", label: "Apple" },
      "keyboard",
    );
    await userEvent.keyboard("{End}{ArrowDown}");
    expect(combo().getAttribute("aria-activedescendant")).toBe("hl-option-3");
    await userEvent.hover(screen.getByRole("option", { name: "Banana" }));
    expect(onHighlightChange).toHaveBeenLastCalledWith(
      { value: "Banana", label: "Banana" },
      "mouse",
    );
  });

  it("autoComplete: the input completes the highlighted label, the rest selected", async () => {
    render(<Autocomplete id="ic" label="Fruit" options={FRUITS} autoComplete autoHighlight />);
    expect(combo().getAttribute("aria-autocomplete")).toBe("both");
    await userEvent.click(combo());
    await userEvent.keyboard("ba");
    expect(combo().value).toBe("Banana");
    expect([combo().selectionStart, combo().selectionEnd]).toEqual([2, 6]);
    await userEvent.keyboard("{Backspace}");
    expect(combo().value).toBe("Ba");
    await userEvent.keyboard("{ArrowDown}");
    expect(combo().value).toBe("Banana");
    await userEvent.keyboard("{Enter}");
    expect(combo().value).toBe("Banana");
  });

  it("clearOnBlur off keeps the text; autoSelect picks the highlighted option on blur", async () => {
    const onChange = vi.fn();
    render(
      <>
        <Autocomplete id="cb" label="Keep" options={FRUITS} clearOnBlur={false} />
        <Autocomplete id="as" label="Auto" options={FRUITS} autoSelect onChange={onChange} />
        <button type="button">After</button>
      </>,
    );
    // Move focus with focus(): Firefox tabs into a scrolling listbox first.
    const leave = () => act(() => screen.getByRole("button", { name: "After" }).focus());
    const keep = screen.getByRole("combobox", { name: "Keep" }) as HTMLInputElement;
    await userEvent.click(keep);
    await userEvent.keyboard("che");
    leave();
    expect(keep.value).toBe("che");
    expect(
      document.querySelector("[data-ok-clear-on-blur]")?.getAttribute("data-ok-clear-on-blur"),
    ).toBe("false");
    const auto = screen.getByRole("combobox", { name: "Auto" }) as HTMLInputElement;
    await userEvent.click(auto);
    await userEvent.keyboard("{ArrowDown}{ArrowDown}");
    leave();
    expect(onChange).toHaveBeenLastCalledWith("Apricot");
    expect(auto.value).toBe("Apricot");
  });

  it("autoSelect in free solo commits the text on blur; clearOnEscape clears", async () => {
    const onChange = vi.fn();
    render(
      <>
        <Autocomplete
          id="fs"
          label="Free"
          freeSolo
          autoSelect
          clearOnEscape
          options={FRUITS}
          onChange={onChange}
        />
        <button type="button">After</button>
      </>,
    );
    combo().focus();
    await userEvent.keyboard("Fig");
    act(() => screen.getByRole("button", { name: "After" }).focus());
    expect(onChange).toHaveBeenLastCalledWith("Fig");
    combo().focus();
    await userEvent.keyboard("{Escape}");
    expect(onChange).toHaveBeenLastCalledWith(null);
    expect(combo().value).toBe("");
  });

  it("blurOnSelect blurs after a pick; selectOnFocus selects the text on the first click", async () => {
    render(
      <Autocomplete id="bs" label="Fruit" options={FRUITS} blurOnSelect defaultValue="Cherry" />,
    );
    expect(root().dataset["okBlurOnSelect"]).toBe("true");
    await userEvent.click(combo());
    expect([combo().selectionStart, combo().selectionEnd]).toEqual([0, 6]);
    await userEvent.click(screen.getByRole("option", { name: "Banana" }));
    expect(document.activeElement).not.toBe(combo());
    expect(combo().value).toBe("Banana");
  });

  it("filterSelectedOptions, disabledItemsFocusable, handleHomeEndKeys off, includeInputInList", async () => {
    render(
      <Autocomplete
        id="fo"
        label="Country"
        options={COUNTRIES}
        defaultValue="AR"
        filterSelectedOptions
        disabledItemsFocusable
        handleHomeEndKeys={false}
        includeInputInList
      />,
    );
    combo().focus();
    await userEvent.keyboard("{ArrowDown}");
    expect(visible()).toEqual(["Germany", "Nowhere"]);
    await userEvent.keyboard("{ArrowUp}");
    expect(combo().getAttribute("aria-activedescendant")).toBe("fo-option-2");
    await userEvent.keyboard("{Enter}");
    expect(combo().value).toBe("Argentina");
    await userEvent.keyboard("{ArrowDown}");
    expect(combo().hasAttribute("aria-activedescendant")).toBe(false);
    await userEvent.keyboard("{Home}");
    expect(combo().hasAttribute("aria-activedescendant")).toBe(false);
  });

  it("resetHighlightOnMouseLeave clears a pointer highlight", async () => {
    render(
      <>
        <Autocomplete id="rh" label="Fruit" options={FRUITS} resetHighlightOnMouseLeave />
        <p>Elsewhere</p>
      </>,
    );
    await userEvent.click(combo());
    await userEvent.hover(screen.getByRole("option", { name: "Cherry" }));
    expect(combo().getAttribute("aria-activedescendant")).toBe("rh-option-3");
    await userEvent.hover(combo());
    expect(combo().hasAttribute("aria-activedescendant")).toBe(false);
  });

  it("groupBy: headings before their options, hidden when none match; renderGroup", async () => {
    const { unmount } = render(
      <Autocomplete id="gb" label="Fruit" options={FRUITS} groupBy={(o) => o.label[0] as string} />,
    );
    const headings = () =>
      [...document.querySelectorAll<HTMLElement>("[data-ok-list-subheader]")].filter(
        (h) => !h.hidden,
      );
    expect(headings().map((h) => h.textContent)).toEqual(["A", "B", "C"]);
    expect(headings()[0]?.getAttribute("role")).toBe("presentation");
    await userEvent.click(combo());
    await userEvent.keyboard("ch");
    expect(headings().map((h) => h.textContent)).toEqual(["C"]);
    await expectNoAxeViolations();
    unmount();
    render(
      <Autocomplete
        id="rg"
        label="Fruit"
        options={FRUITS}
        groupBy={(o) => (o.label.startsWith("A") ? "A" : "Other")}
        renderGroup={({ key, group, children }) => (
          <li key={key} data-group={group} role="presentation">
            <ul aria-label={group}>{children}</ul>
          </li>
        )}
      />,
    );
    expect([...document.querySelectorAll("[data-group]")].map((g) => g.textContent)).toEqual([
      "AppleApricot",
      "BananaCherry",
    ]);
  });

  it("loading shows the loading text while there are no options", () => {
    const { rerender } = render(<Autocomplete id="ld" label="Fruit" options={[]} loading />);
    expect(root().dataset["okLoading"]).toBe("");
    expect(screen.getByText("Loading…", { selector: "div" }).hidden).toBe(false);
    expect(screen.getByText("No options").hidden).toBe(true);
    rerender(<Autocomplete id="ld" label="Fruit" options={FRUITS} loading loadingText="Wait" />);
    expect(screen.getByText("Wait").hidden).toBe(true);
  });

  it("virtualize draws only the options in view and keeps the highlight drawn", async () => {
    const many = Array.from({ length: 1000 }, (_, i) => `Option ${i}`);
    render(<Autocomplete id="vt" label="Many" options={many} virtualize />);
    expect(document.querySelectorAll('[role="option"]')).toHaveLength(0);
    await userEvent.click(combo());
    const drawn = () => document.querySelectorAll('[role="option"]');
    expect(drawn().length).toBeGreaterThan(5);
    expect(drawn().length).toBeLessThan(30);
    expect(drawn()[0]?.getAttribute("aria-setsize")).toBe("1000");
    await userEvent.keyboard("{ArrowUp}");
    const id = combo().getAttribute("aria-activedescendant") as string;
    expect(id).toBe("vt-option-999");
    expect(document.getElementById(id)?.getAttribute("aria-posinset")).toBe("1000");
    const listbox = screen.getByRole("listbox");
    listbox.scrollTop = 0;
    await act(async () => {
      listbox.dispatchEvent(new Event("scroll"));
    });
    expect(document.getElementById("vt-option-0")).not.toBeNull();
    act(() => (document.getElementById("vt-option-2") as HTMLElement).click());
    expect(combo().value).toBe("Option 2");
  });

  it("ListboxComponent, icons and forcePopupIcon", () => {
    render(
      <Autocomplete
        id="lc"
        label="Fruit"
        freeSolo
        forcePopupIcon
        options={FRUITS}
        defaultValue="Apple"
        ListboxComponent={Listbox}
        clearIcon={<span data-icon="clear" />}
        popupIcon={<span data-icon="popup" />}
      />,
    );
    expect(screen.getByRole("listbox", { hidden: true }).hasAttribute("data-custom")).toBe(true);
    expect(
      document.querySelector("[data-ok-autocomplete-toggle] [data-icon=popup]"),
    ).not.toBeNull();
    expect(document.querySelector("[data-ok-autocomplete-clear] [data-icon=clear]")).not.toBeNull();
    render(<Autocomplete id="np" label="None" options={FRUITS} forcePopupIcon={false} />);
    expect(document.querySelectorAll("[data-ok-autocomplete-toggle]")).toHaveLength(1);
  });

  it("renderValue: custom chips (multiple) and a single value drawn in the field", async () => {
    const onChange = vi.fn();
    const { unmount } = render(
      <Autocomplete
        id="rv"
        label="Fruits"
        multiple
        options={FRUITS}
        defaultValue={["Apple", "Banana"]}
        onChange={onChange}
        renderValue={(value, getItemProps) =>
          (value as string[]).map((v, index) => (
            <Chip key={v} label={v.toUpperCase()} size="small" {...getItemProps({ index })} />
          ))
        }
      />,
    );
    expect(screen.getByText("APPLE")).toBeTruthy();
    expect(document.querySelector('[data-ok-item-index="1"]')?.getAttribute("data-ok-value")).toBe(
      "Banana",
    );
    await userEvent.click(screen.getByRole("button", { name: "Remove Apple" }));
    expect(onChange).toHaveBeenLastCalledWith(["Banana"]);
    unmount();
    render(
      <Autocomplete
        id="rs"
        label="Fruit"
        options={FRUITS}
        defaultValue="Cherry"
        onChange={onChange}
        renderValue={(value, getItemProps) => (
          <Chip label={value as string} size="small" {...getItemProps({ index: 0 })} />
        )}
      />,
    );
    expect(combo().value).toBe("");
    expect(screen.getByText("Cherry", { selector: "[data-ok-chip-label]" })).toBeTruthy();
    await userEvent.click(combo());
    await userEvent.click(screen.getByRole("option", { name: "Apple" }));
    expect(onChange).toHaveBeenLastCalledWith("Apple");
    expect(combo().value).toBe("");
    await userEvent.keyboard("{Backspace}");
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it("object values: getOptionLabel, getOptionKey, isOptionEqualToValue, getOptionValue", async () => {
    type Film = { title: string; year: number };
    const films: Film[] = [
      { title: "Alien", year: 1979 },
      { title: "Heat", year: 1995 },
      { title: "Heat", year: 1986 },
    ];
    const onChange = vi.fn();
    const { unmount } = render(
      <Autocomplete<Film, Film>
        id="ob"
        label="Film"
        options={films}
        getOptionLabel={(f) => f.title}
        getOptionKey={(f) => `${f.title}-${f.year}`}
        isOptionEqualToValue={(o, v) => o.year === v.year}
        getOptionDisabled={(f) => f.year === 1986}
        defaultValue={{ title: "Alien", year: 1979 }}
        onChange={onChange}
        renderOption={(f) => `${f.title} (${f.year})`}
      />,
    );
    expect(combo().value).toBe("Alien");
    expect(document.getElementById("ob-option-0")?.getAttribute("aria-selected")).toBe("true");
    expect(document.getElementById("ob-option-2")?.getAttribute("data-ok-value")).toBe("Heat-1986");
    expect(document.getElementById("ob-option-2")?.getAttribute("aria-disabled")).toBe("true");
    await userEvent.click(combo());
    await userEvent.click(screen.getByRole("option", { name: "Heat (1995)" }));
    expect(onChange).toHaveBeenLastCalledWith(films[1]);
    unmount();
    render(
      <Autocomplete<Film, number>
        id="ov"
        label="Year"
        multiple
        options={films}
        getOptionLabel={(f) => `${f.title} ${f.year}`}
        getOptionValue={(f) => f.year}
        defaultValue={[1995]}
        onChange={onChange}
      />,
    );
    expect(document.querySelector('[data-ok-chip][data-ok-value="1995"]')?.textContent).toContain(
      "Heat 1995",
    );
    await userEvent.click(combo());
    await userEvent.click(screen.getByRole("option", { name: "Alien 1979" }));
    expect(onChange).toHaveBeenLastCalledWith([1995, 1979]);
  });

  it("free solo values beside object options keep their text", () => {
    type Tag = { name: string };
    render(
      <Autocomplete<Tag, Tag | string>
        id="fx"
        label="Tags"
        multiple
        freeSolo
        options={[{ name: "red" }]}
        getOptionLabel={(t) => (typeof t === "string" ? t : t.name)}
        defaultValue={["blue", { name: "green" }]}
      />,
    );
    const chips = [...document.querySelectorAll("[data-ok-chip]")].map((c) => c.textContent);
    expect(chips).toEqual(["blue", "green"]);
  });

  it("createFilterOptions and useAutocomplete build a field from scratch", async () => {
    const onChange = vi.fn();
    render(<Custom onChange={onChange} />);
    await userEvent.click(combo());
    await userEvent.keyboard("a");
    expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual(["Apple", "Apricot"]);
    await userEvent.keyboard("{ArrowDown}{Enter}");
    expect(onChange).toHaveBeenLastCalledWith("Apple");
    expect(combo().value).toBe("Apple");
    expect(screen.getByRole("button", { name: "Clear" }).hidden).toBe(false);
  });

  it("useAutocomplete groups options with groupBy", () => {
    let groups: unknown;
    render(
      <Grouped
        onGroups={(next) => {
          groups = next;
        }}
      />,
    );
    expect(groups).toEqual([
      { key: "0", index: 0, group: "A", options: [expect.anything(), expect.anything()] },
      { key: "2", index: 2, group: "B", options: [expect.anything(), expect.anything()] },
    ]);
  });
});
