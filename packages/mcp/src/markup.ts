/*
 * A small HTML tag / attribute scanner (ADR-0046): enough structure to check `data-ok-*` names,
 * option values and parts. It never builds a DOM, runs scripts or resolves URLs: input is only
 * read as text. Raw-text elements (`script`, `style`, `textarea`, `title`) are skipped whole.
 */

export interface ScannedElement {
  /** Lowercase tag name. */
  readonly tag: string;
  /** Attributes in source order; names lowercase, values decoded (`""` without a value). */
  readonly attributes: readonly (readonly [name: string, value: string])[];
  /** 1-based position of the `<`. */
  readonly line: number;
  readonly column: number;
  /** Index of the parent element in `elements`, or -1 at the top level. */
  readonly parent: number;
}

export interface ScanResult {
  readonly elements: readonly ScannedElement[];
}

const VOID = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);
const RAW_TEXT = new Set(["script", "style", "textarea", "title"]);
const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

/** Decodes the entities an attribute value commonly carries; unknown ones stay as written. */
export function decodeEntities(value: string): string {
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, body: string) => {
    if (body[0] === "#") {
      const code =
        body[1] === "x" || body[1] === "X"
          ? Number.parseInt(body.slice(2), 16)
          : Number.parseInt(body.slice(1), 10);
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : match;
    }
    return ENTITIES[body.toLowerCase()] ?? match;
  });
}

const isSpace = (char: string | undefined) =>
  char === " " || char === "\n" || char === "\t" || char === "\r" || char === "\f";
const isNameStart = (char: string | undefined) => char !== undefined && /[a-z]/i.test(char);

/** Scans `source` into a flat list of elements with parent links. */
export function scanMarkup(source: string): ScanResult {
  const elements: ScannedElement[] = [];
  const lineStarts = [0];
  for (let i = 0; i < source.length; i++) if (source[i] === "\n") lineStarts.push(i + 1);
  const position = (offset: number) => {
    let low = 0;
    let high = lineStarts.length - 1;
    while (low < high) {
      const mid = (low + high + 1) >> 1;
      if ((lineStarts[mid] as number) <= offset) low = mid;
      else high = mid - 1;
    }
    return { line: low + 1, column: offset - (lineStarts[low] as number) + 1 };
  };

  /** Open elements: indexes into `elements`. */
  const stack: number[] = [];
  const lower = source.toLowerCase();
  let i = 0;
  const length = source.length;
  while (i < length) {
    const open = source.indexOf("<", i);
    if (open === -1) break;
    i = open;
    if (source.startsWith("<!--", i)) {
      const end = source.indexOf("-->", i + 4);
      i = end === -1 ? length : end + 3;
      continue;
    }
    if (source[i + 1] === "!" || source[i + 1] === "?") {
      const end = source.indexOf(">", i + 2);
      i = end === -1 ? length : end + 1;
      continue;
    }
    if (source[i + 1] === "/") {
      // End tag: close up to the nearest open element with that name (stray ones are ignored).
      let j = i + 2;
      while (j < length && !isSpace(source[j]) && source[j] !== ">") j++;
      const name = source.slice(i + 2, j).toLowerCase();
      const end = source.indexOf(">", j);
      i = end === -1 ? length : end + 1;
      for (let k = stack.length - 1; k >= 0; k--) {
        if ((elements[stack[k] as number] as ScannedElement).tag === name) {
          stack.length = k;
          break;
        }
      }
      continue;
    }
    if (!isNameStart(source[i + 1])) {
      i++;
      continue;
    }
    let j = i + 1;
    while (j < length && !isSpace(source[j]) && source[j] !== ">" && source[j] !== "/") j++;
    const tag = source.slice(i + 1, j).toLowerCase();
    const attributes: [string, string][] = [];
    let selfClosing = false;
    while (j < length) {
      while (j < length && isSpace(source[j])) j++;
      const char = source[j];
      if (char === undefined) break;
      if (char === ">") {
        j++;
        break;
      }
      if (char === "/") {
        if (source[j + 1] === ">") {
          selfClosing = true;
          j += 2;
          break;
        }
        j++;
        continue;
      }
      const nameStart = j;
      while (
        j < length &&
        !isSpace(source[j]) &&
        source[j] !== "=" &&
        source[j] !== ">" &&
        !(source[j] === "/" && source[j + 1] === ">")
      )
        j++;
      // `j > nameStart` always holds: the loop stops only on characters handled above.
      const name = source.slice(nameStart, j).toLowerCase();
      let k = j;
      while (k < length && isSpace(source[k])) k++;
      let value = "";
      if (source[k] === "=") {
        k++;
        while (k < length && isSpace(source[k])) k++;
        const quote = source[k];
        if (quote === '"' || quote === "'") {
          const end = source.indexOf(quote, k + 1);
          value = source.slice(k + 1, end === -1 ? length : end);
          j = end === -1 ? length : end + 1;
        } else {
          const start = k;
          while (k < length && !isSpace(source[k]) && source[k] !== ">") k++;
          value = source.slice(start, k);
          j = k;
        }
      }
      attributes.push([name, decodeEntities(value)]);
    }
    const { line, column } = position(i);
    const index = elements.length;
    elements.push({ tag, attributes, line, column, parent: stack.at(-1) ?? -1 });
    i = j;
    if (RAW_TEXT.has(tag)) {
      const close = lower.indexOf(`</${tag}`, i);
      i = close === -1 ? length : close;
      continue;
    }
    if (!selfClosing && !VOID.has(tag)) stack.push(index);
  }
  return { elements };
}
