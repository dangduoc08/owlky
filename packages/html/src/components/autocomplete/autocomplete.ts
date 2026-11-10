import {
  AUTOCOMPLETE_LIST_HEIGHT,
  AUTOCOMPLETE_OPTION_STRIDE,
  type AutocompleteHighlightReason,
  type AutocompleteOption,
  autocompleteOptions,
  blursOnSelect,
  createComboboxController,
  defaultLimitTagsText,
  filterOptions,
  inlineCompletion,
  listSubheaderAttributes,
  nextAutocompleteValue,
  normalizeOption,
  optionStride,
  readFreeSoloDefault,
  readNumber,
  scrollToRow,
  showCompletion,
  virtualRange,
} from "@owlky/core";
import { defineComponent } from "../../runtime/define.js";
import type { ComponentInstance, EventSpec } from "../../runtime/types.js";
import type { PopoverInstance } from "../popover/popover.js";

/** Events of this component (`ok:<name>:<event>` on the root). */
export interface AutocompleteEvents {
  /** Before the value changes. Call `preventDefault()` to keep the current one. */
  change: EventSpec<{ value: string | string[] | null }, true>;
  /** After the listbox opened. */
  open: EventSpec<{ reason: string }>;
  /** After the listbox closed. */
  close: EventSpec<{ reason: string }>;
  /** After the highlighted option changed (keyboard, pointer or automatic). `value` is `null` when none is. */
  highlight: EventSpec<{ value: string | null; reason: string }>;
}

export interface AutocompleteInstance extends ComponentInstance {
  /** Option value(s) or typed text: `string | null`, or `string[]` with `data-ok-multiple`. */
  readonly value: string | string[] | null;
  /** Sets the value without emitting events. */
  setValue(value: string | readonly string[] | null): void;
  /** Replaces the options (strings or `{ value, label, disabled?, group? }`), such as loaded ones. */
  setOptions(options: readonly (string | AutocompleteOption)[]): void;
  /** Whether the listbox is open. */
  readonly isOpen: boolean;
  /** Opens the listbox. */
  open(): void;
  /** Closes the listbox. */
  close(): void;
}

const {
  multiple,
  freeSolo,
  disableCloseOnSelect,
  openOnFocus,
  autoHighlight,
  limitTags,
  autoComplete,
  autoSelect,
  blurOnSelect,
  clearOnBlur,
  clearOnEscape,
  disabledItemsFocusable,
  disableListWrap,
  filterSelectedOptions,
  handleHomeEndKeys,
  includeInputInList,
  loading,
  readOnly,
  resetHighlightOnMouseLeave,
  selectOnFocus,
  virtualize,
} = autocompleteOptions.options;

const OPTION = '[role="option"]';
const SUBHEADER = "[data-ok-list-subheader]";

/**
 * Autocomplete — spec: specs/components/autocomplete.md
 *
 * Markup:  <div data-ok-autocomplete [data-ok-multiple]>
 *            <div data-ok-text-field …><label …>Movie</label><div data-ok-text-field-control>
 *              <input id="m" data-ok-text-field-input role="combobox" aria-autocomplete="list"
 *                     aria-expanded="false" aria-controls="m-listbox" autocomplete="off" placeholder=" ">
 *              <span data-ok-text-field-adornment="end">…clear and toggle icon buttons…</span> …
 *            <template data-ok-autocomplete-tag>…a small Chip with a delete button…</template>  (multiple)
 *            <div data-ok-popover data-ok-autocomplete-paper popover="manual" data-ok-disable-auto-focus …>
 *              <ul role="listbox" id="m-listbox"><li role="option" id="m-option-0" data-ok-value="a" aria-selected="false">A</li>…</ul>
 *              <div data-ok-autocomplete-no-options hidden>No options</div>
 *            </div>
 *          </div>
 * Behavior: typing filters the options (others get `hidden`) and opens the list; core
 *          `createComboboxController` handles keys, clicks and blur; the list is the Popover runtime
 *          anchored to the field. Values drawn as chips are cloned from the template (multiple, or
 *          a single value with a template); deleting a chip removes its value. Group headings are
 *          `li[data-ok-list-subheader]` before their options. `data-ok-virtualize` keeps the
 *          options in memory and draws only the ones in view.
 * Events:  ok:autocomplete:change (cancelable, `{ value }`), ok:autocomplete:open / close
 *          (`{ reason }`), ok:autocomplete:highlight (`{ value, reason }`).
 */
