import { markdownOptions } from "@owlky/core";
import markdownApi from "@owlky/docs-content/api/markdown.json" with { type: "json" };
import { apiReferenceSection } from "@owlky/docs-content/guide/api-data";
import { Markdown } from "@owlky/react";
import { CDN, GuideDocs, type GuideSection, Preview } from "../../helpers/guide.js";
import { OptionsTable, PropsTable } from "../../helpers/guide-tables.js";

export const markdownSections: GuideSection[] = [
  {
    id: "overview",
    title: "Overview",
    body: "Markdown turns Markdown text into styled content: headings, paragraphs, links, lists, task lists, tables, code, images and quotes. It reads GitHub Flavored Markdown by default. Both versions run the same parser, built on unified, and build the content with DOM methods or React elements, never from an HTML string.\n\nMarkdown is a separate script so that pages without it don't download the parser. Load `owlky-markdown.js` after `owlky.js`, or import `@owlky/html/markdown` after `@owlky/html/auto`. In HTML, write the Markdown inside a `pre[data-ok-markdown-source]` element. Escape `&` and `<` as `&amp;` and `&lt;`, as for any text in HTML. Without JavaScript, the page shows the Markdown text itself.",
    html: `<!-- Load once per page: the styles, the runtime, then Markdown -->
<link rel="stylesheet" href="${CDN}/owlky.css">
<script src="${CDN}/owlky.js" defer></script>
<script src="${CDN}/owlky-markdown.js" defer></script>

<div data-ok-markdown>
<pre data-ok-markdown-source>## Release notes

- [x] Faster start-up
- [ ] Offline mode

Read the [changelog](https://example.com/changelog).</pre>
</div>`,
    react: `import { Markdown } from "@owlky/react";

const notes = \`## Release notes

- [x] Faster start-up
- [ ] Offline mode

Read the [changelog](https://example.com/changelog).\`;

export function Notes() {
  return <Markdown>{notes}</Markdown>;
}`,
  },
  {
    id: "html",
    title: "Render HTML in Markdown",
    body: "By default, HTML in the Markdown shows as text, so content from people can't add elements to your page. Turn on `rawHtml` to render it. The HTML then goes through an allow list, the same one GitHub uses, plus `u`, `mark` and the `text-align` and `text-transform` styles. Scripts, event handler attributes, forms, frames and unknown elements are removed. Turn on `skipHtml` to drop the HTML instead.\n\nTo allow more, pass your own `sanitizeSchema`. Extend `markdownSanitizeSchema` rather than writing one from scratch, because a missing rule can let unsafe markup through.",
    html: `<div data-ok-markdown data-ok-raw-html>
<pre data-ok-markdown-source>Press &lt;kbd&gt;Ctrl&lt;/kbd&gt; + &lt;kbd&gt;S&lt;/kbd&gt; to save.</pre>
</div>`,
    react: `import { Markdown } from "@owlky/react";

export function Shortcut() {
  return <Markdown rawHtml>{"Press <kbd>Ctrl</kbd> + <kbd>S</kbd> to save."}</Markdown>;
}`,
  },
  {
    id: "links",
    title: "Control links and URLs",
    body: 'Every URL in `href`, `src` and similar attributes goes through `urlTransform`. The default, `defaultUrlTransform`, keeps relative URLs and the `http`, `https`, `mailto`, `irc`, `ircs` and `xmpp` protocols, and empties anything else, such as `javascript:` or `data:` URLs. Pass your own function to rewrite URLs, for example to send images through a proxy. Keep the default checks in it, because an unchecked URL can run script when it is clicked.\n\nTurn on `externalLinks` to open absolute `http` and `https` links in a new tab. Links that open a new tab always get `rel="noopener noreferrer"`.',
    html: `<div data-ok-markdown data-ok-external-links>
<pre data-ok-markdown-source>See the [documentation](https://example.com/docs).</pre>
</div>`,
    react: `import { defaultUrlTransform, Markdown } from "@owlky/react";

// Load images through your own server, after the default checks
const proxy = (url: string, key: string) => {
  const safe = defaultUrlTransform(url);
  return key === "src" && safe ? \`/images?url=\${encodeURIComponent(safe)}\` : safe;
};

export function Post({ text }: { text: string }) {
  return (
    <Markdown externalLinks urlTransform={proxy}>
      {text}
    </Markdown>
  );
}`,
  },
  {
    id: "filter",
    title: "Allow only some elements",
    body: "Pass `allowedElements` to keep only those tag names, or `disallowedElements` to remove some. You can't use both. A removed element disappears with its content, unless `unwrapDisallowed` is on: then its content stays in place. In JavaScript, `allowElement(element, index, parent)` decides element by element after those lists.",
    html: `<!-- Only paragraphs, emphasis and links; other elements keep their text -->
<div data-ok-markdown data-ok-allowed-elements="p em strong a" data-ok-unwrap-disallowed>
<pre data-ok-markdown-source># Title

Some **bold** text.</pre>
</div>`,
    react: `import { Markdown } from "@owlky/react";

export function Comment({ text }: { text: string }) {
  return (
    <Markdown allowedElements={["p", "em", "strong", "a"]} unwrapDisallowed>
      {text}
    </Markdown>
  );
}`,
  },
  {
    id: "images",
    title: "Show pictures as Image",
    body: "Set `images` to `image` to render every picture as an Image component: it loads lazily, shows a placeholder until it arrives and appears with a short blur effect. Add `imageRatio`, such as `16/9`, to crop every picture to the same shape. By default, pictures are plain `img` elements that keep their own size. In HTML, the Image needs the script, which also renders the Markdown. In React, a `components.img` replacement takes precedence.",
    html: `<div data-ok-markdown data-ok-images="image" data-ok-images-ratio="16/9">
<pre data-ok-markdown-source>![A quiet beach at sunrise](beach.jpg)</pre>
</div>`,
    react: `import { Markdown } from "@owlky/react";

export function Article({ text }: { text: string }) {
  return (
    <Markdown images="image" imageRatio="16/9">
      {text}
    </Markdown>
  );
}`,
  },
  {
    id: "components",
    title: "Replace elements and add plugins",
    body: "In React, `components` replaces elements by tag name, with a component or another tag name. Each component receives the element's props and `node`, its syntax tree node. Both versions take remark plugins (`remarkPlugins`, for Markdown syntax) and rehype plugins (`rehypePlugins`, for the HTML tree), and `remarkRehypeOptions`. In HTML, pass them to `createMarkdown()` and register the result. Plugins run with the same rights as your code: use only plugins you trust.\n\n`Markdown` processes the text synchronously. For asynchronous plugins, use `MarkdownAsync` on a server or `MarkdownHooks` in the browser, which shows `fallback` while it works. In HTML, pass `async: true` to `createMarkdown()`.",
    html: `<script type="module">
  import { createMarkdown, getRuntime } from "@owlky/html";
  import remarkMath from "remark-math";

  // Register this definition instead of loading owlky-markdown.js
  getRuntime().register(createMarkdown({ remarkPlugins: [remarkMath] })).start();
</script>`,
    react: `import { Markdown } from "@owlky/react";

// Headings one level down, and links with your router's component
const components = {
  h1: "h2",
  a: ({ node, ...props }) => <a {...props} className="article-link" />,
} as const;

export function Article({ text }: { text: string }) {
  return <Markdown components={components}>{text}</Markdown>;
}`,
  },
  {
    id: "highlight",
    title: "Highlight code",
    body: "Fenced code with a language, such as ` ```js `, shows plain text unless you give Markdown a highlighter, because syntax grammars are large. Pass a lowlight instance, which uses the highlight.js grammars. Code without a language, or in a language the highlighter doesn't know, stays plain.",
    html: `<script type="module">
  import { createMarkdown, getRuntime } from "@owlky/html";
  import { common, createLowlight } from "lowlight";

  getRuntime().register(createMarkdown({ highlighter: createLowlight(common) })).start();
</script>`,
    react: `import { Markdown } from "@owlky/react";
import { common, createLowlight } from "lowlight";

// Create the highlighter once, outside the component
const highlighter = createLowlight(common);

export function Snippet({ text }: { text: string }) {
  return <Markdown highlighter={highlighter}>{text}</Markdown>;
}`,
  },
  {
    id: "options",
    title: "Options",
    body: "Every option works the same way in both versions: a prop in React, an attribute in HTML.",
  },
  {
    id: "props",
    title: "Content and behavior",
    body: "These props set the content and the pipeline. Lists are attributes in HTML; functions and plugins go to `createMarkdown()`.",
  },
  {
    id: "events",
    title: "Events and methods",
    body: `- **\`ok:markdown:render\`** fires on the root after every render, with the Markdown in \`detail.value\`.
- **\`ok:markdown:error\`** fires when the Markdown can't be rendered, for example with both \`allowedElements\` and \`disallowedElements\`, with \`detail.error\`. The Markdown text stays visible.
- **Instance:** \`runtime.get(element, "markdown")\` returns \`{ value, setValue(markdown), render() }\`. Changing the source element's text or an option attribute renders again by itself.
- **React:** the content follows \`children\`. \`MarkdownHooks\` reports failures through \`onError\`.`,
  },
  {
    id: "keyboard",
    title: "Keyboard",
    body: "Markdown adds no keys of its own. Links in the content are in the Tab order and open with Enter, like any link.",
  },
  {
    id: "accessibility",
    title: "Accessibility",
    body: `- Headings keep their level, so the content joins the page outline. Use \`components\` (React) or plugins to shift levels when the content sits under a page heading.
- Images need alternative text: write it between the brackets, as in \`![A chart of sales](chart.png)\`.
- Task list boxes are read-only checkboxes, announced as checked or not checked.
- Code blocks wrap long lines instead of scrolling, so they stay readable at 320 pixels wide without a keyboard trap.
- The footnotes' heading is visually hidden but read by screen readers.`,
  },
  apiReferenceSection(markdownApi),
];

