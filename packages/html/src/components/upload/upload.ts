import {
  createIcon,
  createId,
  createUploadController,
  fileLinear,
  formatUploadSize,
  readBehavior,
  readNumber,
  type UploadController,
  type UploadDragState,
  type UploadErrorMessage,
  type UploadFilesFromEvent,
  type UploadRejection,
  type UploadValidator,
  uploadFileKind,
  uploadFileLabel,
  uploadIsImage,
  uploadOptions,
} from "@owlky/core";
import { defineComponent } from "../../runtime/define.js";
import type { ComponentInstance, EventSpec } from "../../runtime/types.js";

/** Events of this component (`ok:<name>:<event>` on the root). */
export interface UploadEvents {
  /** Before dropped or picked files are added. Call `preventDefault()` to refuse them all. */
  drop: EventSpec<{ accepted: File[]; rejections: UploadRejection[] }, true>;
  /** After the files changed, with the reason (`drop`, `remove`, `clear`, `api`). */
  change: EventSpec<{ files: File[]; reason: string }>;
  /** Before a file is removed (`file` is `null` for the single preview). Call `preventDefault()` to keep it. */
  remove: EventSpec<{ file: File | null }, true>;
  /** After a `data-ok-upload-submit` button was pressed, with the files. */
  upload: EventSpec<{ files: File[] }>;
  /** After the file dialog opened. */
  dialogopen: EventSpec;
  /** After the file dialog closed without a choice. */
  dialogcancel: EventSpec;
  /** While files are dragged over the zone or the page. */
  drag: EventSpec<UploadDragState>;
  /** After reading the files failed. */
  error: EventSpec<{ error: unknown }>;
}

export interface UploadInstance extends ComponentInstance {
  /** The files the upload holds. */
  readonly files: readonly File[];
  /** Rejections of the last drop, pick or paste. */
  readonly rejections: readonly UploadRejection[];
  /** The drag state: whether files are over the zone or the page, and whether they would be accepted. */
  readonly dragState: UploadDragState;
  /** Whether the file dialog is open. */
  readonly isFileDialogActive: boolean;
  /** Whether dropped files are being read. */
  readonly isProcessing: boolean;
  /** Opens the file dialog (call it from a user action). */
  open(): void;
  /** Replaces the files without checks or events. */
  setFiles(files: readonly File[]): void;
  /** Removes a file without events. */
  removeFile(file: File): void;
  /** Removes every file and the rejections, without events. */
  clearFiles(): void;
  /** A custom check per file (may return a Promise); `null` removes it. */
  setValidator(validator: UploadValidator | null): void;
  /** Rewrites rejection messages (localization); `null` restores the built-in ones. */
  setErrorMessage(getErrorMessage: UploadErrorMessage | null): void;
  /** Reads files from events yourself; `null` restores the built-in readers. */
  setFilesFromEvent(getFilesFromEvent: UploadFilesFromEvent | null): void;
}

const { options: spec } = uploadOptions;

/**
 * Upload — spec: specs/components/upload.md (ADR-0037)
 *
 * Markup:  <div data-ok-upload data-ok-variant="default" data-ok-layout="vertical">
 *            <div data-ok-upload-zone>
 *              <input type="file" data-ok-upload-input id="f" title=" " aria-labelledby="f-title" [multiple] [accept]>
 *              <div data-ok-upload-placeholder>…illustration… <span data-ok-upload-title id="f-title">Drop or select a file</span>…</div>
 *              <button data-ok-icon-button data-ok-upload-remove … hidden>…</button>     (single file)
 *            </div>
 *            <div data-ok-upload-rejections role="alert"></div>
 *            <ul data-ok-upload-list aria-live="polite"></ul> <template data-ok-upload-template><li …></template>  (multiple)
 *            <div data-ok-upload-actions hidden>…Remove all, Upload buttons…</div>
 *          </div>
 * Behavior: core `createUploadController` handles drops, paste, Enter, the dialog and the checks;
 *          this runtime keeps the files, renders the preview, the list (clones of the template),
 *          the rejections and the avatar title, and mirrors the files into `input.files`.
 * Events:  ok:upload:drop (cancelable, `{ accepted, rejections }`), ok:upload:change
 *          (`{ files, reason }`: add · remove · clear · reset), ok:upload:remove (cancelable,
 *          `{ file }`), ok:upload:upload (`{ files }`, the Upload button), ok:upload:dialogopen,
 *          ok:upload:dialogcancel, ok:upload:drag (`{ active, verdict, global }`), ok:upload:error
 *          (`{ error }`).
 */
