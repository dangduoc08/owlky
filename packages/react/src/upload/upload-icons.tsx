import { UPLOAD_FILE_ICON, type UploadFileKind, uploadFileLabel } from "@owlky/core";
import { upload } from "@owlky/core/illustrations";
import { Illustration } from "../illustration/illustration.js";

/*
 * Upload icons and illustration: original, static, decorative SVG (no external references).
 * The HTML snippets carry the same markup; the runtime builds the file icon from core's paths.
 */

/**
 * The drop zone illustration: the illustration set's `upload` picture (Foundations ›
 * Illustrations, ADR-0040), marked as Upload's part. Tones come from `illustration.css`, the size
 * from `upload.css`.
 */
export function UploadIllustration() {
  return <Illustration illustration={upload} data-ok-upload-illustration="" />;
}

/** A cloud with an arrow (box placeholder, Upload button). */
export function UploadCloudIcon() {
  return (
    <svg
      data-ok-upload-icon=""
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M6.5 19a4.5 4.5 0 0 1-.8-8.93 6.5 6.5 0 0 1 12.6-.97A5 5 0 0 1 17.5 19H13v-5h2.5L12 10.5 8.5 14H11v5Z" />
    </svg>
  );
}

/** A camera (avatar placeholder). */
export function UploadCameraIcon() {
  return (
    <svg
      data-ok-upload-icon=""
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      fill="currentColor"
      fillRule="evenodd"
    >
      <path d="M9 4h6l1.5 2H20a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3.5ZM12 9.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" />
    </svg>
  );
}

/** A cross (remove buttons). */
export function UploadCloseIcon() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

/** The file type icon of a file without a thumbnail: a page colored by kind, with its extension. */
export function UploadFileIcon({ name, kind }: { name: string; kind: UploadFileKind }) {
  const label = uploadFileLabel(name);
  return (
    <span data-ok-upload-file="" data-ok-kind={kind} aria-hidden="true">
      <svg viewBox={UPLOAD_FILE_ICON.viewBox} aria-hidden="true" focusable="false">
        {UPLOAD_FILE_ICON.paths.map((d) => (
          <path key={d} d={d} />
        ))}
      </svg>
      {label && <span data-ok-upload-file-ext="">{label}</span>}
    </span>
  );
}
