/*
 * Editor bubble menu (ADR-0050): a toolbar in a Popover over the selection, Owlky's version of
 * Tiptap's BubbleMenu. The popover controller places it on a virtual anchor (the selection's
 * box); Tiptap's default `shouldShow`; Alt+F10 in the text moves focus into it (else into the main
 * toolbar), Escape goes back with the selection kept. Owners run its buttons like the toolbar's.
 */
import { type Editor, isTextSelection, posToDOMRect } from "@tiptap/core";
import { createPopoverController } from "../popover/popover-controller.js";
import type { Placement } from "../popover/position.js";
import { createToolbarNavigation } from "./toolbar.js";

/** What `shouldShow` gets (Tiptap's `shouldShow` props, without the view internals). */
export interface EditorBubbleMenuShowProps {
  readonly editor: Editor;
  readonly from: number;
  readonly to: number;
}

export interface EditorBubbleMenuOptions {
  /** When the menu shows. Default: a non-empty text selection in an editable editor with focus. */
  readonly shouldShow?: ((props: EditorBubbleMenuShowProps) => boolean) | undefined;
  /** Side of the selection. Default `"top"`. */
  readonly placement?: Placement | undefined;
  /** Waits this long after the selection stops changing (ms; Tiptap's 250). `0`: at once. */
  readonly updateDelay?: number | undefined;
  /** The menu showed or hid. */
  readonly onOpenChange?: ((open: boolean) => void) | undefined;
}

export interface EditorBubbleMenu {
  readonly isOpen: boolean;
  /** Re-checks `shouldShow` and the position now. */
  update(): void;
  /** Moves focus into the menu (Alt+F10); `false` when it isn't showing. */
  focus(): boolean;
  setOptions(options: EditorBubbleMenuOptions): void;
  destroy(): void;
}

/** Tiptap's default: some text is selected, the editor is editable and has focus (or the menu does). */
export function defaultBubbleMenuShow(
  { editor, from, to }: EditorBubbleMenuShowProps,
  menu: HTMLElement,
): boolean {
  const { state, view } = editor;
  const { doc, selection } = state;
  // A double click on an empty paragraph selects nothing visible.
  const emptyText = !doc.textBetween(from, to).length && isTextSelection(selection);
  const focused = view.hasFocus() || menu.contains(menu.ownerDocument.activeElement);
  return focused && editor.isEditable && !selection.empty && !emptyText;
}

export function createEditorBubbleMenu(
  editor: Editor,
  menu: HTMLElement,
  initialOptions: EditorBubbleMenuOptions = {},
): EditorBubbleMenu {
  let options = initialOptions;
  const win = menu.ownerDocument.defaultView as Window;
  const popoverOptions = () => ({
    placement: options.placement ?? ("top" as const),
    autoFocus: false,
    restoreFocus: false,
    closeOnOutside: false,
    // Escape inside the menu goes back to the text; the menu stays over the selection.
    onDismiss: () => {
      // At once (Tiptap's focus command waits a frame); ProseMirror puts its selection back.
      editor.view.focus();
    },
  });
  const popover = createPopoverController(menu, popoverOptions());
  const navigation = createToolbarNavigation(menu);
  let timer: ReturnType<typeof setTimeout> | undefined;
  let open = false;

  const anchor = {
    getBoundingClientRect: () => {
      const { from, to } = editor.state.selection;
      return posToDOMRect(editor.view, from, to);
    },
  };

  function update() {
    timer = undefined;
    if (editor.isDestroyed) return;
    const { from, to } = editor.state.selection;
    const show = options.shouldShow
      ? options.shouldShow({ editor, from, to })
      : defaultBubbleMenuShow({ editor, from, to }, menu);
    if (show) {
      popover.setOptions(popoverOptions());
      if (popover.isOpen) popover.update();
      else popover.open(anchor);
      navigation.sync();
    } else popover.close();
    if (show !== open) {
      open = show;
      options.onOpenChange?.(show);
    }
  }

  const schedule = () => {
    if (timer !== undefined) clearTimeout(timer);
    const delay = options.updateDelay ?? 250;
    if (delay <= 0) update();
    else timer = setTimeout(update, delay);
  };

  // The editor lost focus: hide unless it went into the menu.
  const onBlur = ({ event }: { event: FocusEvent }) => {
    if (menu.contains(event.relatedTarget as Node | null)) return;
    if (timer !== undefined) clearTimeout(timer);
    update();
  };
  // Focus leaving the menu for anything but the text hides it.
  const onFocusOut = (event: FocusEvent) => {
    const next = event.relatedTarget as Node | null;
    if (menu.contains(next) || editor.view.dom.contains(next)) return;
    update();
  };
  // Presses keep the focus (and the selection) in the text; buttons still get their click.
  const onPress = (event: Event) => event.preventDefault();

  editor.on("selectionUpdate", schedule);
  editor.on("focus", schedule);
  editor.on("blur", onBlur);
  menu.addEventListener("focusout", onFocusOut);
  menu.addEventListener("mousedown", onPress);
  win.addEventListener("resize", schedule);

  return {
    get isOpen() {
      return popover.isOpen;
    },
    update,
    focus() {
      if (!popover.isOpen) return false;
      navigation.sync();
      const target = menu.querySelector<HTMLElement>('[tabindex="0"]');
      target?.focus();
      return target !== null;
    },
    setOptions(next) {
      options = next;
      schedule();
    },
    destroy() {
      if (timer !== undefined) clearTimeout(timer);
      editor.off("selectionUpdate", schedule);
      editor.off("focus", schedule);
      editor.off("blur", onBlur);
      menu.removeEventListener("focusout", onFocusOut);
      menu.removeEventListener("mousedown", onPress);
      win.removeEventListener("resize", schedule);
      navigation.destroy();
      popover.destroy();
    },
  };
}

/**
 * Alt+F10 in the text moves focus to the bubble menu when it shows, else to the main toolbar's
 * current control (TinyMCE / CKEditor convention). Returns the cleanup.
 */
export function editorToolbarShortcut(
  root: HTMLElement,
  content: HTMLElement,
  bubble: () => EditorBubbleMenu | null | undefined,
): () => void {
  const onKeyDown = (event: KeyboardEvent) => {
    if (!event.altKey || event.key !== "F10" || !content.contains(event.target as Node)) return;
    event.preventDefault();
    if (bubble()?.focus()) return;
    const toolbar = [...root.querySelectorAll<HTMLElement>("[data-ok-editor-toolbar]")].find(
      (each) => each.closest("[data-ok-editor]") === root,
    );
    toolbar?.querySelector<HTMLElement>('[tabindex="0"]')?.focus();
  };
  root.addEventListener("keydown", onKeyDown);
  return () => root.removeEventListener("keydown", onKeyDown);
}
