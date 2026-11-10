import {
  evaluateUploadFiles,
  type UploadAccept,
  type UploadDragRejection,
  type UploadDragVerdict,
  type UploadErrorMessage,
  type UploadEvaluation,
  type UploadLimits,
  type UploadValidatorResult,
  uploadDragRejections,
  uploadDragVerdict,
  uploadPickerTypes,
} from "./upload-model.js";

/** No dragged file rejected (a shared empty list). */
const NONE: readonly UploadDragRejection[] = [];

/** Where files came from. */
export type UploadSource = "drop" | "input" | "paste" | "picker";

/** Reads files out of an event (or the picker's handles) instead of the built-in readers. */
export type UploadFilesFromEvent = (
  event: Event | readonly FileSystemFileHandle[],
) => readonly File[] | Promise<readonly File[]>;

/** A custom check per file; may be asynchronous. */
export type UploadValidator = (
  file: File,
) => UploadValidatorResult | Promise<UploadValidatorResult>;

/** Options read on every action (props in React, attributes in HTML). */
export interface UploadConfig extends UploadLimits {
  /** The `accept` option as given (groups label the File System Access picker's rows). */
  acceptOption?: UploadAccept | undefined;
  /** Files the upload holds now (`maxFiles` counts them). */
  existing?: number | undefined;
  disabled?: boolean | undefined;
  noClick?: boolean | undefined;
  noKeyboard?: boolean | undefined;
  noDrag?: boolean | undefined;
  noDragEventsBubbling?: boolean | undefined;
  noPaste?: boolean | undefined;
  /** Default `true`: files dropped outside an upload don't open in the tab. */
  preventDropOnDocument?: boolean | undefined;
  useFsAccessApi?: boolean | undefined;
  validator?: UploadValidator | undefined;
  getFilesFromEvent?: UploadFilesFromEvent | undefined;
  getErrorMessage?: UploadErrorMessage | undefined;
}

/** Drag state of a zone: `verdict` while files are over it, `global` while over the page. */
export interface UploadDragState {
  active: boolean;
  verdict: UploadDragVerdict | null;
  global: boolean;
  /** The dragged files that would be rejected (react-dropzone's `dragFileRejections`). */
  rejections: readonly UploadDragRejection[];
}

export interface UploadControllerOptions {
  /** The native file input (the accessible control). */
  input: () => HTMLInputElement | null;
  config: () => UploadConfig;
  /** Files were dropped, picked or pasted and checked. The owner decides what it keeps. */
  onFiles(result: UploadEvaluation, source: UploadSource): void;
  onDragChange?: ((state: UploadDragState) => void) | undefined;
  onDialogOpen?: (() => void) | undefined;
  onDialogCancel?: (() => void) | undefined;
  /** A validator or file reader threw; the drop is discarded. */
  onError?: ((error: unknown) => void) | undefined;
  onProcessingChange?: ((processing: boolean) => void) | undefined;
  /** The input's form was reset (the native input is cleared). */
  onReset?: (() => void) | undefined;
}

export interface UploadController {
  /** Opens the file dialog (File System Access picker with `useFsAccessApi`). */
  open(): void;
  /** Mirrors the files the upload holds into `input.files`, so forms submit them. */
  sync(files: readonly File[]): void;
  readonly drag: UploadDragState;
  readonly dialogActive: boolean;
  readonly processing: boolean;
  destroy(): void;
}

/** Drag events an inner upload with `noDragEventsBubbling` handled: outer uploads skip them. */
const claimed = new WeakSet<Event>();

const hasFiles = (event: DragEvent | ClipboardEvent) => {
  const data = "dataTransfer" in event ? event.dataTransfer : event.clipboardData;
  return [...(data?.types ?? [])].includes("Files");
};

const isThenable = (value: unknown): value is PromiseLike<unknown> =>
  value != null && typeof (value as { then?: unknown }).then === "function";

const errorName = (error: unknown) =>
  typeof error === "object" && error !== null ? (error as { name?: unknown }).name : undefined;

interface PickerWindow {
  showOpenFilePicker?: (options: {
    multiple?: boolean;
    types?: unknown[];
    excludeAcceptAllOption?: boolean;
  }) => Promise<FileSystemFileHandle[]>;
}

/** The File System Access picker can be used (Chromium, secure context). */
export const canUseFsAccessApi = (view: Window = window): boolean =>
  typeof (view as PickerWindow).showOpenFilePicker === "function" && view.isSecureContext;

const readEntryFile = (entry: FileSystemFileEntry) =>
  new Promise<File>((resolve, reject) => entry.file(resolve, reject));

