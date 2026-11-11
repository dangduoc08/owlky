/*
 * Phone input controller (ADR-0061): reports what the person typed, with the caret, so the owner
 * can format it (`phoneInputChange`) and write the text back. Backspace or Delete next to a
 * formatting character (a space, a bracket) removes the nearest digit instead, so the formatting
 * the owner writes back can't undo the deletion.
 */

/** Callbacks of `createPhoneInputController`. */
export interface PhoneInputControllerOptions {
  /** The input's new text and caret (before formatting). */
  onInput(text: string, caret: number): void;
}

export interface PhoneInputController {
  destroy(): void;
}

const MEANINGFUL = /[+\d]/;

/**
 * The text after a Backspace (`backward`) or Delete at `caret` when the character it would remove
 * is formatting: the nearest digit in that direction goes instead. `null`: the default deletion is
 * fine (a digit, or no digit in that direction).
 */
export function phoneDeletion(
  text: string,
  caret: number,
  backward: boolean,
): { text: string; caret: number } | null {
  const next = backward ? text[caret - 1] : text[caret];
  if (next === undefined || MEANINGFUL.test(next)) return null;
  if (backward) {
    for (let index = caret - 2; index >= 0; index--)
      if (MEANINGFUL.test(text[index] as string))
        return { text: text.slice(0, index) + text.slice(index + 1), caret: index };
  } else {
    for (let index = caret + 1; index < text.length; index++)
      if (MEANINGFUL.test(text[index] as string))
        return { text: text.slice(0, index) + text.slice(index + 1), caret };
  }
  return null;
}

/**
 * Listens to the input. `input: false` leaves the `input` event to the owner (React reads it
 * through its own `onChange`); deletions across formatting are always reported here.
 */
export function createPhoneInputController(
  input: HTMLInputElement,
  options: PhoneInputControllerOptions,
  { input: listenToInput = true }: { input?: boolean } = {},
): PhoneInputController {
  const controller = new AbortController();
  const { signal } = controller;
  input.addEventListener(
    "beforeinput",
    (event) => {
      const backward = event.inputType === "deleteContentBackward";
      if (!backward && event.inputType !== "deleteContentForward") return;
      const start = input.selectionStart;
      if (start === null || start !== input.selectionEnd) return;
      const deletion = phoneDeletion(input.value, start, backward);
      if (!deletion) return;
      event.preventDefault();
      options.onInput(deletion.text, deletion.caret);
    },
    { signal },
  );
  if (listenToInput)
    input.addEventListener(
      "input",
      () => options.onInput(input.value, input.selectionStart ?? input.value.length),
      { signal },
    );
  return { destroy: () => controller.abort() };
}

/** Writes the text and, when the input has focus, the caret (no write when nothing changed). */
export function writePhoneInput(input: HTMLInputElement, text: string, caret: number): void {
  if (input.value !== text) input.value = text;
  const root = input.getRootNode() as Document | ShadowRoot;
  if (root.activeElement === input && input.selectionStart !== caret)
    input.setSelectionRange(caret, caret);
}
