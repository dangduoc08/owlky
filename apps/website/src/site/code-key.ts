/** Key of a code block in a page's map of highlighted blocks (server and client). */
export const codeKey = (language: string, code: string) => `${language}\u0000${code}`;
