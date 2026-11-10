"use client";

import {
  createUploadController,
  formatUploadSize,
  type UploadAccept,
  type UploadController,
  type UploadDragRejection,
  type UploadDragState,
  type UploadErrorMessage,
  type UploadFilesFromEvent,
  type UploadLayout,
  type UploadRejection,
  type UploadValidator,
  type UploadVariant,
  uploadAcceptAttr,
  uploadAttributes,
  uploadFileKind,
  uploadIsImage,
  uploadUrlName,
} from "@owlky/core";
import {
  forwardRef,
  type HTMLAttributes,
  type ReactNode,
  type Ref,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Button } from "../button/button.js";
import { IconButton } from "../icon-button/icon-button.js";
import { useMergedRefs } from "../utils/refs.js";
import { useControllableState } from "../utils/use-controllable-state.js";
import {
  UploadCameraIcon,
  UploadCloseIcon,
  UploadCloudIcon,
  UploadFileIcon,
  UploadIllustration,
} from "./upload-icons.js";

/** A file the upload holds: a `File`, or the URL of a file uploaded before. */
export type UploadValue = File | string;

/** What the zone is doing (react-dropzone's state), for a placeholder render function. */
export interface UploadState {
  isDragActive: boolean;
  isDragAccept: boolean;
  isDragReject: boolean;
  isDragUnknown: boolean;
  isDragGlobal: boolean;
  isFileDialogActive: boolean;
  isProcessing: boolean;
  /** The dragged files that would be rejected, known by their MIME type only. */
  dragFileRejections: readonly UploadDragRejection[];
}

/** Imperative API (`apiRef`), like react-dropzone's `open` and `removeFile` / `clearFiles`. */
export interface UploadApi {
  /** Opens the file dialog. Call it from a user action (click, key). */
  open(): void;
  removeFile(file: UploadValue): void;
  clearFiles(): void;
  readonly files: readonly UploadValue[];
  readonly rejections: readonly UploadRejection[];
}

/** Texts of the built-in parts. */
export interface UploadLabels {
  /** Visually hidden text of remove buttons (followed by the file name). Default "Remove". */
  remove: string;
  /** Default "Remove all". */
  removeAll: string;
  /** Default "Upload". */
  upload: string;
  /** Avatar title without a photo. Default "Upload photo". */
  uploadPhoto: string;
  /** Avatar title with a photo. Default "Update photo". */
  updatePhoto: string;
}

const LABELS: UploadLabels = {
  remove: "Remove",
  removeAll: "Remove all",
  upload: "Upload",
  uploadPhoto: "Upload photo",
  updatePhoto: "Update photo",
};
const EMPTY: readonly UploadValue[] = [];
const NO_DRAG: UploadDragState = { active: false, verdict: null, global: false, rejections: [] };

