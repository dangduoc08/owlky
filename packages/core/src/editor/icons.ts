/**
 * Toolbar icons: path data for a 24 × 24 line icon (`fill="none"`, `stroke="currentColor"`,
 * 2px round strokes). React and the HTML snippets draw the same paths.
 */
export const editorIcons = {
  bold: "M7 5h6a3.5 3.5 0 0 1 0 7H7z M7 12h7a3.5 3.5 0 0 1 0 7H7z",
  italic: "M10 5h8 M6 19h8 M14 5l-4 14",
  underline: "M7 4v7a5 5 0 0 0 10 0V4 M5 20h14",
  strike:
    "M5 12h14 M16.5 7C15.8 5.5 14.2 4.5 12 4.5 9.5 4.5 7.5 5.8 7.5 8c0 1.4.8 2.4 2 3 M8 16.5c.7 1.8 2.3 3 4.5 3 2.6 0 4.5-1.4 4.5-3.5 0-.6-.1-1.1-.4-1.5",
  bulletList: "M10 6h10 M10 12h10 M10 18h10 M5 6h.01 M5 12h.01 M5 18h.01",
  orderedList:
    "M10 6h10 M10 12h10 M10 18h10 M4 4h1.5v5 M4 9h3 M4 14.5a1.5 1.5 0 0 1 3 0c0 1.2-3 2.3-3 4h3",
  alignLeft: "M4 6h16 M4 10h10 M4 14h16 M4 18h10",
  alignCenter: "M4 6h16 M7 10h10 M4 14h16 M7 18h10",
  alignRight: "M4 6h16 M10 10h10 M4 14h16 M10 18h10",
  alignJustify: "M4 6h16 M4 10h16 M4 14h16 M4 18h16",
  code: "M9 7l-5 5 5 5 M15 7l5 5-5 5",
  codeBlock:
    "M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z M10 9.5L7.5 12l2.5 2.5 M14 9.5l2.5 2.5-2.5 2.5",
  blockquote: "M10 7H5v5h5zm0 5c0 2.5-1.2 4-3.5 5 M19 7h-5v5h5zm0 5c0 2.5-1.2 4-3.5 5",
  horizontalRule: "M4 12h3 M10.5 12h3 M17 12h3",
  link: "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1 M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1",
  unlink:
    "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1 M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1 M4 4l16 16",
  image:
    "M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z M4 16l5-5 4 4 2-2 5 5 M15 8.5h.01",
  hardBreak: "M4 6h16 M4 12h13a3 3 0 0 1 0 6h-4 M15 16l-2 2 2 2 M4 18h5",
  clearFormat: "M7 5h12 M13 5l-4 14 M4 4l16 16",
  undo: "M9 14L4 9l5-5 M4 9h10a6 6 0 0 1 0 12h-3",
  redo: "M15 14l5-5-5-5 M20 9H10a6 6 0 0 0 0 12h3",
  fullscreen: "M4 9V4h5 M15 4h5v5 M20 15v5h-5 M9 20H4v-5",
  exitFullscreen: "M9 4v5H4 M20 9h-5V4 M15 20v-5h5 M4 15h5v5",
  chevronDown: "M6 9l6 6 6-6",
} as const;

export type EditorIconName = keyof typeof editorIcons;
