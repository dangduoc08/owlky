import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { createPhoneInputController, phoneDeletion, writePhoneInput } from "./controller.js";

let input: HTMLInputElement;

const mount = () => {
  input = document.createElement("input");
  input.type = "tel";
  document.body.append(input);
  return input;
};

afterEach(() => input?.remove());

describe("phone deletion", () => {
  it("removes the nearest digit across formatting characters", () => {
    expect(phoneDeletion("(02) 9876", 5, true)).toEqual({ text: "(0) 9876", caret: 2 });
    expect(phoneDeletion("(02) 9876", 3, false)).toEqual({ text: "(02) 876", caret: 3 });
    expect(phoneDeletion("+61 2", 3, false)).toEqual({ text: "+61 ", caret: 3 });
  });

  it("leaves digits, edges and formatting without digits to the browser", () => {
    expect(phoneDeletion("(02) 9876", 2, true)).toBeNull();
    expect(phoneDeletion("(02)", 1, true)).toBeNull();
    expect(phoneDeletion("(02) ", 5, false)).toBeNull();
    expect(phoneDeletion("12 ", 3, false)).toBeNull();
    expect(phoneDeletion("", 0, true)).toBeNull();
    expect(phoneDeletion("( )", 2, false)).toBeNull();
  });
});

describe("phone input controller", () => {
  it("reports typed text with the caret", async () => {
    const onInput = vi.fn();
    const controller = createPhoneInputController(mount(), { onInput });
    await userEvent.type(input, "12");
    expect(onInput).toHaveBeenLastCalledWith("12", 2);
    controller.destroy();
    await userEvent.type(input, "3");
    expect(onInput).toHaveBeenCalledTimes(2);
  });

  it("deletes across formatting instead of the browser", async () => {
    const onInput = vi.fn();
    const controller = createPhoneInputController(mount(), { onInput }, { input: false });
    input.value = "(02) 9876";
    input.focus();
    input.setSelectionRange(5, 5);
    await userEvent.keyboard("{Backspace}");
    expect(onInput).toHaveBeenCalledWith("(0) 9876", 2);
    // The browser didn't delete the space.
    expect(input.value).toBe("(02) 9876");
    input.setSelectionRange(3, 3);
    await userEvent.keyboard("{Delete}");
    expect(onInput).toHaveBeenLastCalledWith("(02) 876", 3);
    controller.destroy();
  });

  it("lets other deletions and edits through", async () => {
    const onInput = vi.fn();
    const controller = createPhoneInputController(mount(), { onInput }, { input: false });
    input.value = "(02) 9876";
    input.focus();
    input.setSelectionRange(2, 2);
    await userEvent.keyboard("{Backspace}");
    expect(input.value).toBe("(2) 9876");
    // A selection is deleted by the browser.
    input.setSelectionRange(0, 3);
    await userEvent.keyboard("{Backspace}");
    expect(input.value).toBe(" 9876");
    await userEvent.type(input, "5");
    expect(onInput).not.toHaveBeenCalled();
    input.dispatchEvent(new InputEvent("beforeinput", { inputType: "insertText", data: "1" }));
    expect(onInput).not.toHaveBeenCalled();
    controller.destroy();
  });

  it("writes the text and, with focus, the caret", () => {
    mount();
    writePhoneInput(input, "(02) 9876", 3);
    expect(input.value).toBe("(02) 9876");
    input.focus();
    writePhoneInput(input, "(02) 9876", 3);
    expect(input.selectionStart).toBe(3);
    writePhoneInput(input, "(02) 9876", 3);
    expect(input.selectionEnd).toBe(3);
  });
});
