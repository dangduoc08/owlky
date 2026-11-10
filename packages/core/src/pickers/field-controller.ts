/**
 * Sectioned field controller (ADR-0022): keys, typing and paste on a `role=group` of
 * `role=spinbutton` sections. It reports intent — new section texts, the active section — and
 * never writes them: the owner renders, then calls `sync()` so the active section keeps focus and
 * its text stays selected. Select-all (Ctrl / ⌘ + A) is shown with `data-ok-all-selected` on the
 * group: browsers keep the selection inside the focused editable section.
 */
import { adjustSection, parsePastedText, typeInSection } from "./field.js";
import type { FormatSection } from "./format.js";

export interface FieldControllerState {
  sections: readonly FormatSection[];
  values: readonly string[];
  /** What each section shows when empty. */
  placeholders: readonly string[];
  locale: string;
  /** Empty sections take this date's parts on ArrowUp / ArrowDown. */
  reference: Date;
  disabled: boolean;
  readOnly: boolean;
}

export interface FieldControllerOptions {
  read(): FieldControllerState;
  /** New texts for every section (one key, a paste, a clear). */
  onValuesChange(values: string[]): void;
  /** The section that has (or last had) focus; render `tabindex="0"` on it. */
  onActiveSectionChange?(index: number): void;
  /** Every section was selected (Ctrl / ⌘ + A, `selectAll()`). */
  onSelectAll?(): void;
}

export interface FieldController {
  /** After a render: keeps the active section focused and its text selected. */
  sync(): void;
  /** Focuses a section (`"last"`: the last one). */
  focusSection(index: number | "last"): void;
  /** Focuses the field and selects every section (as Ctrl / ⌘ + A does). */
  selectAll(): void;
  /** Leaves no section selected (focus stays where it is). */
  clearSelection(): void;
  /** The section that holds focus, or `null` when the field doesn't have focus. */
  focusedSection(): number | null;
  /** Every section is selected. */
  isAllSelected(): boolean;
  destroy(): void;
}

/** Typed digits / letters older than this start a new query (MUI). */
const QUERY_TIMEOUT = 5000;

const STEP: Record<string, number | "min" | "max"> = {
  ArrowUp: 1,
  ArrowDown: -1,
  PageUp: 5,
  PageDown: -5,
  Home: "min",
  End: "max",
};