async function readDirectory(directory: FileSystemDirectoryEntry): Promise<File[]> {
  const reader = directory.createReader();
  const files: File[] = [];
  for (;;) {
    const batch = await new Promise<FileSystemEntry[]>((resolve, reject) =>
      reader.readEntries(resolve, reject),
    );
    if (batch.length === 0) return files;
    for (const entry of batch) {
      if (entry.isDirectory)
        files.push(...(await readDirectory(entry as FileSystemDirectoryEntry)));
      else files.push(await readEntryFile(entry as FileSystemFileEntry));
    }
  }
}

/**
 * Files of a drop, with folders read recursively. Items are only readable during the event, so
 * plain files are taken at once and folders are read afterwards.
 */
function filesFromDrop(event: DragEvent): File[] | Promise<File[]> {
  const data = event.dataTransfer;
  if (!data) return [];
  const items = [...(data.items ?? [])].filter((item) => item.kind === "file");
  if (items.length === 0) return [...data.files];
  const parts = items.map((item) => {
    const entry = item.webkitGetAsEntry?.() ?? null;
    return entry?.isDirectory ? (entry as FileSystemDirectoryEntry) : item.getAsFile();
  });
  if (!parts.some((part) => part !== null && !(part instanceof File))) {
    return parts.filter((part): part is File => part instanceof File);
  }
  return Promise.all(
    parts.map((part) => (part === null ? [] : part instanceof File ? [part] : readDirectory(part))),
  ).then((lists) => lists.flat());
}

/**
 * Upload behavior shared by React and the HTML runtime (ADR-0037): drag and drop on the zone
 * (with a verdict while dragging), paste, Enter on the input, `[data-ok-upload-open]` triggers,
 * the File System Access picker, file dialog open / cancel, form reset, and the checks of each
 * drop. It writes the drag and busy state on the root (`data-ok-drag`, `data-ok-drag-global`,
 * `aria-busy`) and reports the checked files; the owner decides what it keeps (`onFiles`) and
 * mirrors them back into the input with `sync()`.
 */
