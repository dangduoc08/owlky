/*
 * Markup for docs examples, cut from the canonical HTML snippets
 * (packages/html/src/components/<name>/examples, imported with `?raw`), so long examples stay
 * complete and in step with the snippets instead of being shortened by hand. Snippets are
 * pretty-printed: an element's closing tag sits at the indentation of its opening tag.
 */

/**
 * The `index`-th element of `markup` whose opening tag contains `match` (such as
 * `data-ok-editor ` or `id="tip"`), with its whole content, dedented to column 0.
 */
export function snippetElement(markup: string, match: string, index = 0): string {
  const lines = markup.split("\n");
  const starts = lines.flatMap((line, i) => {
    const open = line.indexOf("<");
    return open !== -1 && line.slice(open).split(">")[0]?.includes(match) ? [i] : [];
  });
  const start = starts[index];
  if (start === undefined) throw new Error(`No element with ${match} in the snippet`);
  const first = lines[start] as string;
  const indent = first.length - first.trimStart().length;
  const tag = /^<([a-z0-9-]+)/.exec(first.trimStart())?.[1] ?? "";
  let end = start;
  // One-line element, or the closing tag at the same indentation.
  if (!first.trimEnd().endsWith(`</${tag}>`) && !first.trimEnd().endsWith("/>")) {
    end = lines.findIndex(
      (line, i) => i > start && line.startsWith(`${" ".repeat(indent)}</${tag}>`),
    );
    if (end === -1) throw new Error(`No closing </${tag}> for ${match}`);
  }
  return lines
    .slice(start, end + 1)
    .map((line) => line.slice(Math.min(indent, line.length - line.trimStart().length)))
    .join("\n");
}
