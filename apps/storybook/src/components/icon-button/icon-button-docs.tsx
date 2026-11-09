import { iconButtonOptions } from "@owlky/core";
import { IconButton } from "@owlky/react";
import { DocsIcon, type DocsIconName, iconMarkup } from "../../helpers/docs-icons.js";
import { CDN, capitalize, GuideDocs, type GuideSection, Preview } from "../../helpers/guide.js";
import { KeyboardTable, OptionsTable, PropsTable } from "../../helpers/guide-tables.js";

const COLORS = ["default", "primary", "secondary", "info", "success", "warning", "error"] as const;

const html = (attrs: string, label: string, icon: DocsIconName = "trash") =>
  `<button type="button" data-ok-icon-button ${attrs} aria-label="${label}">\n  ${iconMarkup(icon)}\n</button>`;

export const iconButtonSections: GuideSection[] = [
  {
    id: "overview",
    title: "Overview",
    body: "An icon button is an action shown as an icon only, such as in a toolbar, a table row or a card. Because there is no visible label, use it for actions people recognize from the icon alone, and always give it a name. For actions that need words, use a **Button**.",
    html: `<!-- Load once per page -->
<link rel="stylesheet" href="${CDN}/owlky.css">

${html('data-ok-color="default" data-ok-size="md"', "Delete")}`,
    react: `// Load once, in your app's entry file
import "@owlky/styles/owlky.css";
import { IconButton } from "@owlky/react";
import { TrashIcon } from "lucide-react";

export function DeleteAction() {
  return (
    <IconButton aria-label="Delete">
      <TrashIcon />
    </IconButton>
  );
}`,
  },
  {
    id: "colors",
    title: "Pick a color",
    body: "The default color is a soft grey that suits most toolbars. Use `inherit` to take the surrounding text color, or a palette color to give the action meaning, such as `error` for a destructive one.",
    html: html('data-ok-color="error" data-ok-size="md"', "Delete"),
    react: `import { IconButton } from "@owlky/react";
import { TrashIcon } from "lucide-react";

export function IconButtonColors() {
  return (
    <IconButton color="error" aria-label="Delete">
      <TrashIcon />
    </IconButton>
  );
}`,
  },
  {
    id: "sizes",
    title: "Set the size",
    body: "Three sizes are available: `sm`, `md` (the default) and `lg`. Every size keeps a touch target of at least 24 × 24px. Inside a row of content, set `edge` to `start` or `end` so the icon lines up with the content edge instead of the button's padding.",
    html: html('data-ok-color="default" data-ok-size="sm" data-ok-edge="end"', "Delete"),
    react: `import { IconButton } from "@owlky/react";
import { TrashIcon } from "lucide-react";

export function IconButtonSizes() {
  return (
    <IconButton size="sm" edge="end" aria-label="Delete">
      <TrashIcon />
    </IconButton>
  );
}`,
  },
  {
    id: "loading",
    title: "Show that an action is in progress",
    body: "Set `loading` while the action runs. The icon is replaced by a spinner, the button is disabled and it tells assistive technology that it's busy.",
    html: `<button type="button" data-ok-icon-button data-ok-color="primary" data-ok-size="md" data-ok-loading aria-busy="true" disabled aria-label="Send">
  <span data-ok-icon-button-loader aria-hidden="true"><span role="progressbar" data-ok-circular-progress data-ok-variant="indeterminate" data-ok-color="inherit" data-ok-button-spinner><svg data-ok-circular-progress-svg aria-hidden="true" viewBox="22 22 44 44"><circle data-ok-circular-progress-circle cx="44" cy="44" r="20.2" stroke-width="3.6" /></svg></span></span>
  ${iconMarkup("mail")}
</button>`,
    react: `import { IconButton } from "@owlky/react";
import { MailIcon } from "lucide-react";

export function IconButtonLoading() {
  return (
    <IconButton color="primary" loading aria-label="Send">
      <MailIcon />
    </IconButton>
  );
}`,
  },
  {
    id: "animate",
    title: "Add a press animation",
    body: "Set `animate` to scale the button slightly when it's pressed. The animation is plain CSS and turns off when the user prefers reduced motion.",
    html: html('data-ok-color="primary" data-ok-size="md" data-ok-animate', "Add", "plus"),
    react: `import { IconButton } from "@owlky/react";
import { PlusIcon } from "lucide-react";

export function IconButtonAnimate() {
  return (
    <IconButton color="primary" animate aria-label="Add">
      <PlusIcon />
    </IconButton>
  );
}`,
  },
  {
    id: "options",
    title: "Options",
    body: "Every option works the same way in both versions: a prop in React, an attribute in HTML. Values that aren't listed fall back to the default.",
  },
  {
    id: "props",
    title: "Content and behavior",
    body: "These props set the content and behavior. They aren't options, because HTML writes them as markup.",
  },
  {
    id: "keyboard",
    title: "Keyboard",
    body: "Icon buttons are native buttons, so the browser provides the keyboard behavior.",
  },
  {
    id: "accessibility",
    title: "Accessibility",
    body: `- An icon button has no visible label, so it **must** have a name: set \`aria-label\`, or \`aria-labelledby\` to point to visible text. Describe the action ("Delete"), not the icon ("Trash can").
- The icon is decorative and hidden from assistive technology.
- While loading, the button is disabled and marked busy (\`aria-busy="true"\`).
- Every size is at least 24 × 24px, and focus is shown with a 2px outline.`,
  },
];

