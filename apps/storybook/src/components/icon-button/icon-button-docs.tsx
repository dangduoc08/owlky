import { iconButtonOptions } from "@owlky/core";
import iconButtonApi from "@owlky/docs-content/api/icon-button.json" with { type: "json" };
import { apiReferenceSection } from "@owlky/docs-content/guide/api-data";
import { IconButton } from "@owlky/react";
import { CDN, capitalize, GuideDocs, type GuideSection, Preview } from "../../helpers/guide.js";
import { KeyboardTable, OptionsTable, PropsTable } from "../../helpers/guide-tables.js";
import { SolarIcon, type SolarName, solarMarkup } from "../../helpers/solar-icons.js";

const COLORS = ["default", "primary", "secondary", "info", "success", "warning", "error"] as const;

const html = (attrs: string, label: string, icon: SolarName = "trash-bin-trash-linear") =>
  `<button type="button" data-ok-icon-button ${attrs} aria-label="${label}">\n  ${solarMarkup(icon)}\n</button>`;

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
import { Icon } from "@iconify/react/offline";
import trashBinTrashLinear from "@iconify-icons/solar/trash-bin-trash-linear";

export function DeleteAction() {
  return (
    <IconButton aria-label="Delete">
      <Icon icon={trashBinTrashLinear} aria-hidden="true" />
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
import { Icon } from "@iconify/react/offline";
import trashBinTrashLinear from "@iconify-icons/solar/trash-bin-trash-linear";

export function IconButtonColors() {
  return (
    <IconButton color="error" aria-label="Delete">
      <Icon icon={trashBinTrashLinear} aria-hidden="true" />
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
import { Icon } from "@iconify/react/offline";
import trashBinTrashLinear from "@iconify-icons/solar/trash-bin-trash-linear";

export function IconButtonSizes() {
  return (
    <IconButton size="sm" edge="end" aria-label="Delete">
      <Icon icon={trashBinTrashLinear} aria-hidden="true" />
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
  ${solarMarkup("letter-linear")}
</button>`,
    react: `import { IconButton } from "@owlky/react";
import { Icon } from "@iconify/react/offline";
import letterLinear from "@iconify-icons/solar/letter-linear";

export function IconButtonLoading() {
  return (
    <IconButton color="primary" loading aria-label="Send">
      <Icon icon={letterLinear} aria-hidden="true" />
    </IconButton>
  );
}`,
  },
  {
    id: "animate",
    title: "Add a press animation",
    body: "Set `animate` to scale the button slightly when it's pressed. The animation is plain CSS and turns off when the user prefers reduced motion.",
    html: html('data-ok-color="primary" data-ok-size="md" data-ok-animate', "Add", "add-linear"),
    react: `import { IconButton } from "@owlky/react";
import { Icon } from "@iconify/react/offline";
import addLinear from "@iconify-icons/solar/add-linear";

export function IconButtonAnimate() {
  return (
    <IconButton color="primary" animate aria-label="Add">
      <Icon icon={addLinear} aria-hidden="true" />
    </IconButton>
  );
}`,
  },
  {
    id: "link",
    title: "Use an icon button as a link",
    body: "When an icon button navigates, render it as a link. In React, pass `href`; in HTML, use an `<a>` element with the same attributes. A disabled link loses its `href` and gets `aria-disabled`, so it can't be followed. To navigate with a routing library, pass your router's link component in `component` (with the props it needs, such as `to`) or in `LinkComponent` (with `href`). A disabled router link keeps its URL, leaves the tab order and ignores pointer clicks.",
    html: `<a href="/messages" data-ok-icon-button data-ok-color="default" data-ok-size="md" aria-label="Messages">
  ${solarMarkup("letter-linear")}
</a>`,
    react: `import { IconButton } from "@owlky/react";
import { Icon } from "@iconify/react/offline";
import letterLinear from "@iconify-icons/solar/letter-linear";

export function MessagesLink() {
  return (
    <IconButton href="/messages" aria-label="Messages">
      <Icon icon={letterLinear} aria-hidden="true" />
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
    body: "Icon buttons and icon links are native elements, so the browser provides the keyboard behavior.",
  },
  {
    id: "accessibility",
    title: "Accessibility",
    body: `- An icon button has no visible label, so it **must** have a name: set \`aria-label\`, or \`aria-labelledby\` to point to visible text. Describe the action ("Delete"), not the icon ("Trash can").
- The icon is decorative and hidden from assistive technology.
- While loading, the button is disabled and marked busy (\`aria-busy="true"\`).
- Every size is at least 24 × 24px, and focus is shown with a 2px outline.`,
  },
  apiReferenceSection(iconButtonApi),
];

const PREVIEWS = {
  overview: () => (
    <Preview>
      {(
        [
          ["Mail", "letter-linear"],
          ["Add", "add-linear"],
          ["Delete", "trash-bin-trash-linear"],
        ] as const
      ).map(([label, icon]) => (
        <IconButton key={icon} aria-label={label}>
          <SolarIcon name={icon} />
        </IconButton>
      ))}
    </Preview>
  ),
  colors: () => (
    <Preview>
      {COLORS.map((color) => (
        <IconButton key={color} color={color} aria-label={`${capitalize(color)} delete`}>
          <SolarIcon name="trash-bin-trash-linear" />
        </IconButton>
      ))}
    </Preview>
  ),
  sizes: () => (
    <Preview>
      {(["sm", "md", "lg"] as const).map((size) => (
        <IconButton key={size} size={size} aria-label={`Delete, ${size}`}>
          <SolarIcon name="trash-bin-trash-linear" />
        </IconButton>
      ))}
    </Preview>
  ),
  loading: () => (
    <Preview>
      <IconButton color="primary" loading aria-label="Send">
        <SolarIcon name="letter-linear" />
      </IconButton>
    </Preview>
  ),
  animate: () => (
    <Preview>
      <IconButton color="primary" animate aria-label="Add">
        <SolarIcon name="add-linear" />
      </IconButton>
    </Preview>
  ),
  link: () => (
    <Preview>
      <IconButton href="#docs-messages" aria-label="Messages">
        <SolarIcon name="letter-linear" />
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
          react: "href",
          html: "<a href>",
          type: "string",
          description:
            "Renders an icon link. A disabled or loading link loses its href and gets aria-disabled.",
        },
        {
          react: "component",
          html: "<a>",
          type: "ElementType",
          description:
            "The element or component to render, such as a router link. It gets the button's attributes and its ref.",
        },
        {
          react: "LinkComponent",
          html: "<a>",
          type: "ElementType",
          description: "The component that renders the link when href is set. Default a.",
        },
        {
          react: "ref",
          type: "HTMLButtonElement | HTMLAnchorElement",
          description: "Forwarded to the button or link. Every native attribute is passed through.",
        },
      ]}
    />
  ),
  keyboard: () => (
    <KeyboardTable
      rows={[
        ["Tab", "Moves focus to the button. Disabled and loading buttons are skipped."],
        ["Enter / Space", "Activates the button."],
        ["Enter", "Follows an icon link."],
      ]}
    />
  ),
};

/** Icon button docs page (ADR-0019). */
export function IconButtonDocs() {
  return <GuideDocs sections={iconButtonSections} previews={PREVIEWS} />;
}
