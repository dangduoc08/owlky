import {
  behavior,
  type DataAttributes,
  defineOptions,
  flag,
  native,
  number,
  optionAttributes,
  state,
  style,
} from "../options/define.js";

// --- Upload (ADR-0037) --------------------------------------------------------------------------

export const uploadVariants = ["default", "avatar", "box"] as const;
export const uploadLayouts = ["vertical", "horizontal"] as const;

export type UploadVariant = (typeof uploadVariants)[number];
export type UploadLayout = (typeof uploadLayouts)[number];

const uploadInput = "[data-ok-upload-input]";

export const uploadOptions = defineOptions("upload", "data-ok-upload", {
  variant: style(
    "data-ok-variant",
    uploadVariants,
    "default",
    "`default`: a drop zone with an illustration; `avatar`: a round photo picker; `box`: a small box.",
  ),
  layout: style(
    "data-ok-layout",
    uploadLayouts,
    "vertical",
    "File list: rows with names and sizes, or a wrapping row of tiles.",
  ),
  thumbnail: behavior(
    "data-ok-thumbnail",
    true,
    "Image files show a preview; `false` shows the file type icon instead.",
  ),
  multiple: native("multiple", "Accepts several files and keeps adding them.", {
    children: uploadInput,
  }),
  disabled: native("disabled", "Can't receive files (input disabled, dimmed).", {
    children: uploadInput,
  }),
  error: flag("data-ok-error", "Error colors on the zone and the helper text."),
  maxFiles: number(
    "data-ok-max-files",
    undefined,
    "Most files the upload holds (multiple; 0 = no limit). The others are rejected.",
    { min: 0 },
  ),
  maxSize: number("data-ok-max-size", undefined, "Largest accepted file, in bytes.", { min: 0 }),
  minSize: number("data-ok-min-size", undefined, "Smallest accepted file, in bytes.", { min: 0 }),
  noClick: flag("data-ok-no-click", "A press on the zone doesn't open the file dialog."),
  noKeyboard: flag(
    "data-ok-no-keyboard",
    "The input leaves the tab order (give people another way to open the dialog).",
  ),
  noDrag: flag("data-ok-no-drag", "Files can't be dropped on the zone."),
  noDragEventsBubbling: flag(
    "data-ok-no-drag-events-bubbling",
    "Drags handled here don't reach an outer upload.",
  ),
  noPaste: flag("data-ok-no-paste", "Pasting files while the upload has focus does nothing."),
  preventDropOnDocument: behavior(
    "data-ok-prevent-drop-on-document",
    true,
    "Files dropped outside an upload don't open in the tab.",
  ),
  useFsAccessApi: flag(
    "data-ok-use-fs-access-api",
    "Opens the File System Access picker where supported (the input otherwise).",
  ),
  value: state("files", "The files the upload holds (`value` / `defaultValue`).", "change"),
});

export interface UploadAnatomyOptions {
  variant?: UploadVariant | undefined;
  layout?: UploadLayout | undefined;
  thumbnail?: boolean | undefined;
  error?: boolean | undefined;
  maxFiles?: number | undefined;
  maxSize?: number | undefined;
  minSize?: number | undefined;
  noClick?: boolean | undefined;
  noKeyboard?: boolean | undefined;
  noDrag?: boolean | undefined;
  noDragEventsBubbling?: boolean | undefined;
  noPaste?: boolean | undefined;
  preventDropOnDocument?: boolean | undefined;
  useFsAccessApi?: boolean | undefined;
}

/** `data-ok-*` attributes of an upload root. Behaviors are written only when turned off. */
export function uploadAttributes(options: UploadAnatomyOptions = {}): DataAttributes {
  const attributes = optionAttributes(uploadOptions, { ...options });
  const { options: spec } = uploadOptions;
  if (options.thumbnail === false) attributes[spec.thumbnail.attr] = "false";
  if (options.preventDropOnDocument === false)
    attributes[spec.preventDropOnDocument.attr] = "false";
  return attributes;
}
