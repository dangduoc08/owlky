/* Rows of the reference tables (tables.tsx), as data: server code reads them too. */

/** A prop or attribute that isn't a schema option (content, links, callbacks). */
export interface PropRow {
  react?: string;
  html?: string;
  type: string;
  description: string;
}

/** Keys (alternatives separated by " / ") and what they do. */
export type KeyboardRow = [keys: string, action: string];