export const autocomplete = defineComponent<AutocompleteInstance, AutocompleteEvents>({
  name: "autocomplete",
  selector: "[data-ok-autocomplete]",

  setup(element, { emit, signal, runtime }) {
    const input = element.querySelector<HTMLInputElement>('[role="combobox"]') as HTMLInputElement;
    const doc = element.getRootNode() as Document | ShadowRoot;
    const listbox = doc.getElementById(input.getAttribute("aria-controls") ?? "") as HTMLElement;
    const paper = listbox.closest<HTMLElement>("[data-ok-popover]") as HTMLElement;
    const control = input.closest<HTMLElement>("[data-ok-text-field-control]") as HTMLElement;
    const noOptions = paper.querySelector<HTMLElement>(
      "[data-ok-autocomplete-no-options]",
    ) as HTMLElement;
    const loadingText = paper.querySelector<HTMLElement>("[data-ok-autocomplete-loading]");
    const clear = element.querySelector<HTMLElement>("[data-ok-autocomplete-clear]");
    const toggle = element.querySelector<HTMLElement>("[data-ok-autocomplete-toggle]");
    const template = element.querySelector<HTMLTemplateElement>(
      "template[data-ok-autocomplete-tag]",
    );
    const is = (spec: { attr: string }) => element.hasAttribute(spec.attr);
    const free = () => is(freeSolo);
    const locked = () => is(readOnly) || input.disabled;
    // Values drawn as chips: multiple, or a single value with a chip template (React `renderValue`).
    const chips = () => is(multiple) || template !== null;

    // Virtualized: every option element is kept here; the listbox holds the ones in view.
    let pool: HTMLElement[] | null = null;
    const options = () => pool ?? [...listbox.querySelectorAll<HTMLElement>(OPTION)];
    const optionValue = (option: Element) => option.getAttribute("data-ok-value") as string;
    const labelOf = (v: string) =>
      (
        options().find((option) => optionValue(option) === v)?.textContent as string | undefined
      )?.trim() ?? v;
    const tagValues = () =>
      [...control.querySelectorAll("[data-ok-chip][data-ok-value]")].map(optionValue);

    let values = is(multiple)
      ? tagValues()
      : options()
          .filter((option) => option.getAttribute("aria-selected") === "true")
          .map(optionValue)
          .slice(0, 1);
    if (!is(multiple) && values.length === 0 && free() && input.value) values = [input.value];
    let open = false;
    let highlighted = -1;
    let reason: AutocompleteHighlightReason = "auto";
    let complete = false;
    let dirty = false;
    let focused = false;
    // What people typed (the input may show an inline completion instead).
    let typed = input.value;
    const setText = (text: string) => {
      typed = text;
      input.value = text;
    };
    const singleText = () => (chips() || values[0] === undefined ? "" : labelOf(values[0]));
    if (chips() && !is(multiple)) setText("");
    const visible = () => options().filter((option) => !option.hidden);
    const popover = () => runtime.getOrCreate<PopoverInstance>(paper, "popover") as PopoverInstance;

    // Removing a chip that holds focus fires focusout, which renders again: skip that re-entry.
    let rendering = false;
    const renderTags = () => {
      // Without a chip template (markup error), chips can't be drawn.
      if (!chips() || !template || rendering) return;
      rendering = true;
      try {
        drawTags();
      } finally {
        rendering = false;
      }
    };
    const drawTags = () => {
      for (const chip of control.querySelectorAll("[data-ok-chip][data-ok-value]")) chip.remove();
      control.querySelector("[data-ok-autocomplete-more]")?.remove();
      let start = control.querySelector<HTMLElement>('[data-ok-text-field-adornment="start"]');
      if (values.length === 0) {
        start?.remove();
        return;
      }
      if (!start) {
        start = document.createElement("span");
        start.setAttribute("data-ok-text-field-adornment", "start");
        control.insertBefore(start, input);
      }
      const limit = readNumber(element, limitTags);
      const hidden = !focused && typeof limit === "number" ? Math.max(values.length - limit, 0) : 0;
      const holder = start;
      values.forEach((v, index) => {
        // The template holds a small soft Chip with its label and delete button.
        const chip = (template as HTMLTemplateElement).content.firstElementChild?.cloneNode(
          true,
        ) as HTMLElement;
        chip.setAttribute("data-ok-value", v);
        (chip.querySelector("[data-ok-chip-label]") as Element).textContent = labelOf(v);
        const remove = chip.querySelector("[data-ok-chip-delete]");
        if (is(readOnly)) remove?.remove();
        else remove?.setAttribute("aria-label", `Remove ${labelOf(v)}`);
        chip.hidden = index >= values.length - hidden;
        holder.append(chip);
      });
      if (hidden > 0) {
        const more = document.createElement("span");
        more.setAttribute("data-ok-autocomplete-more", "");
        more.textContent = defaultLimitTagsText(hidden);
        start.append(more);
      }
    };

    // Virtualized list: draw the window of visible options between two paddings.
    let stride = AUTOCOMPLETE_OPTION_STRIDE;
    let measured = false;
    const drawWindow = (shown: HTMLElement[]) => {
      if (!pool) return;
      if (!open) {
        listbox.replaceChildren();
        return;
      }
      const step = stride;
      const range = virtualRange(
        listbox.scrollTop,
        listbox.clientHeight || AUTOCOMPLETE_LIST_HEIGHT,
        step,
        shown.length,
      );
      const rows = shown.slice(range.start, range.end);
      rows.forEach((row, i) => {
        row.setAttribute("aria-setsize", String(shown.length));
        row.setAttribute("aria-posinset", String(range.start + i + 1));
      });
      if (rows.length !== listbox.children.length || rows.some((r, i) => listbox.children[i] !== r))
        listbox.replaceChildren(...rows);
      listbox.style.setProperty("--_ok-autocomplete-before", `${range.start * step}px`);
      listbox.style.setProperty(
        "--_ok-autocomplete-after",
        `${(shown.length - range.end) * step}px`,
      );
      if (!measured && rows.length > 0) {
        measured = true;
        stride = optionStride(listbox);
        if (stride !== step) drawWindow(shown);
      }
    };

    const apply = () => {
      const query = dirty ? typed : "";
      const matching = new Set(
        filterOptions(
          options().map((o) => ({ o, label: o.textContent as string })),
          query,
        ).map((m) => m.o),
      );
      for (const option of options()) {
        const selected = values.includes(optionValue(option));
        option.hidden = !matching.has(option) || (selected && is(filterSelectedOptions));
        option.setAttribute("aria-selected", String(selected));
        const box = option.querySelector<HTMLInputElement>('input[type="checkbox"]');
        if (box) box.checked = selected;
      }
      // A group heading shows while one of its options does.
      let heading: HTMLElement | null = null;
      let any = false;
      for (const child of pool ? [] : listbox.children) {
        if (child.matches(SUBHEADER)) {
          if (heading) heading.hidden = !any;
          heading = child as HTMLElement;
          any = false;
        } else if (!(child as HTMLElement).hidden) any = true;
      }
      if (heading) heading.hidden = !any;
      const shown = visible();
      const showLoading = is(loading) && shown.length === 0;
      if (loadingText) loadingText.hidden = !showLoading;
      noOptions.hidden = shown.length > 0 || showLoading;
      if (highlighted >= shown.length) highlighted = -1;
      const active = open && highlighted >= 0 ? shown[highlighted] : undefined;
      if (pool && active)
        listbox.scrollTop = scrollToRow(
          listbox.scrollTop,
          listbox.clientHeight || AUTOCOMPLETE_LIST_HEIGHT,
          stride,
          highlighted,
        );
      drawWindow(shown);
      for (const option of options()) option.toggleAttribute("data-ok-focused", option === active);
      if (active) {
        input.setAttribute("aria-activedescendant", active.id);
        active.scrollIntoView({ block: "nearest" });
      } else input.removeAttribute("aria-activedescendant");
      const completion =
        is(autoComplete) && active
          ? inlineCompletion(
              typed,
              (active.textContent as string).trim(),
              complete ? reason : undefined,
            )
          : null;
      if (completion !== null) showCompletion(input, typed, completion);
      else if (input.value !== typed) input.value = typed;
      input.setAttribute("aria-autocomplete", is(autoComplete) ? "both" : "list");
      input.setAttribute("aria-expanded", String(open));
      element.toggleAttribute("data-ok-open", open);
      if (toggle) {
        toggle.hidden = is(readOnly);
        toggle.setAttribute(
          "aria-label",
          toggle.getAttribute(open ? "data-ok-label-close" : "data-ok-label-open") as string,
        );
      }
      if (clear) clear.hidden = locked() || (values.length === 0 && typed === "");
    };

    const highlight = (index: number, why: AutocompleteHighlightReason, completes: boolean) => {
      const before = highlighted;
      highlighted = index;
      reason = why;
      complete = completes;
      apply();
      if (index !== before) {
        const option = index >= 0 ? visible()[index] : undefined;
        emit("highlight", { value: option ? optionValue(option) : null, reason: why });
      }
    };

    const setOpen = (next: boolean, why: string) => {
      if (next === open || (next && locked())) return;
      open = next;
      if (!next) highlighted = -1;
      if (next) {
        paper.style.setProperty("--_ok-autocomplete-width", `${control.offsetWidth}px`);
        popover().open(control);
      } else if (popover().isOpen) popover().close();
      apply();
      emit(next ? "open" : "close", { reason: why });
    };

    const commit = (next: string[]) => {
      const value = is(multiple) ? next : (next[0] ?? null);
      if (!emit("change", { value }, { cancelable: true })) return false;
      values = next;
      renderTags();
      apply();
      return true;
    };

    const select = (option: HTMLElement, why: string) => {
      const v = optionValue(option);
      if (!commit(nextAutocompleteValue(values, v, is(multiple)))) return false;
      dirty = false;
      setText(chips() ? "" : labelOf(v));
      if (!(is(multiple) && is(disableCloseOnSelect)) || why === "blur") setOpen(false, why);
      else apply();
      return true;
    };
    const commitText = (text: string, why: string) => {
      const next = is(multiple) ? (values.includes(text) ? values : [...values, text]) : [text];
      if (!commit(next)) return;
      dirty = false;
      if (chips()) setText("");
      setOpen(false, why);
    };

    const controller = createComboboxController(element, {
      read: () => ({
        open,
        highlighted,
        count: visible().length,
        disabledAt: (i) => visible()[i]?.getAttribute("aria-disabled") === "true",
        freeSolo: free(),
        canRemoveLast: !locked() && chips() && values.length > 0,
        homeEndKeys: readFreeSoloDefault(element, handleHomeEndKeys.attr, free()),
        wrap: !is(disableListWrap),
        includeInput: is(includeInputInList),
        disabledItemsFocusable: is(disabledItemsFocusable),
        clearOnEscape: is(clearOnEscape),
        canClear: !locked() && (values.length > 0 || typed !== ""),
        selectOnFocus: readFreeSoloDefault(element, selectOnFocus.attr, free()),
        resetHighlightOnMouseLeave: is(resetHighlightOnMouseLeave),
      }),
      onOpenChange: (next, why) => setOpen(next, why),
      onHighlight: (index, why) => highlight(index, why, why === "keyboard"),
      onSelect: (index, source) => {
        // The controller only reports indexes of visible options.
        if (!select(visible()[index] as HTMLElement, "select")) return;
        if (blursOnSelect(element.getAttribute(blurOnSelect.attr) as "true", source)) input.blur();
      },
      onCommitText: (text) => commitText(text, "select"),
      onClear: () => {
        setText("");
        dirty = false;
        commit([]);
      },
      onRemoveLast: () => {
        commit(values.slice(0, -1));
      },
      onBlur: () => {
        const active = open && highlighted >= 0 ? visible()[highlighted] : undefined;
        const byKeys = reason === "keyboard" || reason === "auto";
        if (
          is(autoSelect) &&
          active &&
          byKeys &&
          active.getAttribute("aria-disabled") !== "true" &&
          select(active, "blur")
        )
          return;
        if (is(autoSelect) && free() && typed !== "") {
          commitText(typed, "blur");
          return;
        }
        setOpen(false, "blur");
        if (readFreeSoloDefault(element, clearOnBlur.attr, free())) {
          setText(singleText());
          dirty = false;
          apply();
        }
      },
      optionIndex: (option) => visible().indexOf(option),
    });

    input.addEventListener(
      "input",
      () => {
        if (is(readOnly)) return;
        const typing = input.value.length > typed.length;
        typed = input.value;
        dirty = true;
        if (!open) {
          highlighted = is(autoHighlight) ? 0 : -1;
          reason = "auto";
          complete = typing;
          setOpen(true, "input");
        } else if (is(autoHighlight)) highlight(0, "auto", typing);
        else highlight(-1, "auto", false);
      },
      { signal },
    );
    input.addEventListener(
      "focus",
      () => {
        if (is(openOnFocus)) setOpen(true, "focus");
      },
      { signal },
    );
    element.addEventListener(
      "focusin",
      () => {
        if (focused) return;
        focused = true;
        renderTags();
      },
      { signal },
    );
    element.addEventListener(
      "focusout",
      (event) => {
        if (element.contains(event.relatedTarget as Node | null)) return;
        focused = false;
        renderTags();
      },
      { signal },
    );
    // A chip's delete button (chip runtime) removes its value.
    element.addEventListener(
      "ok:chip:delete",
      (event) => {
        // Only the field's chips (cloned from the template) carry a value.
        const chip = (event.target as Element).closest("[data-ok-chip][data-ok-value]") as Element;
        event.preventDefault();
        commit(values.filter((v) => v !== optionValue(chip)));
        input.focus();
      },
      { signal },
    );
    // The popover closes itself on an outside press or Escape.
    paper.addEventListener(
      "ok:popover:close",
      (event) => {
        if (open) setOpen(false, (event as CustomEvent<{ reason: string }>).detail.reason);
      },
      { signal },
    );
    listbox.addEventListener("scroll", () => drawWindow(visible()), { signal, passive: true });
    // Loading and read only may be switched by a page script.
    const watcher = new MutationObserver((records) => {
      if (locked() && open) setOpen(false, "api");
      if (records.some((record) => record.attributeName === readOnly.attr)) renderTags();
      apply();
    });
    watcher.observe(element, { attributeFilter: [loading.attr, readOnly.attr] });

    const startPool = () => {
      if (!is(virtualize)) return;
      pool = options();
      for (const heading of listbox.querySelectorAll(SUBHEADER)) heading.remove();
    };
    startPool();

    const buildOptions = (list: readonly (string | AutocompleteOption)[]) => {
      const rows: HTMLElement[] = [];
      let group: string | undefined;
      list.map(normalizeOption).forEach((option, index) => {
        if (!pool && option.group !== undefined && option.group !== group) {
          const heading = document.createElement("li");
          for (const [name, value] of Object.entries(listSubheaderAttributes()))
            heading.setAttribute(name, value);
          heading.setAttribute("role", "presentation");
          heading.textContent = option.group;
          rows.push(heading);
        }
        group = option.group;
        const row = document.createElement("li");
        row.setAttribute("role", "option");
        row.id = `${input.id}-option-${index}`;
        row.setAttribute("data-ok-value", option.value);
        row.setAttribute("aria-selected", "false");
        if (option.disabled) row.setAttribute("aria-disabled", "true");
        row.textContent = option.label;
        rows.push(row);
      });
      return rows;
    };

    apply();
    return {
      get value() {
        return is(multiple) ? [...values] : (values[0] ?? null);
      },
      setValue(value) {
        values = value == null ? [] : typeof value === "string" ? [value] : [...value];
        if (!is(multiple)) setText(singleText());
        renderTags();
        apply();
      },
      setOptions(list) {
        const rows = buildOptions(list);
        if (pool) pool = rows;
        else listbox.replaceChildren(...rows);
        highlighted = -1;
        if (!chips() && values[0] !== undefined && !dirty && !free()) setText(singleText());
        apply();
      },
      get isOpen() {
        return open;
      },
      open() {
        setOpen(true, "api");
      },
      close() {
        setOpen(false, "api");
      },
      destroy() {
        watcher.disconnect();
        controller.destroy();
      },
    };
  },
});
