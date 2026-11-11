import { phoneMetadata as maxMetadata } from "@owlky/core/phone";
import { act, render, screen } from "@testing-library/react";
import { createRef, StrictMode, useState } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { expectNoAxeViolations } from "../test-utils.js";
import { PhoneInput } from "./phone-input.js";

const field = (name = "Phone number") => screen.getByRole("textbox", { name }) as HTMLInputElement;
const country = () => screen.getByRole("combobox", { name: "Country" });
const options = () => screen.getAllByRole("option", { hidden: true });

/** Picks a country through the listbox (opened with the keyboard, then a click). */
async function pick(code: string) {
  await userEvent.click(country());
  const option = document.querySelector<HTMLElement>(`[role="option"][data-ok-value="${code}"]`);
  await userEvent.click(option as HTMLElement);
}

/** A controlled field that refuses numbers from Vietnam, with a button that sets a value. */
function Controlled({ onChange }: { onChange?: (value: string) => void }) {
  const [value, setValue] = useState("+61298765432");
  return (
    <>
      <PhoneInput
        label="Phone number"
        value={value}
        onChange={(next) => {
          onChange?.(next);
          if (!next.startsWith("+84")) setValue(next);
        }}
      />
      <button type="button" onClick={() => setValue("+33123456789")}>
        France
      </button>
      <output>{value}</output>
    </>
  );
}

