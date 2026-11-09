/** Protocols a Markdown URL may use (react-markdown's list). */
const SAFE_PROTOCOL = /^(https?|ircs?|mailto|xmpp)$/i;

/**
 * Makes a URL from Markdown safe: relative URLs (`/x`, `x`, `?q`, `#id`) and `http`, `https`,
 * `irc`, `ircs`, `mailto` and `xmpp` URLs stay as they are; anything else (`javascript:`,
 * `vbscript:`, `data:`, `file:`…) becomes `""`. A colon after the first `/`, `?` or `#` is part
 * of a relative URL. Browsers drop leading spaces and control characters before reading a
 * protocol: those make the protocol unsafe here too.
 */
export function defaultUrlTransform(value: string): string {
  const colon = value.indexOf(":");
  const questionMark = value.indexOf("?");
  const numberSign = value.indexOf("#");
  const slash = value.indexOf("/");
  if (
    colon === -1 ||
    (slash !== -1 && colon > slash) ||
    (questionMark !== -1 && colon > questionMark) ||
    (numberSign !== -1 && colon > numberSign) ||
    SAFE_PROTOCOL.test(value.slice(0, colon))
  )
    return value;
  return "";
}

/** Whether a (transformed) URL is absolute `http(s)`: an external link. */
export const isExternalUrl = (value: string): boolean => /^https?:\/\//i.test(value);
