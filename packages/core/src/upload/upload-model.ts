/*
 * Upload model (ADR-0037): pure helpers shared by the React Upload and the HTML runtime —
 * `accept` parsing and matching, size checks, rejection errors, the drag verdict, file kinds and
 * byte formatting. No DOM access except reading `File` fields.
 */

/** A MIME type (`image/png`, `image/*`) mapped to file extensions (react-dropzone's `accept`). */
export interface UploadAcceptMap {
  [mime: string]: string | readonly string[];
}

/** A labeled group of types: one filter row in the File System Access picker. */
export interface UploadAcceptGroup {
  description?: string | undefined;
  accept: UploadAcceptMap;
}

/** The `accept` option: an `<input accept>` string, a MIME → extensions map, or groups. */
export type UploadAccept = string | UploadAcceptMap | readonly UploadAcceptGroup[];

export const uploadErrorCodes = [
  "file-invalid-type",
  "file-too-large",
  "file-too-small",
  "too-many-files",
] as const;
export type UploadErrorCode = (typeof uploadErrorCodes)[number];

/** Why a file was rejected: a built-in code or one of your validator's codes. */
export interface UploadFileError {
  code: UploadErrorCode | (string & {});
  message: string;
}

/** A rejected file and every reason. */
export interface UploadRejection {
  file: File;
  errors: readonly UploadFileError[];
}

/** What a validator returns: `null` (accepted), one error or a list. */
export type UploadValidatorResult = UploadFileError | readonly UploadFileError[] | null | undefined;

/** Rewrites the message of an error (localization). */
export type UploadErrorMessage = (error: UploadFileError, file: File) => string;

const MIME = /^[a-z0-9][a-z0-9!#$&^_.+-]*\/(?:\*|[a-z0-9][a-z0-9!#$&^_.+-]*)$/;
const EXTENSION = /^\.[a-z0-9][a-z0-9_+-]*(?:\.[a-z0-9_+-]+)*$/;
const MAX_PATTERN = 100;

/** A valid accept pattern (lowercase): a MIME type, a `type/*` wildcard or an extension. */
const cleanPattern = (value: unknown): string | null => {
  if (typeof value !== "string" || value.length > MAX_PATTERN) return null;
  const text = value.trim().toLowerCase();
  return MIME.test(text) || EXTENSION.test(text) ? text : null;
};

const isGroups = (accept: UploadAccept): accept is readonly UploadAcceptGroup[] =>
  Array.isArray(accept);

/** One MIME → extensions map for groups (upstream `flattenAccept`); own keys only. */
export function flattenUploadAccept(
  accept: UploadAccept | undefined,
): UploadAcceptMap | string | undefined {
  if (accept === undefined || typeof accept === "string") return accept;
  if (!isGroups(accept)) return accept;
  const map: Record<string, string[]> = {};
  for (const group of accept) {
    for (const [mime, extensions] of Object.entries(group?.accept ?? {})) {
      map[mime] = [
        ...(map[mime] ?? []),
        ...(typeof extensions === "string" ? [extensions] : extensions),
      ];
    }
  }
  return map;
}

/**
 * The `<input accept>` value of an `accept` option: only valid MIME types, wildcards and
 * extensions survive (anything else is dropped). A wildcard paired with extensions
 * (`{ "image/*": [".png"] }`) leaves only the extensions, so `.gif` isn't accepted.
 */
export function uploadAcceptAttr(accept: UploadAccept | undefined): string {
  const flat = flattenUploadAccept(accept);
  if (flat === undefined) return "";
  const patterns: string[] = [];
  const add = (value: unknown) => {
    const pattern = cleanPattern(value);
    if (pattern !== null && !patterns.includes(pattern)) patterns.push(pattern);
  };
  if (typeof flat === "string") {
    for (const part of flat.split(",")) add(part);
    return patterns.join(",");
  }
  for (const [mime, value] of Object.entries(flat)) {
    const extensions = (typeof value === "string" ? [value] : [...(value ?? [])]).filter(
      (ext) => cleanPattern(ext)?.startsWith(".") === true,
    );
    if (!(mime.endsWith("/*") && extensions.length > 0)) add(mime);
    for (const ext of extensions) add(ext);
  }
  return patterns.join(",");
}

/** The patterns of an accept attribute (already cleaned by `uploadAcceptAttr`). */
export const uploadAcceptPatterns = (attr: string | null | undefined): string[] =>
  uploadAcceptAttr(attr ?? "")
    .split(",")
    .filter(Boolean);

/** Whether a MIME type matches a pattern (`image/*` or exact). */
const mimeMatches = (type: string, pattern: string) =>
  pattern.endsWith("/*") ? type.startsWith(pattern.slice(0, -1)) : type === pattern;

/** Whether `file` matches the accept attribute (empty: everything), like the native picker. */
export function uploadFileAccepted(
  file: Pick<File, "name" | "type">,
  attr: string | null | undefined,
): boolean {
  const patterns = uploadAcceptPatterns(attr);
  if (patterns.length === 0) return true;
  const name = file.name.toLowerCase();
  const type = (file.type.toLowerCase().split(";")[0] ?? "").trim();
  return patterns.some((pattern) =>
    pattern.startsWith(".") ? name.endsWith(pattern) : mimeMatches(type, pattern),
  );
}

/** Rounded with at most two decimals, in the reader's language. */
const number = (value: number, locale?: string) =>
  new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value);