export function createUploadController(
  root: HTMLElement,
  options: UploadControllerOptions,
): UploadController {
  const view = root.ownerDocument.defaultView ?? window;
  const doc = root.ownerDocument;
  const abort = new AbortController();
  const { signal } = abort;
  const config = () => options.config();
  const drag: UploadDragState = { active: false, verdict: null, global: false, rejections: NONE };
  const targets = new Set<EventTarget>();
  let globalDepth = 0;
  let dialogActive = false;
  let processing = false;
  let run = 0;
  let synced: readonly File[] = [];
  let opening = false;

  const writeDrag = () => {
    if (drag.active && drag.verdict) root.setAttribute("data-ok-drag", drag.verdict);
    else root.removeAttribute("data-ok-drag");
    root.toggleAttribute("data-ok-drag-global", drag.global);
    options.onDragChange?.({ ...drag });
  };
  const setDrag = (next: Partial<UploadDragState>) => {
    const changed =
      (next.active !== undefined && next.active !== drag.active) ||
      (next.verdict !== undefined && next.verdict !== drag.verdict) ||
      (next.global !== undefined && next.global !== drag.global) ||
      (next.rejections !== undefined && next.rejections !== drag.rejections);
    Object.assign(drag, next);
    if (changed) writeDrag();
  };
  const setProcessing = (next: boolean) => {
    if (next === processing) return;
    processing = next;
    if (next) root.setAttribute("aria-busy", "true");
    else root.removeAttribute("aria-busy");
    options.onProcessingChange?.(next);
  };

  const limits = (cfg: UploadConfig): UploadLimits => ({
    accept: cfg.accept,
    minSize: cfg.minSize,
    maxSize: cfg.maxSize,
    multiple: cfg.multiple,
    maxFiles: cfg.maxFiles,
  });

  /** Checks files (validator may be async); the latest drop wins over pending ones. */
  const process = (
    source: UploadSource,
    read: () => readonly File[] | Promise<readonly File[]>,
  ): void => {
    const token = ++run;
    const fail = (error: unknown) => {
      if (token !== run) return;
      setProcessing(false);
      options.onError?.(error);
    };
    const commit = (files: readonly File[], custom: readonly UploadValidatorResult[]) => {
      if (token !== run) return;
      const cfg = config();
      setProcessing(false);
      options.onFiles(
        evaluateUploadFiles(files, limits(cfg), {
          existing: cfg.existing,
          custom,
          getErrorMessage: cfg.getErrorMessage,
        }),
        source,
      );
    };
    const check = (files: readonly File[]) => {
      const validator = config().validator;
      const results = files.map((file) => (validator ? validator(file) : null));
      if (!results.some(isThenable)) {
        commit(files, results as UploadValidatorResult[]);
        return;
      }
      setProcessing(true);
      Promise.all(results).then((custom) => commit(files, custom), fail);
    };
    let files: readonly File[] | Promise<readonly File[]>;
    try {
      files = read();
    } catch (error) {
      fail(error);
      return;
    }
    if (isThenable(files)) {
      setProcessing(true);
      Promise.resolve(files).then((list) => {
        if (token !== run) return;
        try {
          check(list);
        } catch (error) {
          fail(error);
        }
      }, fail);
      return;
    }
    try {
      check(files);
    } catch (error) {
      fail(error);
    }
  };

  const reader = (event: Event, builtIn: () => readonly File[] | Promise<readonly File[]>) => {
    const custom = config().getFilesFromEvent;
    return custom ? () => custom(event) : builtIn;
  };

  const openPicker = () => {
    const cfg = config();
    const types = uploadPickerTypes(cfg.acceptOption ?? cfg.accept);
    dialogActive = true;
    options.onDialogOpen?.();
    (view as PickerWindow)
      .showOpenFilePicker?.({
        multiple: cfg.multiple === true,
        types,
        excludeAcceptAllOption: types.length > 0,
      })
      .then(
        (handles) => {
          dialogActive = false;
          const custom = config().getFilesFromEvent;
          process("picker", () =>
            custom ? custom(handles) : Promise.all(handles.map((handle) => handle.getFile())),
          );
        },
        (error: unknown) => {
          dialogActive = false;
          const name = errorName(error);
          if (name === "AbortError") options.onDialogCancel?.();
          else if (name === "SecurityError" || name === "NotAllowedError") {
            // Blocked by policy: fall back to the native input.
            nativeOpen();
          } else options.onError?.(error);
        },
      );
  };

  const nativeOpen = () => {
    const input = options.input();
    if (!input) return;
    opening = true;
    try {
      input.click();
    } finally {
      opening = false;
    }
  };

  const open = () => {
    const cfg = config();
    if (cfg.disabled || options.input()?.disabled) return;
    if (cfg.useFsAccessApi && canUseFsAccessApi(view)) openPicker();
    else nativeOpen();
  };

  // --- Input -----------------------------------------------------------------------------------

  const onInputClick = (event: MouseEvent) => {
    const cfg = config();
    if (event.defaultPrevented || cfg.disabled) return;
    // `noClick`: a press on the zone doesn't open the dialog (CSS also lets presses through).
    if (cfg.noClick && !opening && event.detail > 0) {
      event.preventDefault();
      return;
    }
    if (cfg.useFsAccessApi && canUseFsAccessApi(view)) {
      event.preventDefault();
      openPicker();
      return;
    }
    dialogActive = true;
    options.onDialogOpen?.();
  };
  const onInputChange = (event: Event) => {
    const input = event.target as HTMLInputElement;
    dialogActive = false;
    const files = [...(input.files ?? [])];
    if (files.length === 0) {
      // Some engines clear the input when the dialog is dismissed: keep what the upload holds.
      sync(synced);
      options.onDialogCancel?.();
      return;
    }
    process(
      "input",
      reader(event, () => files),
    );
  };
  const onInputCancel = () => {
    dialogActive = false;
    options.onDialogCancel?.();
  };
  const onInputKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "Enter" || event.repeat || event.defaultPrevented) return;
    if (config().noKeyboard) return;
    event.preventDefault();
    open();
  };

  let input: HTMLInputElement | null = null;
  let inputAbort: AbortController | null = null;
  /** Listens on the current input (React may replace it). */
  const bindInput = () => {
    const next = options.input();
    if (next === input) return;
    inputAbort?.abort();
    input = next;
    if (!next) return;
    inputAbort = new AbortController();
    const opts = { signal: inputAbort.signal };
    next.addEventListener("click", onInputClick, opts);
    next.addEventListener("change", onInputChange, opts);
    next.addEventListener("cancel", onInputCancel, opts);
    next.addEventListener("keydown", onInputKeyDown, opts);
    next.form?.addEventListener(
      "reset",
      () => {
        synced = [];
        queueMicrotask(() => options.onReset?.());
      },
      opts,
    );
  };
  bindInput();

  // --- Root ------------------------------------------------------------------------------------

  /** True when another (inner) upload already handled this event, or this one ignores drags. */
  const skip = (event: Event) => {
    if (claimed.has(event)) return true;
    if (config().noDragEventsBubbling) claimed.add(event);
    return false;
  };
  const dragTypes = (event: DragEvent) =>
    [...(event.dataTransfer?.items ?? [])]
      .filter((item) => item.kind === "file")
      .map((item) => item.type);
  const blocked = () => {
    const cfg = config();
    return cfg.disabled === true || cfg.noDrag === true || options.input()?.disabled === true;
  };

  root.addEventListener(
    "dragenter",
    (event) => {
      if (!hasFiles(event) || skip(event)) return;
      event.preventDefault();
      if (blocked()) return;
      targets.add(event.target as EventTarget);
      const cfg = config();
      const types = dragTypes(event);
      const verdict = uploadDragVerdict(types, limits(cfg), {
        existing: cfg.existing,
        validator: cfg.validator !== undefined,
      });
      const same = drag.active && drag.verdict === verdict;
      setDrag({
        active: true,
        verdict,
        ...(same ? {} : { rejections: uploadDragRejections(types, limits(cfg), cfg.existing) }),
      });
    },
    { signal },
  );
  root.addEventListener(
    "dragover",
    (event) => {
      if (!hasFiles(event) || skip(event)) return;
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = blocked() ? "none" : "copy";
    },
    { signal },
  );
  root.addEventListener(
    "dragleave",
    (event) => {
      if (!hasFiles(event) || skip(event)) return;
      targets.delete(event.target as EventTarget);
      for (const target of targets) if (!root.contains(target as Node)) targets.delete(target);
      if (targets.size === 0) setDrag({ active: false, verdict: null, rejections: NONE });
    },
    { signal },
  );
  root.addEventListener(
    "drop",
    (event) => {
      if (!hasFiles(event) || skip(event)) return;
      // Always: the browser would otherwise open the file or fill the input itself.
      event.preventDefault();
      targets.clear();
      globalDepth = 0;
      setDrag({ active: false, verdict: null, global: false, rejections: NONE });
      if (blocked()) return;
      process(
        "drop",
        reader(event, () => filesFromDrop(event)),
      );
    },
    { signal },
  );
  root.addEventListener(
    "paste",
    (event) => {
      const cfg = config();
      if (cfg.noPaste || cfg.disabled || !hasFiles(event) || claimed.has(event)) return;
      const files = [...(event.clipboardData?.files ?? [])];
      if (files.length === 0) return;
      claimed.add(event);
      event.preventDefault();
      process(
        "paste",
        reader(event, () => files),
      );
    },
    { signal },
  );
  root.addEventListener(
    "click",
    (event) => {
      const trigger = (event.target as Element).closest?.("[data-ok-upload-open]");
      if (!trigger || trigger.closest("[data-ok-upload]") !== root || event.defaultPrevented)
        return;
      event.preventDefault();
      open();
    },
    { signal },
  );

  // --- Document --------------------------------------------------------------------------------

  doc.addEventListener(
    "dragenter",
    (event) => {
      if (!hasFiles(event)) return;
      globalDepth++;
      setDrag({ global: true });
    },
    { signal },
  );
  doc.addEventListener(
    "dragleave",
    (event) => {
      if (!hasFiles(event)) return;
      globalDepth = Math.max(0, globalDepth - 1);
      if (globalDepth === 0) setDrag({ global: false });
    },
    { signal },
  );
  for (const type of ["drop", "dragend"] as const) {
    doc.addEventListener(
      type,
      () => {
        globalDepth = 0;
        targets.clear();
        setDrag({ active: false, verdict: null, global: false, rejections: NONE });
      },
      { signal },
    );
  }
  doc.addEventListener(
    "dragover",
    (event) => {
      if (config().preventDropOnDocument !== false && hasFiles(event)) event.preventDefault();
    },
    { signal },
  );
  doc.addEventListener(
    "drop",
    (event) => {
      if (config().preventDropOnDocument === false || !hasFiles(event)) return;
      if (!root.contains(event.target as Node)) event.preventDefault();
    },
    { signal },
  );

  const sync = (files: readonly File[]) => {
    bindInput();
    synced = [...files];
    const target = options.input();
    if (!target || typeof DataTransfer !== "function") return;
    try {
      const data = new DataTransfer();
      for (const file of files) data.items.add(file);
      target.files = data.files;
    } catch {
      // Engines without a constructible DataTransfer keep the last native selection.
    }
  };

  return {
    open,
    sync,
    get drag() {
      return { ...drag };
    },
    get dialogActive() {
      return dialogActive;
    },
    get processing() {
      return processing;
    },
    destroy() {
      run++;
      abort.abort();
      inputAbort?.abort();
      root.removeAttribute("data-ok-drag");
      root.removeAttribute("data-ok-drag-global");
      root.removeAttribute("aria-busy");
    },
  };
}
