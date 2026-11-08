import { act, render, screen } from "@testing-library/react";
import { createRef, StrictMode, useState } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { Checkbox } from "../checkbox/checkbox.js";
import { expectNoAxeViolations } from "../test-utils.js";
import { Autocomplete } from "./autocomplete.js";

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
