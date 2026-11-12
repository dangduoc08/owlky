import { avatarGroupOptions, avatarOptions } from "@owlky/core";
import avatarApi from "@owlky/docs-content/api/avatar.json" with { type: "json" };
import { apiReferenceSection } from "@owlky/docs-content/guide/api-data";
import { Avatar, AvatarGroup } from "@owlky/react";
import { CDN, GuideDocs, type GuideSection, Preview } from "../../helpers/guide.js";
import { OptionsTable, PropsTable } from "../../helpers/guide-tables.js";
import { ColorPreviewDemo } from "./color-preview-demo.js";
import { PEOPLE, portrait } from "./display-icons.js";

export const avatarSections: GuideSection[] = [
  {
    id: "overview",
    title: "Overview",
    body: "An avatar shows a person or an entity: a picture, initials or an icon in a circle. If the picture fails to load, the avatar shows its children, the first letter of `alt`, or a person icon, so it never stays empty.",
    html: `<!-- Load once per page -->
<link rel="stylesheet" href="${CDN}/owlky.css">
<script src="${CDN}/owlky.js" defer></script>

<span data-ok-avatar data-ok-variant="circular" data-ok-color="default">
  <img src="/people/amara.jpg" alt="Amara Okafor">
</span>`,
    react: `// Load once, in your app's entry file
import "@owlky/styles/owlky.css";
import { Avatar } from "@owlky/react";

export function Author() {
  return <Avatar src="/people/amara.jpg" alt="Amara Okafor" />;
}`,
  },
  {
    id: "letters",
    title: "Show initials or an icon",
    body: 'Without a picture, put initials or an icon inside. Set `color` to tint the background: `default` is grey, the palette colors use white or dark text. Initials scale with the avatar. When the avatar is the only place that names a person, give it `role="img"` and an `aria-label`.',
    html: `<span data-ok-avatar data-ok-variant="circular" data-ok-color="primary" role="img" aria-label="Linh Tran">LT</span>`,
    react: `import { Avatar } from "@owlky/react";

export function DejaAvatar() {
  return (
    <Avatar color="primary" role="img" aria-label="Linh Tran">
      LT
    </Avatar>
  );
}`,
  },
  {
    id: "size",
    title: "Change the shape and size",
    body: "Set `variant` to `rounded` (12px corners) or `square`. The default size is 40px. Set `size` to a number of pixels, or to a length in `px`, `rem` or `em`. In HTML, the script turns `data-ok-size` into the avatar's size.",
    html: `<span data-ok-avatar data-ok-variant="rounded" data-ok-color="default" data-ok-size="56">
  <img src="/people/mateo.jpg" alt="Mateo Silva">
</span>`,
    react: `import { Avatar } from "@owlky/react";

export function LargeAvatar() {
  return <Avatar variant="rounded" size={56} src="/people/mateo.jpg" alt="Mateo Silva" />;
}`,
  },
  {
    id: "group",
    title: "Group avatars",
    body: 'An avatar group overlaps its avatars and rings each one with the surface color. In React, set `max` (default 5): extra avatars collapse into a "+N" avatar, counted from `total` when you have more people than you render. In HTML, write the visible avatars and the surplus avatar with `data-ok-avatar-surplus`. Set `spacing` to `small` for a tighter overlap.',
    html: `<div data-ok-avatar-group data-ok-spacing="medium">
  <span data-ok-avatar data-ok-variant="circular" data-ok-color="secondary">D</span>
  <span data-ok-avatar data-ok-variant="circular" data-ok-color="error">H</span>
  <span data-ok-avatar data-ok-variant="circular" data-ok-color="default" data-ok-avatar-surplus>+5</span>
</div>`,
    react: `import { Avatar, AvatarGroup } from "@owlky/react";

export function Team() {
  return (
    <AvatarGroup max={3} total={7}>
      <Avatar color="secondary">D</Avatar>
      <Avatar color="error">H</Avatar>
      <Avatar color="info">R</Avatar>
    </AvatarGroup>
  );
}`,
  },
  {
    id: "spacing",
    title: "Change the overlap",
    body: "`spacing` sets how much each avatar covers the one before it. Use `medium` (8px, the default), `small` (16px, a tighter group), or a number of pixels for any other overlap, such as `24`. `0` lines the avatars up without overlap. In HTML, write the same value in `data-ok-spacing`: the script turns a number into the overlap.",
    html: `<div data-ok-avatar-group data-ok-spacing="24">
  <span data-ok-avatar data-ok-variant="circular" data-ok-color="secondary">D</span>
  <span data-ok-avatar data-ok-variant="circular" data-ok-color="error">H</span>
  <span data-ok-avatar data-ok-variant="circular" data-ok-color="info">R</span>
</div>`,
    react: `import { Avatar, AvatarGroup } from "@owlky/react";

export function TightTeam() {
  return (
    <AvatarGroup spacing={24}>
      <Avatar color="secondary">D</Avatar>
      <Avatar color="error">H</Avatar>
      <Avatar color="info">R</Avatar>
    </AvatarGroup>
  );
}`,
  },
  {
    id: "color-preview",
    title: "Preview colors",
    body: `Set \`swatch\` to a color to turn an avatar into a color dot, such as the colors a product comes in. Put the dots in an avatar group: they overlap like avatars, and the surplus becomes plain text such as "+13".

- **Colors:** use a CSS color or a \`var(--ok-…)\` token. Values that aren't colors are ignored, and the dot stays grey.
- **Size and overlap:** set \`size\` on the dots, such as \`16\`, and \`spacing\` on the group, such as \`6\`. In React, \`max\` counts the surplus too: \`max={4}\` shows three dots and the surplus.
- **Name:** the dots are empty, so give the group \`role="img"\` and an \`aria-label\` that lists the colors.

In HTML, \`data-ok-swatch\` holds the color, and the script paints it.`,
    html: `<div data-ok-avatar-group data-ok-spacing="6" role="img" aria-label="5 colors: Orange, Deep purple, Light green and 2 more">
  <span data-ok-avatar data-ok-variant="circular" data-ok-color="default" data-ok-size="16" data-ok-swatch="#FF9800"></span>
  <span data-ok-avatar data-ok-variant="circular" data-ok-color="default" data-ok-size="16" data-ok-swatch="#673AB7"></span>
  <span data-ok-avatar data-ok-variant="circular" data-ok-color="default" data-ok-size="16" data-ok-swatch="#8BC34A"></span>
  <span data-ok-avatar data-ok-variant="circular" data-ok-color="default" data-ok-size="16" data-ok-avatar-surplus>+2</span>
</div>`,
    react: `import { Avatar, AvatarGroup } from "@owlky/react";

const COLORS = ["#FF9800", "#673AB7", "#8BC34A", "#009688", "#3F51B5"];

export function ProductColors() {
  return (
    <AvatarGroup max={4} spacing={6} role="img" aria-label="5 colors: Orange, Deep purple, Light green and 2 more">
      {COLORS.map((color) => (
        <Avatar key={color} swatch={color} size={16} />
      ))}
    </AvatarGroup>
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
    id: "events",
    title: "Events and methods",
    body: "Avatars have no events or methods. In HTML, the script listens for image errors and shows the fallback letter. To show a status or a count on an avatar, wrap it in a **Badge**.",
  },
  {
    id: "keyboard",
    title: "Keyboard",
    body: "Avatars don't take focus. Put an avatar inside a link or a button when it should do something.",
  },
  {
    id: "accessibility",
    title: "Accessibility",
    body: `- Picture avatars are named by the image's \`alt\`. Use \`alt=""\` when a name is already next to the avatar.
- Initials and icons are decorative by default. Give the avatar \`role="img"\` and \`aria-label\` when it's the only place that says who it is.
- Color dots are empty: name their group with \`role="img"\` and an \`aria-label\` that lists the colors. Dots keep their color in forced colors mode.
- Grey avatars use dark grey initials, with a contrast ratio of at least 4.5:1. Palette colors follow the design.`,
  },
  apiReferenceSection(avatarApi),
];