const PREVIEWS = {
  overview: () => (
    <Preview>
      {(["mail", "plus", "trash"] as const).map((icon) => (
        <IconButton key={icon} aria-label={capitalize(icon)}>
          <DocsIcon name={icon} />
        </IconButton>
      ))}
    </Preview>
  ),
  colors: () => (
    <Preview>
      {COLORS.map((color) => (
        <IconButton key={color} color={color} aria-label={`${capitalize(color)} delete`}>
          <DocsIcon name="trash" />
        </IconButton>
      ))}
    </Preview>
  ),
  sizes: () => (
    <Preview>
      {(["sm", "md", "lg"] as const).map((size) => (
        <IconButton key={size} size={size} aria-label={`Delete, ${size}`}>
          <DocsIcon name="trash" />
        </IconButton>
      ))}
    </Preview>
  ),
  loading: () => (
    <Preview>
      <IconButton color="primary" loading aria-label="Send">
        <DocsIcon name="mail" />
      </IconButton>
    </Preview>
  ),
  animate: () => (
    <Preview>
      <IconButton color="primary" animate aria-label="Add">
        <DocsIcon name="plus" />
      </IconButton>
    </Preview>
  ),
  options: () => <OptionsTable schema={iconButtonOptions} />,
  props: () => (
    <PropsTable
      label="Icon button content props"
      rows={[
        {
          react: "children",
          html: "<svg> inside the button",
          type: "ReactNode",
          description: "The icon. Mark it `aria-hidden`.",
        },
        {
          react: "aria-label",
          html: "aria-label",
          type: "string",
          description: "The button's name. Required unless `aria-labelledby` is set.",
        },
        {
          react: "loadingIndicator",
          html: "data-ok-icon-button-loader",
          type: "ReactNode",
          description: "Replaces the spinner while loading.",
        },
        {
          react: "ref",
          type: "HTMLButtonElement",
          description: "Forwarded to the button. Every native button attribute is passed through.",
        },
      ]}
    />
  ),
  keyboard: () => (
    <KeyboardTable
      rows={[
        ["Tab", "Moves focus to the button. Disabled and loading buttons are skipped."],
        ["Enter / Space", "Activates the button."],
      ]}
    />
  ),
};

/** Icon button docs page (ADR-0019). */
export function IconButtonDocs() {
  return <GuideDocs sections={iconButtonSections} previews={PREVIEWS} />;
}