describe("PhoneInput", () => {
  it("renders a tel input with a country select in the start adornment", async () => {
    const ref = createRef<HTMLInputElement>();
    const { container } = render(
      <PhoneInput
        ref={ref}
        id="phone"
        label="Phone number"
        helperText="Mobile or landline"
        defaultValue="+61298765432"
        placeholder="Enter phone number"
      />,
    );
    const input = field();
    expect(ref.current).toBe(input);
    expect(input.type).toBe("tel");
    expect(input.getAttribute("autocomplete")).toBe("tel");
    expect(input.value).toBe("(02) 9876 5432");
    const root = container.firstElementChild as HTMLElement;
    expect(root.hasAttribute("data-ok-text-field")).toBe(true);
    expect(root.hasAttribute("data-ok-phone-input")).toBe(true);
    const select = country();
    expect(select.id).toBe("phone-country");
    expect(select.closest("[data-ok-phone-input-country]")).not.toBeNull();
    // The trigger shows the option's flag; its name and code stay for screen readers.
    expect(select.textContent).toBe("🇦🇺AustraliaAU (+61)");
    expect(options()[0]?.textContent).toBe("International");
    expect(options().length).toBeGreaterThan(200);
    await expectNoAxeViolations(container);
  });

  it("formats as you type, selects the country of the number and reports its details", async () => {
    const onChange = vi.fn();
    const onCountryChange = vi.fn();
    render(
      <PhoneInput label="Phone number" onChange={onChange} onCountryChange={onCountryChange} />,
    );
    const input = field();
    expect(country().textContent).toBe("International");
    await userEvent.type(input, "84912345678");
    expect(input.value).toBe("+84 912 345 678");
    expect(onCountryChange).toHaveBeenCalledWith("VN");
    expect(onChange).toHaveBeenLastCalledWith("+84912345678", {
      value: "+84912345678",
      national: "0912 345 678",
      international: "+84 912 345 678",
      country: "VN",
      valid: true,
      possible: true,
    });
    expect(country().textContent).toContain("Vietnam");
    expect(input.selectionStart).toBe(input.value.length);
  });

  it("keeps the caret after the digit it follows, and deletes across formatting", async () => {
    render(<PhoneInput label="Phone number" defaultCountry="AU" />);
    const input = field();
    await userEvent.type(input, "0298765432");
    expect(input.value).toBe("(02) 9876 5432");
    // Backspace after "(02) " removes the "2", not the space; the caret stays after the "0".
    input.setSelectionRange(5, 5);
    await userEvent.keyboard("{Backspace}");
    expect(input.value).toBe("098765432");
    expect(input.selectionStart).toBe(1);
    await userEvent.keyboard("2");
    expect(input.value).toBe("(02) 9876 5432");
    expect(input.selectionStart).toBe(3);
  });

  it("starts with the default country and changes it from the list", async () => {
    const onCountryChange = vi.fn();
    render(
      <PhoneInput label="Phone number" defaultCountry="DE" onCountryChange={onCountryChange} />,
    );
    expect(country().textContent).toContain("Germany");
    await pick("AU");
    expect(onCountryChange).toHaveBeenCalledWith("AU");
    // The focus moves to the input.
    expect(document.activeElement).toBe(field());
    await userEvent.type(field(), "0298765432");
    expect(field().value).toBe("(02) 9876 5432");
    await pick("");
    expect(field().value).toBe("+61 2 9876 5432");
    expect(onCountryChange).toHaveBeenLastCalledWith(undefined);
  });

  it("fixes a country: the select is off, numbers stay that country's", async () => {
    render(<PhoneInput label="Phone number" country="AU" defaultValue="+61298765432" />);
    expect(field().value).toBe("(02) 9876 5432");
    expect(country().getAttribute("aria-disabled")).toBe("true");
    expect(country().tabIndex).toBe(-1);
    // No International option with a fixed country.
    expect(options()[0]?.getAttribute("data-ok-value")).not.toBe("");
  });

  it("keeps the calling code of a fixed international country", async () => {
    const onChange = vi.fn();
    render(
      <PhoneInput
        label="Phone number"
        country="AU"
        international
        defaultValue="+61298765432"
        onChange={onChange}
      />,
    );
    const input = field();
    expect(input.value).toBe("+61 2 9876 5432");
    await userEvent.clear(input);
    expect(input.value).toBe("+61");
    expect(onChange).toHaveBeenLastCalledWith("", expect.objectContaining({ value: "" }));
  });

  it("hides the select", () => {
    render(<PhoneInput label="Phone number" hideSelect country="AU" international />);
    expect(screen.queryByRole("combobox")).toBeNull();
    expect(field().closest("[data-ok-phone-input]")?.hasAttribute("data-ok-hide-select")).toBe(
      true,
    );
  });

  it("is controlled: outside values show, refused changes go back", async () => {
    const onChange = vi.fn();
    render(<Controlled onChange={onChange} />);
    const input = field();
    expect(input.value).toBe("(02) 9876 5432");
    await userEvent.click(screen.getByRole("button", { name: "France" }));
    expect(input.value).toBe("01 23 45 67 89");
    expect(country().textContent).toContain("France");
    await userEvent.clear(input);
    await userEvent.type(input, "+849");
    // The parent refused Vietnam: the field shows its value again.
    expect(onChange).toHaveBeenLastCalledWith("+849");
    expect(input.value).toBe("");
    expect(screen.getByRole("status").textContent).toBe("");
  });

  it("limits countries, orders them, names them and leaves International out", () => {
    render(
      <PhoneInput
        label="Phone number"
        countries={["AU", "VN", "FR"]}
        countryOptionsOrder={["VN", "..."]}
        addInternationalOption={false}
        labels={{ FR: "La France", country: "Pays" }}
        locale="fr"
      />,
    );
    const names = screen
      .getAllByRole("option", { hidden: true })
      .map((option) => option.querySelector("[data-ok-list-item-text-primary]")?.textContent);
    expect(names).toEqual(["Viêt Nam", "Australie", "La France"]);
    expect(screen.getByRole("combobox", { name: "Pays" })).toBeTruthy();
  });

  it("validates after the field is left once", async () => {
    render(
      <PhoneInput
        label="Phone number"
        defaultCountry="AU"
        validate
        invalidText="Enter a valid phone number"
        helperText="We call you back"
      />,
    );
    const input = field();
    await userEvent.type(input, "0298");
    expect(input.getAttribute("aria-invalid")).toBeNull();
    // Back to the country select (Firefox keeps the focus on a last control Tab leaves).
    await userEvent.tab({ shift: true });
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByText("Enter a valid phone number")).toBeTruthy();
    await userEvent.type(input, "765432");
    expect(input.getAttribute("aria-invalid")).toBeNull();
    expect(screen.getByText("We call you back")).toBeTruthy();
  });

  it("validates with an empty helper text, and keeps an error given by the app", async () => {
    const onBlur = vi.fn();
    const { container } = render(
      <PhoneInput label="Phone number" validate invalidText="Invalid" onBlur={onBlur} error />,
    );
    expect(container.querySelector("[data-ok-text-field-helper]")?.textContent).toBe("");
    await userEvent.click(field());
    // Back to the country select (Firefox keeps the focus on a last control Tab leaves).
    await userEvent.tab({ shift: true });
    expect(onBlur).toHaveBeenCalledTimes(1);
    expect(field().getAttribute("aria-invalid")).toBe("true");
  });

  it("limits the length, takes other metadata and disables the select with the field", async () => {
    render(
      <PhoneInput
        label="Phone number"
        defaultCountry="US"
        limitMaxLength
        metadata={maxMetadata}
        disabled
      />,
    );
    expect(country().getAttribute("aria-disabled")).toBe("true");
    expect(field().disabled).toBe(true);
  });

  it("refuses digits past the longest number", async () => {
    render(<PhoneInput label="Phone number" defaultCountry="US" limitMaxLength />);
    await userEvent.type(field(), "213373425399");
    expect(field().value).toBe("(213) 373-4253");
  });

  it("keeps the focus on the select when asked, and follows new settings", async () => {
    const { rerender } = render(
      <PhoneInput
        label="Phone number"
        focusInputOnCountrySelection={false}
        defaultValue="+61298765432"
      />,
    );
    await pick("NZ");
    expect(document.activeElement).not.toBe(field());
    rerender(
      <PhoneInput
        label="Phone number"
        focusInputOnCountrySelection={false}
        defaultValue="+61298765432"
        international
      />,
    );
    expect(field().value.startsWith("+")).toBe(true);
  });

  it("renders on the server like on the client, and in StrictMode", () => {
    const element = <PhoneInput id="ssr" label="Phone number" defaultCountry="AU" />;
    const html = renderToString(element);
    expect(html).toContain('data-ok-default-country="AU"');
    expect(html).toContain('type="tel"');
    render(<StrictMode>{element}</StrictMode>);
    expect(field().value).toBe("");
    act(() => field().focus());
  });
});
