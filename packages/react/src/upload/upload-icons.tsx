import {
  cameraLinear,
  closeLinear,
  cloudUploadLinear,
  fileLinear,
  type UploadFileKind,
  uploadFileLabel,
} from "@owlky/core";
import { upload } from "@owlky/core/illustrations";
import { Illustration } from "../illustration/illustration.js";
import { Icon } from "../utils/icon.js";

/*
 * Upload icons (Solar, ADR-0070 § 9) and illustration: static, decorative SVG. The HTML snippets
 * carry the same markup; the runtime builds the file icon from the same data.
 */

/**
 * The drop zone illustration: the illustration set's `upload` picture (Foundations ›
 * Illustrations, ADR-0041), marked as Upload's part. Tones come from `illustration.css`, the size
 * from `upload.css`.
 */
export function UploadIllustration() {
  return <Illustration illustration={upload} data-ok-upload-illustration="" />;
}

/** A cloud with an arrow (box placeholder, Upload button). */
export function UploadCloudIcon() {
  return <Icon icon={cloudUploadLinear} data-ok-upload-icon="" />;
}

/** A camera (avatar placeholder). */
export function UploadCameraIcon() {
  return <Icon icon={cameraLinear} data-ok-upload-icon="" />;
}

/** A cross (remove buttons). */
export function UploadCloseIcon() {
  return <Icon icon={closeLinear} />;
}

/** The file type icon of a file without a thumbnail: a page colored by kind, with its extension. */
export function UploadFileIcon({ name, kind }: { name: string; kind: UploadFileKind }) {
  const label = uploadFileLabel(name);
  return (
    <span data-ok-upload-file="" data-ok-kind={kind} aria-hidden="true">
      <Icon icon={fileLinear} />
      {label && <span data-ok-upload-file-ext="">{label}</span>}
    </span>
  );
}