export function createFieldController(
  group: HTMLElement,
  options: FieldControllerOptions,
): FieldController {
  const controller = new AbortController();
  const { signal } = controller;
  const doc = group.ownerDocument;
  let active = -1;
  let query = "";
  let queryIndex = -1;
  let queryAt = 0;
  let allSelected = false;
  const setAllSelected = (on: boolean) => {
    allSelected = on;
    group.toggleAttribute("data-ok-all-selected", on);
  };

  const spinbuttons = () => [...group.querySelectorAll<HTMLElement>('[role="spinbutton"]')];
  const indexOf = (target: EventTarget | null) =>
    spinbuttons().indexOf(
      (target as Element | null)?.closest?.('[role="spinbutton"]') as HTMLElement,
    );
  const editable = () => {
    const state = options.read();
    return !state.disabled && !state.readOnly;
  };

  const select = (element: Node) => {
    const selection = doc.getSelection() as Selection;
    const range = doc.createRange();
    range.selectNodeContents(element);
    selection.removeAllRanges();
    selection.addRange(range);
  };

  const setActive = (index: number) => {
    if (index === active) return;
    active = index;
    query = "";
    options.onActiveSectionChange?.(index);
  };

  const focusSection = (index: number | "last") => {
    const list = spinbuttons();
    const at = index === "last" ? list.length - 1 : Math.min(Math.max(index, 0), list.length - 1);
    const element = list[at];
    if (!element) return;
    setAllSelected(false);
    setActive(at);
    element.focus();
    select(element);
  };

  const change = (values: string[]) => {
    options.onValuesChange(values);
  };

  const typeKey = (key: string) => {
    if (!editable()) return;
    const state = options.read();
    let values = [...state.values];
    let index = Math.max(active, 0);
    if (allSelected) {
      values = values.map(() => "");
      index = 0;
      setAllSelected(false);
      setActive(0);
    }
    const now = Date.now();
    if (queryIndex !== index || now - queryAt > QUERY_TIMEOUT) query = "";
    const typed = typeInSection(index, key, query, values, state.sections, state.locale);
    if (!typed) return;
    values[index] = typed.value;
    query = typed.query;
    queryIndex = index;
    queryAt = now;
    change(values);
    if (typed.done && index < state.sections.length - 1) {
      query = "";
      focusSection(index + 1);
    }
  };

  const clear = () => {
    if (!editable()) return;
    const state = options.read();
    query = "";
    if (allSelected) {
      setAllSelected(false);
      change(state.values.map(() => ""));
      focusSection(0);
      return;
    }
    if (active < 0) return;
    const values = [...state.values];
    values[active] = "";
    change(values);
  };

  group.addEventListener(
    "focusin",
    (event) => {
      const index = indexOf(event.target);
      if (index === -1) return;
      setActive(index);
      select(event.target as Node);
    },
    { signal },
  );

  group.addEventListener(
    "keydown",
    (event) => {
      if (event.defaultPrevented) return;
      const state = options.read();
      if (state.disabled) return;
      const key = event.key;
      if ((event.ctrlKey || event.metaKey) && key.toLowerCase() === "a") {
        event.preventDefault();
        setAllSelected(true);
        options.onSelectAll?.();
        return;
      }
      if (key === "ArrowLeft" || key === "ArrowRight") {
        event.preventDefault();
        const list = spinbuttons();
        // Right to left (ADR-0030): sections run from the right, so ← moves to the next one.
        const back = (key === "ArrowLeft") !== (getComputedStyle(group).direction === "rtl");
        const from = allSelected ? (back ? 0 : list.length - 1) : Math.max(active, 0);
        const to = allSelected ? from : from + (back ? -1 : 1);
        focusSection(Math.min(Math.max(to, 0), list.length - 1));
        return;
      }
      const step = STEP[key];
      if (step !== undefined && !event.altKey) {
        event.preventDefault();
        if (!editable()) return;
        const index = allSelected ? 0 : Math.max(active, 0);
        if (allSelected) focusSection(0);
        const values = [...state.values];
        values[index] = adjustSection(
          index,
          step,
          values,
          state.sections,
          state.locale,
          state.reference,
        );
        query = "";
        change(values);
        return;
      }
      if (key === "Backspace" || key === "Delete") {
        event.preventDefault();
        clear();
      }
    },
    { signal },
  );

  // Typing (keyboards, phone keypads, dictation): never let the browser edit the text.
  group.addEventListener(
    "beforeinput",
    (event) => {
      const input = event as InputEvent;
      if (input.inputType.startsWith("delete")) {
        event.preventDefault();
        clear();
        return;
      }
      if (input.inputType === "insertFromPaste" || input.inputType === "insertFromDrop") {
        event.preventDefault();
        return;
      }
      if (!input.inputType.startsWith("insert")) return;
      // Composition text can't be canceled; the `input` listener below puts the text back.
      if (input.cancelable) event.preventDefault();
      else return;
      for (const char of [...(input.data ?? "")].slice(0, 16)) typeKey(char);
    },
    { signal },
  );

  // Text the browser changed anyway (IME composition): restore it, then apply what was typed.
  group.addEventListener(
    "input",
    (event) => {
      const index = indexOf(event.target);
      if (index === -1) return;
      const element = spinbuttons()[index] as HTMLElement;
      const state = options.read();
      element.textContent = state.values[index] || (state.placeholders[index] as string);
      const data = (event as InputEvent).data;
      if (data) for (const char of [...data].slice(0, 16)) typeKey(char);
      select(element);
    },
    { signal },
  );

  group.addEventListener(
    "paste",
    (event) => {
      event.preventDefault();
      if (!editable()) return;
      const text = event.clipboardData?.getData("text/plain") ?? "";
      const state = options.read();
      const pasted = parsePastedText(text, state.sections, state.locale);
      if (pasted) {
        setAllSelected(false);
        change(pasted);
        focusSection("last");
        return;
      }
      // Not the whole value: type it into the active section.
      for (const char of [...text].slice(0, 16)) typeKey(char);
    },
    { signal },
  );

  // A press on the field outside the sections focuses one (the first empty, else the last).
  group.addEventListener(
    "mousedown",
    (event) => {
      if (indexOf(event.target) !== -1 || options.read().disabled) return;
      event.preventDefault();
      const empty = options.read().values.indexOf("");
      focusSection(empty === -1 ? "last" : empty);
    },
    { signal },
  );

  group.addEventListener(
    "focusout",
    (event) => {
      if (group.contains(event.relatedTarget as Node | null)) return;
      setAllSelected(false);
      query = "";
    },
    { signal },
  );

  return {
    sync() {
      const focused = doc.activeElement;
      if (!focused || !group.contains(focused)) return;
      select(focused);
    },
    focusSection,
    selectAll() {
      const list = spinbuttons();
      const element = list[Math.max(active, 0)] ?? list[0];
      if (!element) return;
      if (!group.contains(doc.activeElement)) element.focus();
      setAllSelected(true);
      options.onSelectAll?.();
    },
    clearSelection() {
      setAllSelected(false);
      if (group.contains(doc.activeElement)) doc.getSelection()?.removeAllRanges();
    },
    focusedSection() {
      const index = indexOf(doc.activeElement);
      return index === -1 ? null : index;
    },
    isAllSelected: () => allSelected,
    destroy() {
      controller.abort();
    },
  };
}