const PREVIEWS = {
  "color-preview": () => (
    <Preview>
      <ColorPreviewDemo />
    </Preview>
  ),
  overview: () => (
    <Preview>
      <Avatar src={portrait(1)} alt={PEOPLE[0]} />
    </Preview>
  ),
  letters: () => (
    <Preview>
      <Avatar color="primary" role="img" aria-label="Linh Tran">
        LT
      </Avatar>
      <Avatar>RC</Avatar>
    </Preview>
  ),
  size: () => (
    <Preview>
      <Avatar variant="rounded" size={56} src={portrait(2)} alt={PEOPLE[1]} />
      <Avatar size="3rem" src={portrait(3)} alt={PEOPLE[2]} />
    </Preview>
  ),
  group: () => (
    <Preview>
      <AvatarGroup max={3} total={7}>
        <Avatar color="secondary">D</Avatar>
        <Avatar color="error">H</Avatar>
        <Avatar color="info">R</Avatar>
      </AvatarGroup>
    </Preview>
  ),
  spacing: () => (
    <Preview>
      {(["medium", "small", 24] as const).map((spacing) => (
        <AvatarGroup key={spacing} spacing={spacing}>
          <Avatar color="secondary">D</Avatar>
          <Avatar color="error">H</Avatar>
          <Avatar color="info">R</Avatar>
        </AvatarGroup>
      ))}
    </Preview>
  ),
  options: () => (
    <>
      <OptionsTable schema={avatarOptions} />
      <OptionsTable schema={avatarGroupOptions} />
    </>
  ),
  props: () => (
    <PropsTable
      label="Avatar content props"
      rows={[
        {
          react: "src / srcSet / sizes / alt",
          html: "img",
          type: "string",
          description: "The picture. `alt` also gives the fallback letter.",
        },
        {
          react: "children",
          html: "text or svg",
          type: "ReactNode",
          description: "Initials or an icon, shown without a picture.",
        },
        {
          react: "swatch",
          html: "data-ok-swatch",
          type: "string",
          description: "A color dot: a CSS color or a `var(--ok-…)` token. The avatar stays empty.",
        },
        {
          react: "imgProps",
          html: "on the img",
          type: "object",
          description: "Other attributes of the image, such as `loading`.",
        },
        {
          react: "max / total (AvatarGroup)",
          html: "data-ok-avatar-surplus",
          type: "number",
          description: 'How many avatars show, and the count behind the "+N".',
        },
        {
          react: "renderSurplus (AvatarGroup)",
          type: "(n) => ReactNode",
          description: "Content of the surplus avatar.",
        },
        { react: "ref", type: "HTMLSpanElement", description: "The avatar element." },
      ]}
    />
  ),
};

/** Avatar docs page (ADR-0019). */
export function AvatarDocs() {
  return <GuideDocs sections={avatarSections} previews={PREVIEWS} />;
}
