import { avatarGroupOptions, avatarOptions } from "@owlky/core";
import avatarApi from "@owlky/docs-content/api/avatar.json" with { type: "json" };
import { apiReferenceSection } from "@owlky/docs-content/guide/api-data";
import { Avatar, AvatarGroup } from "@owlky/react";
import { CDN, GuideDocs, type GuideSection, Preview } from "../../helpers/guide.js";
import { OptionsTable, PropsTable } from "../../helpers/guide-tables.js";
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
  <img src="/people/jayvion.jpg" alt="Jayvion Simon">
</span>`,
    react: `// Load once, in your app's entry file
import "@owlky/styles/owlky.css";
import { Avatar } from "@owlky/react";

export function Author() {
  return <Avatar src="/people/jayvion.jpg" alt="Jayvion Simon" />;
}`,
  },
  {
    id: "letters",
    title: "Show initials or an icon",
    body: 'Without a picture, put initials or an icon inside. Set `color` to tint the background: `default` is grey, the palette colors use white or dark text. Initials scale with the avatar. When the avatar is the only place that names a person, give it `role="img"` and an `aria-label`.',
    html: `<span data-ok-avatar data-ok-variant="circular" data-ok-color="primary" role="img" aria-label="Deja Brady">DB</span>`,
    react: `<Avatar color="primary" role="img" aria-label="Deja Brady">DB</Avatar>`,
  },
  {
    id: "size",
    title: "Change the shape and size",
    body: "Set `variant` to `rounded` (12px corners) or `square`. The default size is 40px. Set `size` to a number of pixels, or to a length in `px`, `rem` or `em`. In HTML, the script turns `data-ok-size` into the avatar's size.",
    html: `<span data-ok-avatar data-ok-variant="rounded" data-ok-color="default" data-ok-size="56">…</span>`,
    react: `<Avatar variant="rounded" size={56} src="/people/lucian.jpg" alt="Lucian Obrien" />`,
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
    react: `<AvatarGroup max={3} total={7}>
  <Avatar color="secondary">D</Avatar>
  <Avatar color="error">H</Avatar>
  <Avatar color="info">R</Avatar>
</AvatarGroup>`,
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
- Grey avatars use dark grey initials, with a contrast ratio of at least 4.5:1. Palette colors follow the design.`,
  },
  apiReferenceSection(avatarApi),
];

const PREVIEWS = {
  overview: () => (
    <Preview>
      <Avatar src={portrait(1)} alt={PEOPLE[0]} />
    </Preview>
  ),
  letters: () => (
    <Preview>
      <Avatar color="primary" role="img" aria-label="Deja Brady">
        DB
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
