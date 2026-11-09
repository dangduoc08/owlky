/** Sample content of the code editor stories (plain data, shared by React and HTML). */

export const EDITOR_SAMPLE = `type Task = { id: number; title: string; done: boolean };

const tasks: Task[] = [
  { id: 1, title: "Write the release notes", done: true },
  { id: 2, title: "Review the pull request", done: false },
];

/** Titles of the tasks that are still open. */
export function openTitles(list: Task[]): string[] {
  return list.filter((task) => !task.done).map((task) => task.title);
}

console.log(openTitles(tasks));
`;

/** Monaco options of the Editor story, as the reference shows them: JSON you can edit. */
export const EDITOR_OPTIONS = `{
  "fontSize": 14,
  "minimap": { "enabled": true },
  "wordWrap": "off",
  "lineNumbers": "on",
  "renderWhitespace": "none",
  "readOnly": false
}`;

/** Options of the small JSON editor that holds the options. */
export const OPTIONS_EDITOR = {
  minimap: { enabled: false },
  lineNumbers: "off",
  folding: false,
  scrollBeyondLastLine: false,
} as const;

export const ORIGINAL = `# Release checklist

- Update the changelog
- Run the unit tests
- Tag the release
`;

export const MODIFIED = `# Release checklist

- Update the changelog and the migration notes
- Run the unit and end-to-end tests
- Build the packages
- Tag the release
`;

/** The files of the Multi-model story: one model per path. */
export const FILES = {
  "index.html": {
    language: "html",
    value: `<!doctype html>
<html lang="en">
  <head>
    <link rel="stylesheet" href="style.css">
  </head>
  <body>
    <h1>Hello</h1>
    <script src="script.js"></script>
  </body>
</html>
`,
  },
  "style.css": {
    language: "css",
    value: `h1 {
  color: #00a76f;
  font-family: system-ui, sans-serif;
}
`,
  },
  "script.js": {
    language: "javascript",
    value: `const title = document.querySelector("h1");
title.textContent = "Hello, Owlky";
`,
  },
} as const;
export type FileName = keyof typeof FILES;

/** Invalid JSON for the Validation story: the editor reports its markers. */
export const INVALID_JSON = `{
  "name": "owlky",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "build": "vite build",
  }
}
`;