export interface UploadProps
  extends Omit<
    HTMLAttributes<HTMLDivElement>,
    "onChange" | "defaultValue" | "onDrop" | "placeholder" | "title" | "onError"
  > {
  /** `default` (drop zone), `avatar` (round photo) or `box`. Set by UploadAvatar / UploadBox. */
  variant?: UploadVariant | undefined;
  /** Controlled files. */
  value?: readonly UploadValue[] | undefined;
  /** Uncontrolled initial files. */
  defaultValue?: readonly UploadValue[] | undefined;
  /** Called with the files the upload holds after a drop, a removal or a reset. */
  onChange?: ((files: UploadValue[]) => void) | undefined;
  /** Several files, added to the ones held. Default `false` (a new file replaces the old one). */
  multiple?: boolean | undefined;
  /** Accepted types: `"image/*,.pdf"`, `{ "image/*": [".png", ".jpg"] }` or labeled groups. */
  accept?: UploadAccept | undefined;
  /** Most files held (multiple; 0 = no limit). */
  maxFiles?: number | undefined;
  /** Largest file in bytes. */
  maxSize?: number | undefined;
  /** Smallest file in bytes. */
  minSize?: number | undefined;
  disabled?: boolean | undefined;
  /** Error colors (zone and helper text); the input gets `aria-invalid`. */
  error?: boolean | undefined;
  /** Text under the zone; it describes the input. */
  helperText?: ReactNode;
  /** File list: `vertical` rows (default) or `horizontal` tiles. */
  layout?: UploadLayout | undefined;
  /** Image previews in the list. Default `true`. */
  thumbnail?: boolean | undefined;
  /** Zone title (also the input's name). */
  title?: ReactNode;
  /** Text under the title. */
  description?: ReactNode;
  /** Replaces the zone's content; a function receives the drag state. */
  placeholder?: ReactNode | ((state: UploadState) => ReactNode);
  noClick?: boolean | undefined;
  noKeyboard?: boolean | undefined;
  noDrag?: boolean | undefined;
  noDragEventsBubbling?: boolean | undefined;
  noPaste?: boolean | undefined;
  /** Default `true`. */
  preventDropOnDocument?: boolean | undefined;
  useFsAccessApi?: boolean | undefined;
  /** Focuses the drop zone when it mounts. */
  autoFocus?: boolean | undefined;
  /** Checks each file: return an error (or several) to reject it. */
  validator?: UploadValidator | undefined;
  /** Reads the files of a drop or a change event (for example, to unpack folders). */
  getFilesFromEvent?: UploadFilesFromEvent | undefined;
  /** Returns the message shown for a rejected file. */
  getErrorMessage?: UploadErrorMessage | undefined;
  /** Every drop, pick or paste: the accepted and the rejected files. */
  onDrop?: ((accepted: File[], rejections: UploadRejection[]) => void) | undefined;
  /** Called with the files that passed the checks. */
  onDropAccepted?: ((files: File[]) => void) | undefined;
  /** Called with the files that were rejected and why. */
  onDropRejected?: ((rejections: UploadRejection[]) => void) | undefined;
  /** Called when the file dialog opens. */
  onFileDialogOpen?: (() => void) | undefined;
  /** Called when the file dialog closes without a choice. */
  onFileDialogCancel?: (() => void) | undefined;
  /** A validator or `getFilesFromEvent` threw; the drop is discarded. */
  onError?: ((error: unknown) => void) | undefined;
  /** A file was removed with its button (or `removeFile`). */
  onRemove?: ((file: UploadValue) => void) | undefined;
  /** Shows a "Remove all" button (multiple). */
  onRemoveAll?: (() => void) | undefined;
  /** Shows an "Upload" button (multiple); it receives the files. Sending them is up to you. */
  onUpload?: ((files: UploadValue[]) => void) | undefined;
  /** Input `name`, `form`, `required`, `capture` and `id`. */
  name?: string | undefined;
  /** The `form` the file input belongs to (its id). */
  form?: string | undefined;
  /** Makes the file input required in a form. */
  required?: boolean | undefined;
  /** Asks for the camera on phones: `user` (front) or `environment` (back). */
  capture?: "user" | "environment" | undefined;
  /** The id of the file input. */
  inputId?: string | undefined;
  /** A ref to the file input. */
  inputRef?: Ref<HTMLInputElement> | undefined;
  /** A ref to the upload's methods (open the dialog, set or clear files). */
  apiRef?: Ref<UploadApi> | undefined;
  /** Replaces the text of the labels and messages, such as for another language. */
  labels?: Partial<UploadLabels> | undefined;
  /** Language of the file sizes (default: the page's). */
  locale?: string | undefined;
}

/** A stable key per file. */
const keys = new WeakMap<File, number>();
let lastKey = 0;
const keyOf = (value: UploadValue, index: number) => {
  if (typeof value === "string") return `url-${index}-${value}`;
  let key = keys.get(value);
  if (key === undefined) {
    key = ++lastKey;
    keys.set(value, key);
  }
  return `file-${key}`;
};

