import { backdropOptions } from "@owlky/core";
import backdropApi from "@owlky/docs-content/api/backdrop.json" with { type: "json" };
import { apiReferenceSection } from "@owlky/docs-content/guide/api-data";
import { CDN, GuideDocs, type GuideSection, Preview } from "../../helpers/guide.js";
import { OptionsTable, PropsTable } from "../../helpers/guide-tables.js";
import { ExampleBackdropDemo } from "./backdrop-demos.js";

export const backdropSections: GuideSection[] = [
  {
    id: "overview",
    title: "Overview",
    body: "A backdrop dims the whole page and shows its content in front of it, centered. Use it for a loader while your app saves or loads data. The content is white, so a `CircularProgress` with `color` set to `inherit` matches it. In the example, a click anywhere on the backdrop hides it.",
    html: `<!-- Load once per page: the styles and the runtime -->
<link rel="stylesheet" href="${CDN}/owlky.css">
<script src="${CDN}/owlky.js" defer></script>

<button type="button" data-ok-button data-ok-variant="text" data-ok-color="inherit" data-ok-size="md"
  data-ok-backdrop-open="loader">
  <span data-ok-button-label>Show backdrop</span>
</button>
<!-- data-ok-backdrop-close on the backdrop itself: a click anywhere on it hides it -->
<div id="loader" data-ok-backdrop data-ok-backdrop-close>
  <span role="progressbar" aria-label="Loading" data-ok-circular-progress data-ok-variant="indeterminate" data-ok-color="inherit">
    <svg data-ok-circular-progress-svg aria-hidden="true" viewBox="22 22 44 44"><circle data-ok-circular-progress-circle cx="44" cy="44" r="20.2" stroke-width="3.6" /></svg>
  </span>
</div>`,
    react: `import { Backdrop, Button, CircularProgress } from "@owlky/react";
import { useState } from "react";

export function Loader() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Show backdrop</Button>
      <Backdrop open={open} onClick={() => setOpen(false)}>
        <CircularProgress color="inherit" aria-label="Loading" />
      </Backdrop>
    </>
  );
}`,
  },
  {
    id: "loading",
    title: "Show a backdrop while work runs",
    body: "Open the backdrop when the work starts and close it when the work ends, whether it succeeds or fails. People can't dismiss a backdrop with the keyboard, so never leave it open after the work is done. In HTML, call `open()` and `close()` on the instance. In React, derive `open` from your loading state.",
    html: `<div id="saving" data-ok-backdrop>
  <span role="progressbar" data-ok-circular-progress data-ok-variant="indeterminate" data-ok-color="inherit" aria-label="Saving">
    <svg data-ok-circular-progress-svg aria-hidden="true" viewBox="22 22 44 44"><circle data-ok-circular-progress-circle cx="44" cy="44" r="20.2" stroke-width="3.6" /></svg>
  </span>
</div>

<script type="module">
  const backdrop = window.Owlky.get(document.getElementById("saving"), "backdrop");
  backdrop.open();
  try {
    // Your own work, such as saving a form.
    await fetch("/api/drafts", { method: "POST", body: new FormData(document.forms[0]) });
  } finally {
    // Close it on success and on failure.
    backdrop.close();
  }
</script>`,
    react: `import { Backdrop, CircularProgress } from "@owlky/react";

export function SavingOverlay({ saving }: { saving: boolean }) {
  return (
    <Backdrop open={saving}>
      <CircularProgress color="inherit" aria-label="Saving" />
    </Backdrop>
  );
}`,
  },
  {
    id: "invisible",
    title: "Block clicks without dimming",
    body: "Set `invisible` to make the backdrop transparent. It still covers the page and catches clicks, so a click outside a custom menu or panel can close it without the page behind reacting.",
    html: `<div id="catcher" data-ok-backdrop data-ok-invisible data-ok-backdrop-close></div>`,
    react: `import { Backdrop, Button } from "@owlky/react";
import { useState } from "react";

export function ClickShield() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Block clicks</Button>
      <Backdrop open={open} invisible onClick={() => setOpen(false)} />
    </>
  );
}`,
  },
  {
    id: "transitions",
    title: "Fade in and out",
    body: "The backdrop fades in over 250 ms and fades out over 200 ms. Set `transitionDuration` to use one length, in milliseconds, for both fades. When people turn on reduced motion in their system settings, it appears and disappears at once. A closed backdrop stays in the page, hidden, so its fade-out can play. Hidden backdrops don't catch clicks and screen readers skip them.",
    html: `<button type="button" data-ok-button data-ok-variant="outlined" data-ok-color="inherit" data-ok-size="md" data-ok-backdrop-open="slow">
  <span data-ok-button-label>Show</span>
</button>
<div id="slow" data-ok-backdrop data-ok-transition-duration="600" data-ok-backdrop-close></div>`,
    react: `import { Backdrop, Button } from "@owlky/react";
import { useState } from "react";

export function SlowBackdrop() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outlined" onClick={() => setOpen(true)}>
        Show
      </Button>
      <Backdrop open={open} transitionDuration={600} onClick={() => setOpen(false)} />
    </>
  );
}`,
  },
  {
    id: "dialog",
    title: "Choose between a backdrop and a dialog",
    body: "A backdrop doesn't take focus. The page behind it stays reachable with the keyboard, and Escape doesn't close it. Use a backdrop for short waits that end on their own. To ask for a decision, or for anything people must dismiss themselves, use a **Dialog**: it moves focus into itself, keeps the page behind it inert and closes with Escape. Dialogs and drawers have their own backdrop with the same color, so you don't add one.",
  },
  {
    id: "options",
    title: "Options",
    body: "Every option works the same way in both versions: a prop in React, an attribute in HTML. Values that aren't listed fall back to the default.",
  },
  {
    id: "props",
    title: "Content and behavior",
    body: "These props set the content and the state. They aren't options, because HTML writes them as markup or triggers.",
  },
  {
    id: "events",
    title: "Events and methods",
    body: `- **\`ok:backdrop:beforeopen\`** (cancelable) and **\`ok:backdrop:open\`** fire on the backdrop, with the trigger in \`detail.trigger\`.
- **\`ok:backdrop:beforeclose\`** (cancelable) and **\`ok:backdrop:close\`** carry \`detail.reason\`: \`trigger\` or \`api\`.
- **Instance:** \`runtime.get(element, "backdrop")\` returns \`{ isOpen, open(trigger?), close(reason?) }\`.
- **React:** the backdrop reports nothing itself. Set \`open\` from your own state, and pass \`onClick\` to close it on a click.`,
  },
  {
    id: "keyboard",
    title: "Keyboard",
    body: "The backdrop has no keyboard interaction. Focus stays where it was, usually on the button that opened it.",
  },
  {
    id: "accessibility",
    title: "Accessibility",
    body: `- Give the content its own name, such as \`aria-label="Loading"\` on a \`CircularProgress\`, so screen readers announce what is happening.
- Put text on a paper inside the backdrop, not on the backdrop itself. White text directly on the light theme's backdrop has a contrast ratio of about 3:1, below the 4.5:1 that text needs.
- Close the backdrop when the work ends. Keyboard users can't dismiss it themselves.`,
  },
  apiReferenceSection(backdropApi),
];

const PREVIEWS = {
  overview: () => (
    <Preview>
      <ExampleBackdropDemo id="docs-backdrop" />
    </Preview>
  ),
  options: () => <OptionsTable schema={backdropOptions} />,
  props: () => (
    <PropsTable
      label="Backdrop content props"
      rows={[
        {
          react: "open",
          html: "data-ok-open / data-ok-backdrop-open / data-ok-backdrop-close",
          type: "boolean",
          description: "Shows the backdrop. Required in React.",
        },
        {
          react: "children",
          html: "content of data-ok-backdrop",
          type: "ReactNode",
          description: "Content shown in front of the page, centered.",
        },
        {
          react: "onClick",
          html: "data-ok-backdrop-close",
          type: "(event) => void",
          description: "A click on the backdrop. Close it from here.",
        },
      ]}
    />
  ),
};

/** Backdrop docs page (ADR-0019). */
export function BackdropDocs() {
  return <GuideDocs sections={backdropSections} previews={PREVIEWS} />;
}
