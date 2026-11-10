"use client";

import {
  createUploadController,
  type UploadAccept,
  type UploadController,
  type UploadDragRejection,
  type UploadDragState,
  type UploadErrorMessage,
  type UploadFilesFromEvent,
  type UploadRejection,
  type UploadValidator,
  uploadAcceptAttr,
} from "@owlky/core";
import {
  type FocusEvent,
  type ForwardedRef,
  forwardRef,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type RefCallback,
  type RefObject,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

/** Options of `useDropzone` and `Dropzone` (react-dropzone's, value-first callbacks). */
export interface UseDropzoneOptions {
  /** Accepted types: `"image/*,.pdf"`, `{ "image/*": [".png", ".jpg"] }` or labeled groups. */
  accept?: UploadAccept | undefined;
  /** Several files per drop. Default `true` (react-dropzone). */
  multiple?: boolean | undefined;
  /** Most files per drop (multiple; 0 = no limit). */
  maxFiles?: number | undefined;
  /** Largest file in bytes. */
  maxSize?: number | undefined;
  /** Smallest file in bytes. */
  minSize?: number | undefined;
  /** Nothing can be dropped or picked. */
  disabled?: boolean | undefined;
  /** A press on the root doesn't open the file dialog. */
  noClick?: boolean | undefined;
  /** Enter and Space on the root don't open the file dialog, and the root isn't focusable. */
  noKeyboard?: boolean | undefined;
  /** Files can't be dropped. */
  noDrag?: boolean | undefined;
  /** Drag events stop at this root: outer dropzones and uploads ignore them. */
  noDragEventsBubbling?: boolean | undefined;
  /** Pasted files are ignored. */
  noPaste?: boolean | undefined;
  /** Files dropped outside the root don't open in the browser. Default `true`. */
  preventDropOnDocument?: boolean | undefined;
  /** Use the File System Access picker where the browser has it. */
  useFsAccessApi?: boolean | undefined;
  /** Checks each file; returns `null`, an error or a list of errors. */
  validator?: UploadValidator | undefined;
  /** Reads the files of a drop, a pick or a paste (folders, for example). */
  getFilesFromEvent?: UploadFilesFromEvent | undefined;
  /** Rewrites the message of an error (localization). */
  getErrorMessage?: UploadErrorMessage | undefined;
  /** Every drop, pick or paste: the accepted and the rejected files. */
  onDrop?: ((accepted: File[], rejections: UploadRejection[]) => void) | undefined;
  /** Called with the accepted files of a drop, when there are some. */
  onDropAccepted?: ((files: File[]) => void) | undefined;
  /** Called with the rejected files of a drop, when there are some. */
  onDropRejected?: ((rejections: UploadRejection[]) => void) | undefined;
  /** The file dialog opened. */
  onFileDialogOpen?: (() => void) | undefined;
  /** The file dialog closed without files. */
  onFileDialogCancel?: (() => void) | undefined;
  /** A validator or `getFilesFromEvent` threw; the drop is discarded. */
  onError?: ((error: unknown) => void) | undefined;
}

/** What `useDropzone` returns and `Dropzone` passes to its children. */
export interface DropzoneState {
  /** Props of the drop target: spread them on your root element (pass your own props in). */
  getRootProps<P extends Record<string, unknown>>(props?: P): P & DropzoneRootProps;
  /** Props of the file input: spread them on an `<input>` inside the root. */
  getInputProps<P extends Record<string, unknown>>(props?: P): P & DropzoneInputProps;
  /** The root element, once the props are spread. */
  rootRef: RefObject<HTMLElement | null>;
  /** The input element, once the props are spread. */
  inputRef: RefObject<HTMLInputElement | null>;
  /** Opens the file dialog. Call it from a user action (click, key). */
  open(): void;
  /** Files are dragged over the root. */
  isDragActive: boolean;
  /** The dragged files would be accepted. */
  isDragAccept: boolean;
  /** Some dragged file would be rejected (its type, or too many files). */
  isDragReject: boolean;
  /** The dragged files can only be checked at drop time (extensions, a validator). */
  isDragUnknown: boolean;
  /** Files are dragged over the page. */
  isDragGlobal: boolean;
  /** The root has focus. */
  isFocused: boolean;
  /** The file dialog is open. */
  isFileDialogActive: boolean;
  /** Dropped files are being read and checked. */
  isProcessing: boolean;
  /** The files the last drop accepted. */
  acceptedFiles: readonly File[];
  /** The files the last drop rejected, with every reason. */
  fileRejections: readonly UploadRejection[];
  /** The dragged files that would be rejected, known by their MIME type only. */
  dragFileRejections: readonly UploadDragRejection[];
}

export interface DropzoneRootProps {
  ref: RefCallback<HTMLElement>;
  tabIndex?: number | undefined;
  onClick: (event: MouseEvent<HTMLElement>) => void;
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
  onFocus: (event: FocusEvent<HTMLElement>) => void;
  onBlur: (event: FocusEvent<HTMLElement>) => void;
}

export interface DropzoneInputProps
  extends Pick<InputHTMLAttributes<HTMLInputElement>, "accept" | "multiple" | "disabled"> {
  ref: RefCallback<HTMLInputElement>;
  type: "file";
  tabIndex: -1;
  hidden: true;
}

const NO_DRAG: UploadDragState = { active: false, verdict: null, global: false, rejections: [] };
const NONE: readonly never[] = [];

type Handler<E> = ((event: E) => void) | undefined;
/** Your handler first, then the dropzone's (skipped when yours prevents the default). */
const chain =
  <E extends { defaultPrevented: boolean }>(own: Handler<E>, mine: (event: E) => void) =>
  (event: E) => {
    own?.(event);
    if (!event.defaultPrevented) mine(event);
  };

/**
 * useDropzone — react-dropzone's hook on Owlky's upload engine (core `createUploadController`):
 * spread `getRootProps()` on a drop target and `getInputProps()` on a file input inside it. The
 * files are yours: read them in `onDrop`. Upload, UploadAvatar and UploadBox are built on the
 * same engine.
 */
export function useDropzone(options: UseDropzoneOptions = {}): DropzoneState {
  const rootRef = useRef<HTMLElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const controller = useRef<UploadController | null>(null);
  const [drag, setDrag] = useState<UploadDragState>(NO_DRAG);
  const [dialogActive, setDialogActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [focused, setFocused] = useState(false);
  const [accepted, setAccepted] = useState<readonly File[]>(NONE);
  const [rejections, setRejections] = useState<readonly UploadRejection[]>(NONE);
  const latest = useRef(options);
  latest.current = options;
  const multiple = options.multiple ?? true;
  const acceptAttr = uploadAcceptAttr(options.accept);
  const [root, setRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!root) return;
    const instance = createUploadController(root, {
      input: () => inputRef.current,
      config: () => {
        const s = latest.current;
        return {
          accept: uploadAcceptAttr(s.accept),
          acceptOption: s.accept,
          multiple: s.multiple ?? true,
          maxFiles: s.maxFiles,
          maxSize: s.maxSize,
          minSize: s.minSize,
          existing: 0,
          disabled: s.disabled,
          noClick: s.noClick,
          noKeyboard: s.noKeyboard,
          noDrag: s.noDrag,
          noDragEventsBubbling: s.noDragEventsBubbling,
          noPaste: s.noPaste,
          preventDropOnDocument: s.preventDropOnDocument,
          useFsAccessApi: s.useFsAccessApi,
          validator: s.validator,
          getFilesFromEvent: s.getFilesFromEvent,
          getErrorMessage: s.getErrorMessage,
        };
      },
      onFiles({ accepted: files, rejections: rejected }) {
        const s = latest.current;
        setDialogActive(false);
        setAccepted(files);
        setRejections(rejected);
        s.onDrop?.(files, rejected);
        if (rejected.length > 0) s.onDropRejected?.(rejected);
        if (files.length > 0) s.onDropAccepted?.(files);
      },
      onDragChange: setDrag,
      onDialogOpen() {
        setDialogActive(true);
        latest.current.onFileDialogOpen?.();
      },
      onDialogCancel() {
        setDialogActive(false);
        latest.current.onFileDialogCancel?.();
      },
      onError: (failure) => latest.current.onError?.(failure),
      onProcessingChange: setProcessing,
      onReset() {
        setAccepted(NONE);
        setRejections(NONE);
      },
    });
    controller.current = instance;
    return () => {
      instance.destroy();
      controller.current = null;
    };
  }, [root]);

  const open = useCallback(() => controller.current?.open(), []);
  const rootCallback = useCallback((element: HTMLElement | null) => {
    rootRef.current = element;
    setRoot(element);
  }, []);
  const inputCallback = useCallback((element: HTMLInputElement | null) => {
    inputRef.current = element;
    // The engine listens on the current input.
    controller.current?.sync([]);
  }, []);

  const getRootProps = <P extends Record<string, unknown>>(props = {} as P) => {
    const own = props as P & Partial<DropzoneRootProps>;
    return {
      ...props,
      ref: rootCallback,
      tabIndex: options.noKeyboard ? undefined : ((own.tabIndex as number | undefined) ?? 0),
      onClick: (event: MouseEvent<HTMLElement>) => {
        // The input's own click (from `open()`) bubbles here: it isn't a press on the root.
        if (event.target === inputRef.current) return;
        own.onClick?.(event);
        if (!event.defaultPrevented && !options.noClick) open();
      },
      onKeyDown: chain(own.onKeyDown, (event: KeyboardEvent<HTMLElement>) => {
        if (options.noKeyboard || event.target !== event.currentTarget) return;
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        open();
      }),
      onFocus: chain(own.onFocus, (event: FocusEvent<HTMLElement>) => {
        if (event.target === event.currentTarget) setFocused(true);
      }),
      onBlur: chain(own.onBlur, (event: FocusEvent<HTMLElement>) => {
        if (event.target === event.currentTarget) setFocused(false);
      }),
    } as P & DropzoneRootProps;
  };

  const getInputProps = <P extends Record<string, unknown>>(props = {} as P) =>
    ({
      ...props,
      ref: inputCallback,
      type: "file",
      accept: acceptAttr || undefined,
      multiple,
      disabled: options.disabled,
      tabIndex: -1,
      hidden: true,
    }) as P & DropzoneInputProps;

  return {
    getRootProps,
    getInputProps,
    rootRef,
    inputRef,
    open,
    isDragActive: drag.active,
    isDragAccept: drag.verdict === "accept",
    isDragReject: drag.verdict === "reject",
    isDragUnknown: drag.verdict === "unknown",
    isDragGlobal: drag.global,
    isFocused: focused,
    isFileDialogActive: dialogActive,
    isProcessing: processing,
    acceptedFiles: accepted,
    fileRejections: rejections,
    dragFileRejections: drag.rejections,
  };
}

export interface DropzoneProps extends UseDropzoneOptions {
  /** Draws the drop target from the dropzone's state and prop getters. */
  children: (state: DropzoneState) => ReactNode;
}

/** What a `Dropzone` ref holds. */
export interface DropzoneRef {
  /** Opens the file dialog. */
  open(): void;
}

/** Dropzone — `useDropzone` as a component with a render function (react-dropzone's `Dropzone`). */
export const Dropzone = forwardRef(function Dropzone(
  { children, ...options }: DropzoneProps,
  ref: ForwardedRef<DropzoneRef>,
) {
  const state = useDropzone(options);
  useImperativeHandle(ref, () => ({ open: state.open }), [state.open]);
  return <>{children(state)}</>;
});