const nameOf = (value: UploadValue) =>
  typeof value === "string" ? uploadUrlName(value) : value.name;
const isImage = (value: UploadValue) =>
  uploadIsImage(typeof value === "string" ? { name: uploadUrlName(value) } : value);

/** Object URLs of the image files, revoked when they leave or on unmount. */
function usePreviews(files: readonly UploadValue[]): ReadonlyMap<File, string> {
  const [urls, setUrls] = useState<ReadonlyMap<File, string>>(() => new Map());
  useEffect(() => {
    const map = new Map<File, string>();
    for (const file of files)
      if (file instanceof File && uploadIsImage(file)) map.set(file, URL.createObjectURL(file));
    setUrls(map);
    return () => {
      for (const url of map.values()) URL.revokeObjectURL(url);
    };
  }, [files]);
  return urls;
}

const srcOf = (value: UploadValue, urls: ReadonlyMap<File, string>) =>
  typeof value === "string" ? value : urls.get(value);

/**
 * Upload — spec: specs/components/upload.md (ADR-0037). A drop zone around a native file input
 * (the accessible control): press or drop files, paste them, or open the dialog with Enter /
 * Space. react-dropzone's options; the files it holds are mirrored into the input for forms.
 */
export const Upload = forwardRef<HTMLDivElement, UploadProps>(function Upload(
  {
    variant = "default",
    value,
    defaultValue,
    onChange,
    multiple = false,
    accept,
    maxFiles,
    maxSize,
    minSize,
    disabled,
    error,
    helperText,
    layout,
    thumbnail,
    title,
    description,
    placeholder,
    noClick,
    noKeyboard,
    noDrag,
    noDragEventsBubbling,
    noPaste,
    preventDropOnDocument,
    useFsAccessApi,
    autoFocus,
    validator,
    getFilesFromEvent,
    getErrorMessage,
    onDrop,
    onDropAccepted,
    onDropRejected,
    onFileDialogOpen,
    onFileDialogCancel,
    onError,
    onRemove,
    onRemoveAll,
    onUpload,
    name,
    form,
    required,
    capture,
    inputId,
    inputRef,
    apiRef,
    labels: labelsProp,
    locale,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledby,
    "aria-describedby": ariaDescribedby,
    ...props
  },
  ref,
) {
  const id = useId();
  const labels = { ...LABELS, ...labelsProp };
  const rootRef = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const controller = useRef<UploadController | null>(null);
  const rootRefs = useMergedRefs(rootRef, ref);
  const inputRefs = useMergedRefs(input, inputRef);
  const [files, setFiles] = useControllableState<readonly UploadValue[]>({
    value,
    defaultValue: defaultValue ?? EMPTY,
    onChange: onChange as ((files: readonly UploadValue[]) => void) | undefined,
  });
  const [rejections, setRejections] = useState<readonly UploadRejection[]>([]);
  const [drag, setDrag] = useState<UploadDragState>(NO_DRAG);
  const [dialogActive, setDialogActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const urls = usePreviews(files);
  const focusAfter = useRef<number | null>(null);
  const acceptAttr = uploadAcceptAttr(accept);
  const single = !multiple;

  // Everything the controller reads lives in refs, so it is created once.
  const latest = {
    files,
    multiple,
    accept,
    acceptAttr,
    maxFiles,
    maxSize,
    minSize,
    disabled,
    noClick,
    noKeyboard,
    noDrag,
    noDragEventsBubbling,
    noPaste,
    preventDropOnDocument,
    useFsAccessApi,
    validator,
    getFilesFromEvent,
    getErrorMessage,
    onDrop,
    onDropAccepted,
    onDropRejected,
    onFileDialogOpen,
    onFileDialogCancel,
    onError,
    setFiles,
  };
  const state = useRef(latest);
  state.current = latest;

  useEffect(() => {
    const root = rootRef.current as HTMLDivElement;
    const instance = createUploadController(root, {
      input: () => input.current,
      config: () => {
        const s = state.current;
        return {
          accept: s.acceptAttr,
          acceptOption: s.accept,
          multiple: s.multiple,
          maxFiles: s.maxFiles,
          maxSize: s.maxSize,
          minSize: s.minSize,
          existing: s.files.length,
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
      onFiles({ accepted, rejections: rejected }) {
        const s = state.current;
        setDialogActive(false);
        s.onDrop?.(accepted, rejected);
        if (rejected.length > 0) s.onDropRejected?.(rejected);
        if (accepted.length > 0) s.onDropAccepted?.(accepted);
        setRejections(rejected);
        if (accepted.length === 0) return;
        s.setFiles(s.multiple ? [...s.files, ...accepted] : accepted.slice(0, 1));
      },
      onDragChange: setDrag,
      onDialogOpen() {
        setDialogActive(true);
        state.current.onFileDialogOpen?.();
      },
      onDialogCancel() {
        setDialogActive(false);
        state.current.onFileDialogCancel?.();
      },
      onError: (failure) => state.current.onError?.(failure),
      onProcessingChange: setProcessing,
      onReset() {
        setRejections([]);
        state.current.setFiles(EMPTY);
      },
    });
    controller.current = instance;
    return () => {
      instance.destroy();
      controller.current = null;
    };
  }, []);

  // The input submits what the upload holds.
  useEffect(() => {
    controller.current?.sync(files.filter((file): file is File => file instanceof File));
  }, [files]);

  const remove = (index: number) => {
    const file = files[index];
    if (file === undefined) return;
    focusAfter.current = index;
    setFiles(files.filter((_, i) => i !== index));
    onRemove?.(file);
  };
  const clear = () => {
    focusAfter.current = -1;
    setRejections([]);
    setFiles(EMPTY);
  };

  // A removed button took the focus with it: move it to the next remove button, else the input.
  useLayoutEffect(() => {
    const index = focusAfter.current;
    if (index === null) return;
    focusAfter.current = null;
    const root = rootRef.current as HTMLDivElement;
    const active = root.ownerDocument.activeElement;
    // A hidden button keeps the focus in Firefox and WebKit: only a shown element counts.
    if (active && root.contains(active) && active.getClientRects().length > 0) return;
    const buttons = [
      ...root.querySelectorAll<HTMLElement>("[data-ok-upload-list] [data-ok-upload-remove]"),
    ];
    const next = index >= 0 ? buttons[Math.min(index, buttons.length - 1)] : undefined;
    (next ?? input.current)?.focus();
  });

  useImperativeHandle(
    apiRef,
    (): UploadApi => ({
      open: () => controller.current?.open(),
      removeFile(file) {
        const index = state.current.files.indexOf(file);
        if (index < 0) return;
        state.current.setFiles(state.current.files.filter((_, i) => i !== index));
      },
      clearFiles: () => {
        setRejections([]);
        state.current.setFiles(EMPTY);
      },
      get files() {
        return state.current.files;
      },
      get rejections() {
        return rejections;
      },
    }),
    [rejections],
  );

  const uploadState: UploadState = {
    isDragActive: drag.active,
    isDragAccept: drag.verdict === "accept",
    isDragReject: drag.verdict === "reject",
    isDragUnknown: drag.verdict === "unknown",
    isDragGlobal: drag.global,
    isFileDialogActive: dialogActive,
    isProcessing: processing,
    dragFileRejections: drag.rejections,
  };

  const titleId = `${id}-title`;
  const helperId = `${id}-helper`;
  const previewId = `${id}-preview`;
  const singleRemoveId = `${id}-remove`;
  const current = single ? files[0] : undefined;
  const avatar = variant === "avatar";
  const box = variant === "box";

  const defaultTitle = avatar
    ? current === undefined
      ? labels.uploadPhoto
      : labels.updatePhoto
    : multiple
      ? "Drop or select files"
      : "Drop or select a file";
  const titleNode = title ?? (box ? undefined : defaultTitle);
  const placeholderNode =
    typeof placeholder === "function" ? placeholder(uploadState) : placeholder;

  const content =
    placeholderNode !== undefined ? (
      placeholderNode
    ) : avatar ? (
      <>
        <UploadCameraIcon />
        <span
          data-ok-upload-title=""
          id={titleId}
          {...(title === undefined
            ? {
                "data-ok-label-upload": labels.uploadPhoto,
                "data-ok-label-update": labels.updatePhoto,
              }
            : {})}
        >
          {titleNode}
        </span>
      </>
    ) : box ? (
      <UploadCloudIcon />
    ) : (
      <>
        <UploadIllustration />
        <div data-ok-upload-placeholder-text="">
          <span data-ok-upload-title="" id={titleId}>
            {titleNode}
          </span>
          <span data-ok-upload-description="">
            {description ?? (
              <>
                {multiple ? "Drag files here, or " : "Drag a file here, or "}
                <span data-ok-upload-browse="">browse</span>
                {" your device."}
              </>
            )}
          </span>
        </div>
      </>
    );
  const hasTitle = placeholderNode === undefined && titleNode !== undefined;

  const thumb = (file: UploadValue) =>
    thumbnail !== false && isImage(file) && srcOf(file, urls) ? (
      <img src={srcOf(file, urls)} alt="" />
    ) : (
      <UploadFileIcon
        name={nameOf(file)}
        kind={uploadFileKind({
          name: nameOf(file),
          type: typeof file === "string" ? "" : file.type,
        })}
      />
    );
  const sizeOf = (file: UploadValue) =>
    typeof file === "string" ? undefined : formatUploadSize(file.size, locale);

  const preview =
    current === undefined ? null : (
      <span data-ok-upload-preview="" id={previewId}>
        {isImage(current) && srcOf(current, urls) ? (
          <img src={srcOf(current, urls)} alt={nameOf(current)} />
        ) : (
          <>
            <UploadFileIcon
              name={nameOf(current)}
              kind={uploadFileKind({
                name: nameOf(current),
                type: typeof current === "string" ? "" : current.type,
              })}
            />
            <span data-ok-upload-preview-name="">{nameOf(current)}</span>
            {sizeOf(current) !== undefined && (
              <span data-ok-upload-preview-size="">{sizeOf(current)}</span>
            )}
          </>
        )}
      </span>
    );

  return (
    <div
      ref={rootRefs}
      {...uploadAttributes({
        variant,
        layout,
        thumbnail,
        error,
        maxFiles,
        maxSize,
        minSize,
        noClick,
        noKeyboard,
        noDrag,
        noDragEventsBubbling,
        noPaste,
        preventDropOnDocument,
        useFsAccessApi,
      })}
      data-ok-runtime="off"
      {...props}
    >
      <div data-ok-upload-zone="">
        <input
          ref={inputRefs}
          type="file"
          data-ok-upload-input=""
          id={inputId ?? `${id}-input`}
          name={name}
          form={form}
          required={required}
          capture={capture}
          accept={acceptAttr || undefined}
          multiple={multiple}
          disabled={disabled}
          tabIndex={noKeyboard ? -1 : undefined}
          title=" "
          aria-label={ariaLabel ?? (box && !hasTitle ? "Upload file" : undefined)}
          aria-labelledby={
            ariaLabelledby ?? (ariaLabel === undefined && hasTitle ? titleId : undefined)
          }
          aria-describedby={
            [ariaDescribedby, helperText != null ? helperId : undefined]
              .filter(Boolean)
              .join(" ") || undefined
          }
          aria-invalid={error ? true : undefined}
          // biome-ignore lint/a11y/noAutofocus: an opt-in option (react-dropzone's autoFocus).
          autoFocus={autoFocus}
        />
        <div data-ok-upload-placeholder="">{content}</div>
        {preview}
        {single && variant === "default" && (
          <IconButton
            size="sm"
            data-ok-upload-remove=""
            id={singleRemoveId}
            aria-labelledby={`${singleRemoveId} ${previewId}`}
            hidden={current === undefined}
            onClick={() => remove(0)}
          >
            <span data-ok-upload-remove-text="">{labels.remove}</span>
            <UploadCloseIcon />
          </IconButton>
        )}
      </div>
      {helperText != null && (
        <div data-ok-upload-helper-text="" id={helperId}>
          {helperText}
        </div>
      )}
      <div data-ok-upload-rejections="" role="alert">
        {rejections.length > 0 && (
          <ul>
            {rejections.map(({ file, errors }) => (
              <li key={keyOf(file, 0)}>
                <span data-ok-upload-rejection-file="">
                  {`${file.name} - ${formatUploadSize(file.size, locale)}`}
                </span>
                {errors.map((failure) => (
                  <span key={failure.code} data-ok-upload-rejection-error="">
                    {`- ${failure.message}`}
                  </span>
                ))}
              </li>
            ))}
          </ul>
        )}
      </div>
      {multiple && variant === "default" && (
        <ul data-ok-upload-list="" aria-live="polite">
          {files.map((file, index) => {
            const key = keyOf(file, index);
            const nameId = `${id}-${key}-name`;
            const buttonId = `${id}-${key}-remove`;
            return (
              <li key={key} data-ok-upload-item="">
                <span data-ok-upload-thumb="">{thumb(file)}</span>
                <span data-ok-upload-item-text="">
                  <span data-ok-upload-item-name="" id={nameId}>
                    {nameOf(file)}
                  </span>
                  {sizeOf(file) !== undefined && (
                    <span data-ok-upload-item-size="">{sizeOf(file)}</span>
                  )}
                </span>
                <IconButton
                  size="sm"
                  data-ok-upload-remove=""
                  id={buttonId}
                  aria-labelledby={`${buttonId} ${nameId}`}
                  onClick={() => remove(index)}
                >
                  <span data-ok-upload-remove-text="">{labels.remove}</span>
                  <UploadCloseIcon />
                </IconButton>
              </li>
            );
          })}
        </ul>
      )}
      {multiple && variant === "default" && (onRemoveAll || onUpload) && (
        <div data-ok-upload-actions="" hidden={files.length === 0}>
          {onRemoveAll && (
            <Button
              variant="outlined"
              color="inherit"
              size="sm"
              data-ok-upload-remove-all=""
              onClick={() => {
                clear();
                onRemoveAll();
              }}
            >
              {labels.removeAll}
            </Button>
          )}
          {onUpload && (
            <Button
              variant="contained"
              color="inherit"
              size="sm"
              startIcon={<UploadCloudIcon />}
              data-ok-upload-submit=""
              onClick={() => onUpload([...files])}
            >
              {labels.upload}
            </Button>
          )}
        </div>
      )}
    </div>
  );
});

export interface UploadAvatarProps extends Omit<UploadProps, "variant" | "multiple" | "layout"> {}

/** UploadAvatar — a round photo picker (Minimals' UploadAvatar): one image, shown in the circle. */
export const UploadAvatar = forwardRef<HTMLDivElement, UploadAvatarProps>(function UploadAvatar(
  { accept = "image/*", ...props },
  ref,
) {
  return <Upload ref={ref} variant="avatar" accept={accept} {...props} />;
});

export interface UploadBoxProps extends Omit<UploadProps, "variant" | "layout" | "thumbnail"> {}

/** UploadBox — a small upload box whose placeholder is its content (an icon by default). */
export const UploadBox = forwardRef<HTMLDivElement, UploadBoxProps>(function UploadBox(
  { multiple = true, ...props },
  ref,
) {
  return <Upload ref={ref} variant="box" multiple={multiple} {...props} />;
});
