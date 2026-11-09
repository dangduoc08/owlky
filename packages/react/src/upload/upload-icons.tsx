import { UPLOAD_FILE_ICON, type UploadFileKind, uploadFileLabel } from "@owlky/core";

/*
 * Upload icons and illustration: original, static, decorative SVG (no external references).
 * The HTML snippets carry the same markup; the runtime builds the file icon from core's paths.
 */

/** The drop zone illustration: an open folder with two pages. Colors come from `upload.css`. */
export function UploadIllustration() {
  return (
    <svg data-ok-upload-illustration="" aria-hidden="true" focusable="false" viewBox="0 0 200 150">
      <ellipse data-ok-tone="shadow" cx="100" cy="138" rx="76" ry="7" />
      <circle data-ok-tone="light" cx="26" cy="34" r="5" />
      <circle data-ok-tone="light" cx="176" cy="26" r="4" />
      <circle data-ok-tone="light" cx="184" cy="96" r="3" />
      <circle data-ok-tone="light" cx="14" cy="104" r="3" />
      <path
        data-ok-tone="dark"
        d="M38 44h42l10 12h72a8 8 0 0 1 8 8v58a8 8 0 0 1-8 8H38a8 8 0 0 1-8-8V52a8 8 0 0 1 8-8Z"
      />
      <g transform="rotate(-8 88 60)">
        <rect data-ok-tone="paper" x="58" y="18" width="62" height="78" rx="6" />
        <path data-ok-tone="line" d="M68 34h34M68 44h42M68 54h26" />
      </g>
      <g transform="rotate(7 118 56)">
        <rect data-ok-tone="paper" x="88" y="16" width="62" height="78" rx="6" />
        <path data-ok-tone="line" d="M98 32h40M98 42h30M98 52h36" />
      </g>
      <path
        data-ok-tone="main"
        d="M26 78a8 8 0 0 1 8-8h132a8 8 0 0 1 8 8l-6 46a8 8 0 0 1-8 7H40a8 8 0 0 1-8-7Z"
      />
      <circle data-ok-tone="light" cx="100" cy="104" r="13" />
      <path data-ok-tone="arrow" d="M100 112v-15m-6 6 6-6 6 6" />
    </svg>
  );
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