const UNITS = ["KB", "MB", "GB", "TB"] as const;

/** `1536` → "1.5 KB" (binary units, like the reference's sizes); invalid → "". */
export function formatUploadSize(bytes: number, locale?: string): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "";
  if (bytes < 1024) return `${number(bytes, locale)} ${bytes === 1 ? "byte" : "bytes"}`;
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${number(value, locale)} ${UNITS[unit]}`;
}

/** Limits of a drop: what the built-in checks need. */
export interface UploadLimits {
  /** Cleaned accept attribute (`uploadAcceptAttr`). */
  accept?: string | undefined;
  minSize?: number | undefined;
  maxSize?: number | undefined;
  multiple?: boolean | undefined;
  /** Most files the upload holds (multiple only; 0 / undefined = no limit). */
  maxFiles?: number | undefined;
}

/** The built-in error of a code, in English (rewrite it with `getErrorMessage`). */
export function uploadError(
  code: UploadErrorCode,
  limits: Pick<UploadLimits, "accept" | "minSize" | "maxSize"> = {},
): UploadFileError {
  switch (code) {
    case "file-invalid-type": {
      const types = uploadAcceptPatterns(limits.accept);
      return {
        code,
        message:
          types.length > 1
            ? `File type must be one of ${types.join(", ")}`
            : `File type must be ${types[0] ?? "accepted"}`,
      };
    }
    case "file-too-large":
      return { code, message: `File is larger than ${formatUploadSize(limits.maxSize ?? 0)}` };
    case "file-too-small":
      return { code, message: `File is smaller than ${formatUploadSize(limits.minSize ?? 0)}` };
    default:
      return { code, message: "Too many files" };
  }
}

/** A validator result as a list (`null` → empty). */
const errorList = (result: UploadValidatorResult): UploadFileError[] => {
  if (result == null) return [];
  return (Array.isArray(result) ? result : [result as UploadFileError]).filter(
    (error): error is UploadFileError =>
      error != null && typeof error.code === "string" && typeof error.message === "string",
  );
};

/** How many files a drop may add. */
const capacity = ({ multiple, maxFiles }: UploadLimits, existing: number) =>
  !multiple
    ? 1
    : maxFiles !== undefined && maxFiles >= 1
      ? Math.max(0, maxFiles - existing)
      : Number.POSITIVE_INFINITY;

export interface UploadEvaluation {
  accepted: File[];
  rejections: UploadRejection[];
}

/**
 * Sorts dropped or picked files into accepted and rejected ones: type, size and validator
 * errors per file, then `too-many-files` for the files past the limit (single: 1; multiple:
 * `maxFiles` minus the files the upload already holds). `custom[i]` is the validator's result
 * for `files[i]`.
 */
export function evaluateUploadFiles(
  files: readonly File[],
  limits: UploadLimits,
  options: {
    existing?: number | undefined;
    custom?: readonly UploadValidatorResult[] | undefined;
    getErrorMessage?: UploadErrorMessage | undefined;
  } = {},
): UploadEvaluation {
  const { existing = 0, custom = [], getErrorMessage } = options;
  const localize = (error: UploadFileError, file: File): UploadFileError => {
    if (!getErrorMessage) return error;
    const message = getErrorMessage(error, file);
    return typeof message === "string" ? { ...error, message } : error;
  };
  const accepted: File[] = [];
  const rejections: UploadRejection[] = [];
  files.forEach((file, index) => {
    const errors: UploadFileError[] = [];
    if (!uploadFileAccepted(file, limits.accept))
      errors.push(uploadError("file-invalid-type", limits));
    if (limits.maxSize !== undefined && file.size > limits.maxSize)
      errors.push(uploadError("file-too-large", limits));
    if (limits.minSize !== undefined && file.size < limits.minSize)
      errors.push(uploadError("file-too-small", limits));
    errors.push(...errorList(custom[index]));
    if (errors.length === 0) accepted.push(file);
    else rejections.push({ file, errors: errors.map((error) => localize(error, file)) });
  });
  const limit = capacity(limits, existing);
  if (accepted.length > limit) {
    for (const file of accepted.splice(limit)) {
      rejections.push({ file, errors: [localize(uploadError("too-many-files"), file)] });
    }
  }
  return { accepted, rejections };
}

/** What the zone shows while files are dragged over it. */
export type UploadDragVerdict = "accept" | "reject" | "unknown";

/** A dragged file that would be rejected, known by its MIME type only (react-dropzone's `dragFileRejections`). */
export interface UploadDragRejection {
  /** Position among the dragged files. */
  index: number;
  /** MIME type (empty when the browser doesn't tell). */
  type: string;
  errors: readonly UploadFileError[];
}

/**
 * The dragged files that would be rejected, while only their MIME types and count are known:
 * `file-invalid-type` when a known type matches none of the MIME types of `accept` (extension
 * patterns are only checked at drop time), `too-many-files` past the limit (as at drop time).
 */
export function uploadDragRejections(
  types: readonly string[],
  limits: UploadLimits,
  existing = 0,
): UploadDragRejection[] {
  const patterns = uploadAcceptPatterns(limits.accept);
  const mimes = patterns.filter((pattern) => !pattern.startsWith("."));
  const extensions = patterns.length > mimes.length;
  const rejections: UploadDragRejection[] = [];
  let fits = 0;
  const limit = capacity(limits, existing);
  types.forEach((raw, index) => {
    const type = raw.toLowerCase();
    const known = type !== "" && !extensions && mimes.length > 0;
    if (known && !mimes.some((mime) => mimeMatches(type, mime)))
      rejections.push({ index, type: raw, errors: [uploadError("file-invalid-type", limits)] });
    else if (++fits > limit)
      rejections.push({ index, type: raw, errors: [uploadError("too-many-files")] });
  });
  return rejections;
}

/**
 * The verdict during a drag, when only the files' MIME types and count are known: `reject` when
 * the count is over the limit or a known type doesn't match the MIME types of `accept`;
 * `unknown` when a validator or extension-only patterns decide at drop time; else `accept`.
 */
export function uploadDragVerdict(
  types: readonly string[],
  limits: UploadLimits,
  options: { existing?: number | undefined; validator?: boolean | undefined } = {},
): UploadDragVerdict {
  if (types.length > capacity(limits, options.existing ?? 0)) return "reject";
  const patterns = uploadAcceptPatterns(limits.accept);
  const mimes = patterns.filter((pattern) => !pattern.startsWith("."));
  const extensions = patterns.length > mimes.length;
  let unknown = options.validator === true;
  for (const raw of types) {
    const type = raw.toLowerCase();
    if (patterns.length === 0) continue;
    if (type === "" || extensions) {
      // No type (some files), or extensions only known at drop time.
      if (!mimes.some((mime) => type !== "" && mimeMatches(type, mime))) unknown = true;
      continue;
    }
    if (!mimes.some((mime) => mimeMatches(type, mime))) return "reject";
  }
  return unknown ? "unknown" : "accept";
}

/** Kinds of files, for the icon and color of a file without a thumbnail. */
export const uploadFileKinds = [
  "image",
  "video",
  "audio",
  "pdf",
  "document",
  "spreadsheet",
  "presentation",
  "archive",
  "text",
  "code",
  "other",
] as const;
export type UploadFileKind = (typeof uploadFileKinds)[number];

const KIND_EXTENSIONS: [UploadFileKind, RegExp][] = [
  ["pdf", /^pdf$/],
  ["image", /^(png|jpe?g|gif|webp|avif|svg|bmp|ico|heic|heif|tiff?)$/],
  ["video", /^(mp4|webm|mov|m4v|avi|mkv|ogv)$/],
  ["audio", /^(mp3|wav|ogg|oga|m4a|flac|aac|opus)$/],
  ["document", /^(docx?|odt|rtf|pages)$/],
  ["spreadsheet", /^(xlsx?|ods|csv|tsv|numbers)$/],
  ["presentation", /^(pptx?|odp|key)$/],
  ["archive", /^(zip|rar|7z|tar|gz|tgz|bz2|xz)$/],
  ["text", /^(txt|md|log)$/],
  ["code", /^(js|mjs|ts|tsx|jsx|json|html?|css|xml|ya?ml|py|rb|go|rs|java|c|cpp|h|sh)$/],
];

/** The extension of a name, lowercase, without the dot (`""` when none or not plain). */
export function uploadFileExtension(name: string): string {
  const match = /\.([a-z0-9]{1,8})$/i.exec(name.trim());
  return match ? (match[1] as string).toLowerCase() : "";
}

/** The kind of a file from its extension, then its MIME type. */
export function uploadFileKind(file: { name: string; type?: string | undefined }): UploadFileKind {
  const extension = uploadFileExtension(file.name);
  for (const [kind, pattern] of KIND_EXTENSIONS) if (pattern.test(extension)) return kind;
  const type = (file.type ?? "").toLowerCase();
  if (type === "application/pdf") return "pdf";
  for (const kind of ["image", "video", "audio", "text"] as const)
    if (type.startsWith(`${kind}/`)) return kind;
  return "other";
}

/** Whether a file can be previewed with `<img>` (browser-decodable image types). */
export const uploadIsImage = (file: { name: string; type?: string | undefined }): boolean =>
  uploadFileKind(file) === "image" && !/^(heic|heif|tiff?)$/.test(uploadFileExtension(file.name));

/** The label shown on a file icon: the extension, at most four characters, uppercase. */
export const uploadFileLabel = (name: string): string =>
  uploadFileExtension(name).slice(0, 4).toUpperCase();

/** The name of a URL value (an existing file): its last path segment, decoded when valid. */
export function uploadUrlName(url: string): string {
  const path = url.split(/[?#]/)[0] ?? "";
  const last = path.split("/").filter(Boolean).pop() ?? "";
  try {
    return decodeURIComponent(last);
  } catch {
    return last;
  }
}

/** The types of a File System Access picker for `accept` (one row per group). */
export function uploadPickerTypes(
  accept: UploadAccept | undefined,
): { description?: string; accept: Record<string, string[]> }[] {
  if (accept === undefined) return [];
  const groups: { description?: string | undefined; accept: UploadAcceptMap | string }[] =
    typeof accept === "string" || !isGroups(accept) ? [{ accept }] : [...accept];
  const types: { description?: string; accept: Record<string, string[]> }[] = [];
  for (const group of groups) {
    const map: Record<string, string[]> = {};
    const patterns =
      typeof group.accept === "string"
        ? uploadAcceptPatterns(group.accept).map((p) => [p, [] as string[]] as const)
        : Object.entries(group.accept).map(
            ([mime, value]) => [mime, typeof value === "string" ? [value] : [...value]] as const,
          );
    for (const [key, extensions] of patterns) {
      const pattern = cleanPattern(key);
      if (pattern === null) continue;
      const exts = extensions
        .map(cleanPattern)
        .filter((e): e is string => e?.startsWith(".") === true);
      const target = pattern.startsWith(".") ? "application/octet-stream" : pattern;
      map[target] = [...(map[target] ?? []), ...(pattern.startsWith(".") ? [pattern] : exts)];
    }
    if (Object.keys(map).length === 0) continue;
    types.push({ ...(group.description ? { description: group.description } : {}), accept: map });
  }
  return types;
}