export const upload = defineComponent<UploadInstance, UploadEvents>({
  name: "upload",
  selector: "[data-ok-upload]",

  setup(element, { emit, signal }) {
    const doc = element.ownerDocument;
    const input = element.querySelector<HTMLInputElement>("[data-ok-upload-input]");
    const zone = element.querySelector<HTMLElement>("[data-ok-upload-zone]");
    const own = <T extends Element>(selector: string) =>
      [...element.querySelectorAll<T>(selector)].filter(
        (node) => node.closest("[data-ok-upload]") === element,
      );
    const list = own<HTMLUListElement>("[data-ok-upload-list]")[0] ?? null;
    const template = own<HTMLTemplateElement>("template[data-ok-upload-template]")[0] ?? null;
    const rejectionsBox = own<HTMLElement>("[data-ok-upload-rejections]")[0] ?? null;
    const actions = own<HTMLElement>("[data-ok-upload-actions]")[0] ?? null;
    const singleRemove =
      zone?.querySelector<HTMLElement>(":scope > [data-ok-upload-remove]") ?? null;
    const title = own<HTMLElement>("[data-ok-upload-title]")[0] ?? null;
    const base = input?.id || createId("ok-upload");

    let files: File[] = [];
    let rejections: UploadRejection[] = [];
    let validator: UploadValidator | null = null;
    let errorMessage: UploadErrorMessage | null = null;
    let filesFromEvent: UploadFilesFromEvent | null = null;
    let dialogActive = false;
    const urls = new Map<File, string>();
    const items = new Map<File, HTMLLIElement>();
    let itemCount = 0;
    /** A preview written in the markup (a photo uploaded before), until a file replaces it. */
    let markupPreview =
      zone?.querySelector<HTMLElement>(":scope > [data-ok-upload-preview]") ?? null;

    const multiple = () => input?.multiple === true;
    const thumbnails = () => readBehavior(element, spec.thumbnail);
    const urlOf = (file: File) => {
      let url = urls.get(file);
      if (url === undefined) {
        url = URL.createObjectURL(file);
        urls.set(file, url);
      }
      return url;
    };
    const revokeGone = () => {
      for (const [file, url] of urls) {
        if (!files.includes(file)) {
          URL.revokeObjectURL(url);
          urls.delete(file);
        }
      }
    };

    const fileIcon = (file: File) => {
      const box = doc.createElement("span");
      box.setAttribute("data-ok-upload-file", "");
      box.setAttribute("data-ok-kind", uploadFileKind(file));
      box.setAttribute("aria-hidden", "true");
      box.append(createIcon(fileLinear, {}, doc));
      const label = uploadFileLabel(file.name);
      if (label) {
        const ext = doc.createElement("span");
        ext.setAttribute("data-ok-upload-file-ext", "");
        ext.textContent = label;
        box.append(ext);
      }
      return box;
    };
    const text = (attribute: string, value: string) => {
      const span = doc.createElement("span");
      span.setAttribute(attribute, "");
      span.textContent = value;
      return span;
    };

    /** The preview id the single remove button points at (its name). */
    const previewId = () =>
      singleRemove?.getAttribute("aria-labelledby")?.split(/\s+/)[1] ?? `${base}-preview`;

    const renderPreview = () => {
      if (!zone || multiple()) return;
      const file = files[0];
      const current = zone.querySelector<HTMLElement>(":scope > [data-ok-upload-preview]");
      if (file === undefined) {
        if (current && current !== markupPreview) current.remove();
      } else if (!current || shownFile.get(current) !== file) {
        current?.remove();
        markupPreview = null;
        const preview = doc.createElement("span");
        preview.setAttribute("data-ok-upload-preview", "");
        preview.id = previewId();
        shownFile.set(preview, file);
        if (uploadIsImage(file)) {
          const img = doc.createElement("img");
          img.src = urlOf(file);
          img.alt = file.name;
          preview.append(img);
        } else {
          preview.append(
            fileIcon(file),
            text("data-ok-upload-preview-name", file.name),
            text("data-ok-upload-preview-size", formatUploadSize(file.size)),
          );
        }
        const placeholder = zone.querySelector(":scope > [data-ok-upload-placeholder]");
        if (placeholder) placeholder.after(preview);
        else zone.append(preview);
      }
      if (singleRemove) {
        singleRemove.hidden = file === undefined && markupPreview === null;
        if (!singleRemove.id) singleRemove.id = `${base}-remove`;
        if (!singleRemove.hasAttribute("aria-labelledby"))
          singleRemove.setAttribute("aria-labelledby", `${singleRemove.id} ${previewId()}`);
      }
      const label = file === undefined && markupPreview === null ? "upload" : "update";
      const swap = title?.getAttribute(`data-ok-label-${label}`);
      if (title && swap != null) title.textContent = swap;
    };

    const keys = new WeakMap<File, number>();
    /** What each preview or thumbnail shows (no attributes: the markup matches React's). */
    const shownFile = new WeakMap<Element, File>();
    const shownKind = new WeakMap<Element, string>();
    const itemKey = (file: File) => {
      let key = keys.get(file);
      if (key === undefined) {
        key = ++itemCount;
        keys.set(file, key);
      }
      return key;
    };

    const buildItem = (file: File): HTMLLIElement | null => {
      const first = template?.content.firstElementChild;
      if (!first) return null;
      const li = first.cloneNode(true) as HTMLLIElement;
      const key = itemKey(file);
      const name = li.querySelector<HTMLElement>("[data-ok-upload-item-name]");
      const size = li.querySelector<HTMLElement>("[data-ok-upload-item-size]");
      const button = li.querySelector<HTMLElement>("[data-ok-upload-remove]");
      if (name) {
        name.textContent = file.name;
        name.id = `${base}-file-${key}-name`;
      }
      if (size) size.textContent = formatUploadSize(file.size);
      if (button) {
        button.id = `${base}-file-${key}-remove`;
        button.setAttribute("aria-labelledby", `${button.id} ${name?.id ?? ""}`.trim());
      }
      return li;
    };
    const fillThumb = (li: HTMLLIElement, file: File) => {
      const thumb = li.querySelector<HTMLElement>("[data-ok-upload-thumb]");
      if (!thumb) return;
      const image = thumbnails() && uploadIsImage(file);
      const kind = image ? "image-preview" : "icon";
      if (shownKind.get(thumb) === kind) return;
      shownKind.set(thumb, kind);
      if (image) {
        const img = doc.createElement("img");
        img.src = urlOf(file);
        img.alt = "";
        thumb.replaceChildren(img);
      } else thumb.replaceChildren(fileIcon(file));
    };

    const renderList = () => {
      if (!list) return;
      for (const [file, li] of items) {
        if (!files.includes(file)) {
          li.remove();
          items.delete(file);
        }
      }
      let previous: Element | null = null;
      for (const file of files) {
        let li = items.get(file);
        if (!li) {
          const built = buildItem(file);
          if (!built) continue;
          li = built;
          items.set(file, li);
        }
        fillThumb(li, file);
        const next: Element | null = previous
          ? previous.nextElementSibling
          : list.firstElementChild;
        if (next !== li) {
          if (previous) previous.after(li);
          else list.prepend(li);
        }
        previous = li;
      }
    };

    const renderRejections = () => {
      if (!rejectionsBox) return;
      if (rejections.length === 0) {
        rejectionsBox.replaceChildren();
        return;
      }
      const ul = doc.createElement("ul");
      for (const { file, errors } of rejections) {
        const li = doc.createElement("li");
        li.append(
          text("data-ok-upload-rejection-file", `${file.name} - ${formatUploadSize(file.size)}`),
        );
        for (const failure of errors)
          li.append(text("data-ok-upload-rejection-error", `- ${failure.message}`));
        ul.append(li);
      }
      rejectionsBox.replaceChildren(ul);
    };

    const render = () => {
      if (input) {
        if (element.hasAttribute(spec.noKeyboard.attr)) input.tabIndex = -1;
        else if (input.getAttribute("tabindex") === "-1") input.removeAttribute("tabindex");
        // The error flag marks the input invalid, like React.
        if (element.hasAttribute(spec.error.attr)) input.setAttribute("aria-invalid", "true");
        else input.removeAttribute("aria-invalid");
      }
      renderPreview();
      renderList();
      renderRejections();
      if (actions) actions.hidden = files.length === 0;
      revokeGone();
      controller.sync(files);
    };

    /** Focus left with a removed button: the next remove button, else the input. */
    const refocus = (index: number) => {
      const active = doc.activeElement;
      // A hidden button keeps the focus in Firefox and WebKit: only a shown element counts.
      if (active && element.contains(active) && active.getClientRects().length > 0) return;
      const buttons = list
        ? [...list.querySelectorAll<HTMLElement>("[data-ok-upload-remove]")]
        : [];
      const next = index >= 0 ? buttons[Math.min(index, buttons.length - 1)] : undefined;
      (next ?? input)?.focus();
    };

    const change = (next: File[], reason: "add" | "remove" | "clear" | "reset") => {
      files = next;
      render();
      emit("change", { files: [...files], reason });
    };

    const controller: UploadController = createUploadController(element, {
      input: () => input,
      config: () => ({
        accept: input?.getAttribute("accept") ?? "",
        multiple: multiple(),
        maxFiles: readNumber(element, spec.maxFiles) as number | undefined,
        maxSize: readNumber(element, spec.maxSize) as number | undefined,
        minSize: readNumber(element, spec.minSize) as number | undefined,
        existing: files.length,
        disabled: input?.disabled === true,
        noClick: element.hasAttribute(spec.noClick.attr),
        noKeyboard: element.hasAttribute(spec.noKeyboard.attr),
        noDrag: element.hasAttribute(spec.noDrag.attr),
        noDragEventsBubbling: element.hasAttribute(spec.noDragEventsBubbling.attr),
        noPaste: element.hasAttribute(spec.noPaste.attr),
        preventDropOnDocument: readBehavior(element, spec.preventDropOnDocument),
        useFsAccessApi: element.hasAttribute(spec.useFsAccessApi.attr),
        validator: validator ?? undefined,
        getFilesFromEvent: filesFromEvent ?? undefined,
        getErrorMessage: errorMessage ?? undefined,
      }),
      onFiles({ accepted, rejections: rejected }) {
        dialogActive = false;
        if (!emit("drop", { accepted, rejections: rejected }, { cancelable: true })) {
          render();
          return;
        }
        rejections = rejected;
        if (accepted.length === 0) {
          render();
          return;
        }
        if (!multiple()) markupPreview?.remove();
        change(multiple() ? [...files, ...accepted] : accepted.slice(0, 1), "add");
      },
      onDragChange: (state) => emit("drag", state),
      onDialogOpen() {
        dialogActive = true;
        emit("dialogopen");
      },
      onDialogCancel() {
        dialogActive = false;
        emit("dialogcancel");
      },
      onError: (error) => emit("error", { error }),
      onReset() {
        rejections = [];
        change([], "reset");
      },
    });

    const removeAt = (index: number) => {
      const file = files[index];
      if (file === undefined) {
        // The markup's own preview (a photo uploaded before).
        if (index === 0 && markupPreview) {
          if (!emit("remove", { file: null }, { cancelable: true })) return;
          markupPreview.remove();
          markupPreview = null;
          change([], "remove");
          input?.focus();
        }
        return;
      }
      if (!emit("remove", { file }, { cancelable: true })) return;
      change(
        files.filter((_, i) => i !== index),
        "remove",
      );
      refocus(multiple() ? index : -1);
    };

    element.addEventListener(
      "click",
      (event) => {
        const target = event.target as Element;
        const owner = target.closest?.("[data-ok-upload]");
        if (owner !== element) return;
        const remove = target.closest<HTMLElement>("[data-ok-upload-remove]");
        if (remove) {
          const li = remove.closest("[data-ok-upload-item]");
          if (remove === singleRemove) removeAt(0);
          for (const [file, item] of items) if (item === li) removeAt(files.indexOf(file));
          return;
        }
        if (target.closest("[data-ok-upload-remove-all]")) {
          rejections = [];
          change([], "clear");
          input?.focus();
          return;
        }
        if (target.closest("[data-ok-upload-submit]")) emit("upload", { files: [...files] });
      },
      { signal },
    );

    render();

    return {
      get files() {
        return files;
      },
      get rejections() {
        return rejections;
      },
      get dragState() {
        return controller.drag;
      },
      get isFileDialogActive() {
        return dialogActive;
      },
      get isProcessing() {
        return controller.processing;
      },
      open: () => controller.open(),
      setFiles(next) {
        files = multiple() ? [...next] : next.slice(0, 1);
        if (!multiple() && files.length > 0) {
          markupPreview?.remove();
          markupPreview = null;
        }
        render();
      },
      removeFile(file) {
        files = files.filter((f) => f !== file);
        render();
      },
      clearFiles() {
        files = [];
        rejections = [];
        render();
      },
      setValidator(next) {
        validator = next;
      },
      setErrorMessage(next) {
        errorMessage = next;
      },
      setFilesFromEvent(next) {
        filesFromEvent = next;
      },
      destroy() {
        controller.destroy();
        for (const url of urls.values()) URL.revokeObjectURL(url);
        urls.clear();
      },
    };
  },
});