const PREVIEWS = {
  overview: () => (
    <Preview>
      <Markdown>
        {
          "#### Release notes\n\n- [x] Faster start-up\n- [ ] Offline mode\n\nRead the [changelog](https://example.com/changelog)."
        }
      </Markdown>
    </Preview>
  ),
  html: () => (
    <Preview>
      <Markdown rawHtml>{"Press <kbd>Ctrl</kbd> + <kbd>S</kbd> to save."}</Markdown>
    </Preview>
  ),
  options: () => <OptionsTable schema={markdownOptions} />,
  props: () => (
    <PropsTable
      label="Markdown content props"
      rows={[
        {
          react: "children",
          html: "text of pre[data-ok-markdown-source]",
          type: "string",
          description: "The Markdown.",
        },
        {
          react: "allowedElements / disallowedElements",
          html: "data-ok-allowed-elements / data-ok-disallowed-elements",
          type: "string[] (HTML: space-separated)",
          description: "Tag names to keep, or to remove. Not both.",
        },
        {
          react: "allowElement",
          html: "createMarkdown({ allowElement })",
          type: "(element, index, parent) => boolean",
          description: "Decides element by element, after the lists.",
        },
        {
          react: "urlTransform",
          html: "createMarkdown({ urlTransform })",
          type: "(url, key, node) => string | null",
          description: "Rewrites URLs. Default `defaultUrlTransform` (safe protocols only).",
        },
        {
          react: "components",
          html: "—",
          type: "Record<tag, component | tag>",
          description: "Replaces elements; components receive `node`.",
        },
        {
          react: "remarkPlugins / rehypePlugins / remarkRehypeOptions",
          html: "createMarkdown({ … })",
          type: "PluggableList / Options",
          description: "unified plugins and remark-rehype options.",
        },
        {
          react: "sanitizeSchema",
          html: "createMarkdown({ sanitizeSchema })",
          type: "Schema",
          description: "The allow list for `rawHtml`. Default `markdownSanitizeSchema`.",
        },
        {
          react: "highlighter",
          html: "createMarkdown({ highlighter })",
          type: "MarkdownHighlighter",
          description: "Syntax highlighting of fenced code, for example lowlight.",
        },
        {
          react: "MarkdownHooks fallback / onError",
          html: "createMarkdown({ async: true })",
          type: "ReactNode / (error) => void",
          description: "Asynchronous plugins in the browser.",
        },
      ]}
    />
  ),
};

/** Markdown docs page (ADR-0019). */
export function MarkdownDocs() {
  return <GuideDocs sections={markdownSections} previews={PREVIEWS} />;
}