/** What `selectedSections` and `setSelectedSections` take (MUI `FieldSelectedSections`). */
export type FieldSelectedSections = number | FormatSection["type"] | "all" | null;

/** One section of a field, as the field API reports it (MUI `FieldSection`, the parts Owlky has). */
export interface FieldSection {
  /** `"day"`, `"month"`, `"year"`, `"hours"`… */
  type: FormatSection["type"];
  /** The token, such as `MM`. */
  format: string;
  /** Digits or letters. */
  contentType: FormatSection["contentType"];
  /** The section's text, `""` when empty. */
  value: string;
  /** What the section shows when empty, such as `MM`. */
  placeholder: string;
  /** Text before the section (only on the first one). */
  startSeparator: string;
  /** Text after the section. */
  endSeparator: string;
}

/** The field API (MUI `fieldRef`): React `fieldRef`, HTML instance methods. */
export interface FieldApi {
  /** Every section with its text. */
  getSections(): FieldSection[];
  /** The selected section's index, or `null` when no section is selected. */
  getActiveSectionIndex(): number | null;
  /** Selects a section by index or type, every section (`"all"`) or none (`null`). */
  setSelectedSections(selected: FieldSelectedSections): void;
  /** Focuses the field: the first section, or the given one. */
  focusField(selected?: number | FormatSection["type"]): void;
  /** The field has focus. */
  isFieldFocused(): boolean;
}

/** The index a `selectedSections` value names: an index, or the first section of a type. */
export function resolveSelectedSection(
  selected: FieldSelectedSections | undefined,
  sections: readonly FormatSection[],
): number | "all" | null {
  if (selected === "all") return "all";
  if (typeof selected === "number")
    return Number.isInteger(selected) && selected >= 0 && selected < sections.length
      ? selected
      : null;
  if (typeof selected !== "string") return null;
  const index = sections.findIndex((section) => section.type === selected);
  return index === -1 ? null : index;
}

/** The field API on a controller (shared by React's `fieldRef` and the HTML instance). */
export function createFieldApi(
  controller: FieldController,
  read: () => {
    sections: readonly FormatSection[];
    values: readonly string[];
    placeholders: readonly string[];
  },
): FieldApi {
  return {
    getSections() {
      const { sections, values, placeholders } = read();
      return sections.map((section, i) => ({
        type: section.type,
        format: section.token,
        contentType: section.contentType,
        value: values[i] ?? "",
        placeholder: placeholders[i] ?? "",
        startSeparator: section.startSeparator,
        endSeparator: section.endSeparator,
      }));
    },
    getActiveSectionIndex() {
      if (controller.isAllSelected()) return 0;
      return controller.focusedSection();
    },
    setSelectedSections(selected) {
      const target = resolveSelectedSection(selected, read().sections);
      if (target === "all") controller.selectAll();
      else if (target === null) controller.clearSelection();
      else controller.focusSection(target);
    },
    focusField(selected = 0) {
      const target = resolveSelectedSection(selected, read().sections);
      controller.focusSection(typeof target === "number" ? target : 0);
    },
    isFieldFocused() {
      return controller.focusedSection() !== null;
    },
  };
}
