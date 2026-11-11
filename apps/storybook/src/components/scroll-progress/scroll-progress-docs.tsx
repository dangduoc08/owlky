import { scrollProgressOptions } from "@owlky/core";
import scrollProgressApi from "@owlky/docs-content/api/scroll-progress.json" with { type: "json" };
import { apiReferenceSection } from "@owlky/docs-content/guide/api-data";
import { CircularProgress, LinearProgress, Scrollbar, Typography } from "@owlky/react";
import { CDN, GuideDocs, type GuideSection, Preview } from "../../helpers/guide.js";
import { OptionsTable, PropsTable } from "../../helpers/guide-tables.js";

const CHAPTERS = [
  "Getting started",
  "Install the packages",
  "Load the styles",
  "Add your first component",
  "Switch themes",
  "Change the colors",
  "Pick a font",
  "Build a layout",
  "Read the API reference",
  "Ship your app",
];

const htmlChapters = CHAPTERS.map(
  (chapter) => `    <p data-ok-typography data-ok-variant="body2">${chapter}</p>`,
).join("\n");

const reactChapters = `const chapters = [
${CHAPTERS.map((chapter) => `  "${chapter}",`).join("\n")}
];`;

export const scrollProgressSections: GuideSection[] = [
  {
    id: "overview",
    title: "Overview",
    body: "A scroll progress shows how far a scroll area or the page has been scrolled. It is a **Linear progress** or a **Circular progress** that follows a scroll position instead of a value. Give the progress the `id` of the scroll area to follow, and keep the determinate variant. In browsers with scroll-driven animations, such as Chrome and Safari 26, the browser moves the indicator itself while it scrolls; elsewhere a small script does it.",
    html: `<!-- Load once per page -->
<link rel="stylesheet" href="${CDN}/owlky.css">
<script src="${CDN}/owlky.js" defer></script>

<span role="progressbar" aria-hidden="true" data-ok-linear-progress data-ok-variant="determinate" data-ok-color="info" data-ok-scroll-progress data-ok-scroll-container="chapters">
  <span data-ok-linear-progress-bar="1"></span>
</span>
<section data-ok-scrollbar id="chapters" aria-label="Chapters" tabindex="0" style="max-height: 200px">
${htmlChapters}
</section>`,
    react: `// Load once, in your app's entry file
import "@owlky/styles/owlky.css";
import { LinearProgress, Scrollbar, Typography } from "@owlky/react";

${reactChapters}

export function Chapters() {
  return (
    <>
      <LinearProgress color="info" scroll={{ container: "chapters" }} />
      <Scrollbar id="chapters" aria-label="Chapters" style={{ maxHeight: 200 }}>
        {chapters.map((chapter) => (
          <Typography key={chapter} variant="body2">
            {chapter}
          </Typography>
        ))}
      </Scrollbar>
    </>
  );
}`,
  },
  {
    id: "page",
    title: "Show the page's progress",
    body: "Without a container, the progress follows the page. Fix it at the top of the window to make a reading indicator. Where the browser supports scroll-driven animations, this one needs no JavaScript at all. The preview follows this page.",
    html: `<span role="progressbar" aria-hidden="true" data-ok-linear-progress data-ok-variant="determinate" data-ok-scroll-progress style="position: fixed; inset: 0 0 auto">
  <span data-ok-linear-progress-bar="1"></span>
</span>`,
    react: `import { LinearProgress } from "@owlky/react";

export function ReadingProgress() {
  return <LinearProgress scroll style={{ position: "fixed", inset: "0 0 auto" }} />;
}`,
  },
  {
    id: "circular",
    title: "Use a circular indicator",
    body: "A **Circular progress** works the same way: its arc grows from the top as the area scrolls. Set `axis` to `x` to follow horizontal scrolling, and `color` to `inherit` to draw it in the text color.",
    html: `<span role="progressbar" aria-hidden="true" data-ok-circular-progress data-ok-variant="determinate" data-ok-color="inherit" data-ok-size="32" data-ok-track-slot data-ok-scroll-progress data-ok-scroll-axis="x" data-ok-scroll-container="gallery">
  <svg data-ok-circular-progress-svg aria-hidden="true" viewBox="22 22 44 44"><circle data-ok-circular-progress-circle cx="44" cy="44" r="20.2" stroke-width="3.6"></circle></svg>
</span>
<section data-ok-scrollbar id="gallery" aria-label="Chapters in a row" tabindex="0" style="display: flex; gap: 16px">
${CHAPTERS.map((chapter) => `  <p data-ok-typography data-ok-variant="body2" style="flex: none">${chapter}</p>`).join("\n")}
</section>`,
    react: `import { CircularProgress, Scrollbar, Typography } from "@owlky/react";

${reactChapters}

export function ChapterRow() {
  return (
    <>
      <CircularProgress
        color="inherit"
        size={32}
        enableTrackSlot
        scroll={{ container: "gallery", axis: "x" }}
      />
      <Scrollbar id="gallery" aria-label="Chapters in a row" style={{ display: "flex", gap: 16 }}>
        {chapters.map((chapter) => (
          <Typography key={chapter} variant="body2" style={{ flex: "none" }}>
            {chapter}
          </Typography>
        ))}
      </Scrollbar>
    </>
  );
}`,
  },
  {
    id: "target",
    title: "Follow an element through the view",
    body: 'Give a `target` to measure how far one element has travelled through the container or the page, and an `offset` to say where the progress starts and ends. An offset is two intersections of the target and the container, written `"<target edge> <container edge>"`. For example, `start end, end start` starts when the target\'s top reaches the bottom of the view and ends when its bottom leaves the top. An edge is `start`, `center`, `end`, a fraction such as `0.5`, or a length in `px`, `%`, `vw` or `vh`. In React, refs work as well as `id`s.',
    html: `<span role="progressbar" aria-hidden="true" data-ok-linear-progress data-ok-variant="determinate" data-ok-scroll-progress data-ok-scroll-target="article" data-ok-scroll-offset="start end, end start">
  <span data-ok-linear-progress-bar="1"></span>
</span>
<article id="article">
  <h2 data-ok-typography data-ok-variant="h5">Release notes</h2>
  <p data-ok-typography data-ok-variant="body1">Offline mode, faster sync and a new editor.</p>
</article>`,
    react: `import { LinearProgress, Typography } from "@owlky/react";
import { useRef } from "react";

export function ArticleProgress() {
  const article = useRef<HTMLElement>(null);
  return (
    <>
      <LinearProgress scroll={{ target: article, offset: ["start end", "end start"] }} />
      <article ref={article}>
        <Typography variant="h5" component="h2">
          Release notes
        </Typography>
        <Typography>Offline mode, faster sync and a new editor.</Typography>
      </article>
    </>
  );
}`,
  },
  {
    id: "values",
    title: "Read the scroll position",
    body: "To draw something else from the scroll position, read it in code. In React, `useScroll()` returns the position in pixels and the progress from 0 to 1 on each axis, and renders again at most once a frame. In HTML, `observeScroll()` from `@owlky/html` calls you with the same values, and the instance of a progress has a `progress` property.",
    html: `<p data-ok-typography data-ok-variant="body2" id="position">0%</p>

<script type="module">
  import { observeScroll } from "@owlky/html";

  const position = document.getElementById("position");
  observeScroll({}, ({ scrollYProgress }) => {
    position.textContent = \`\${Math.round(scrollYProgress * 100)}%\`;
  });
</script>`,
    react: `import { Typography, useScroll } from "@owlky/react";

export function ScrollPercent() {
  const { scrollYProgress } = useScroll();
  return <Typography variant="body2">{Math.round(scrollYProgress * 100)}%</Typography>;
}`,
  },
  {
    id: "options",
    title: "Options",
    body: "The progress keeps all its own options, such as `color`, `size` and `thickness`. This option chooses the scroll direction.",
  },
  {
    id: "props",
    title: "Content and behavior",
    body: "These settings say what the progress follows. In React they are the fields of the `scroll` prop, or the options of `useScroll()`. In HTML they are attributes on the progress.",
  },
  {
    id: "accessibility",
    title: "Accessibility",
    body: `- A scroll progress is decorative: it is hidden from assistive technology (\`aria-hidden="true"\`) and has no value. The scroll area itself already tells screen reader users where they are, and a value that changed on every frame would interrupt them. React adds \`aria-hidden\` for you; write it in HTML.
- Keep the scroll area reachable with the keyboard: a **Scrollbar** is a named region that takes focus.
- With reduced motion, the indicator still follows the scroll position, because it shows where you are rather than moving by itself.`,
  },
  apiReferenceSection(scrollProgressApi),
];

const PREVIEWS = {
  overview: () => (
    <Preview className="block!">
      <LinearProgress color="info" scroll={{ container: "docs-chapters" }} />
      <Scrollbar id="docs-chapters" aria-label="Chapters" style={{ maxHeight: 160 }}>
        {CHAPTERS.map((chapter) => (
          <Typography key={chapter} variant="body2" className="my-2">
            {chapter}
          </Typography>
        ))}
      </Scrollbar>
    </Preview>
  ),
  page: () => (
    <Preview className="block!">
      <LinearProgress scroll />
    </Preview>
  ),
  circular: () => (
    <Preview className="block!">
      <CircularProgress
        color="inherit"
        size={32}
        enableTrackSlot
        scroll={{ container: "docs-row", axis: "x" }}
      />
      <Scrollbar id="docs-row" aria-label="Chapters in a row" style={{ display: "flex", gap: 16 }}>
        {CHAPTERS.map((chapter) => (
          <Typography key={chapter} variant="body2" className="shrink-0 my-2">
            {chapter}
          </Typography>
        ))}
      </Scrollbar>
    </Preview>
  ),
  options: () => <OptionsTable schema={scrollProgressOptions} />,
  props: () => (
    <PropsTable
      label="Scroll progress settings"
      rows={[
        {
          react: "scroll",
          type: "boolean | object",
          description:
            "On a LinearProgress or a CircularProgress: `true` follows the page, an object sets the fields below.",
        },
        {
          react: "container",
          html: "data-ok-scroll-container",
          type: "id | ref",
          description: "The scroll area to follow. Default: the page.",
        },
        {
          react: "target",
          html: "data-ok-scroll-target",
          type: "id | ref",
          description:
            "An element whose way through the container is measured. Default: the whole content.",
        },
        {
          react: "offset",
          html: "data-ok-scroll-offset",
          type: "[string, string]",
          description: "Where the progress starts and ends. Default `start start, end end`.",
        },
      ]}
    />
  ),
};

/** Scroll progress docs page (ADR-0019). */
export function ScrollProgressDocs() {
  return <GuideDocs sections={scrollProgressSections} previews={PREVIEWS} />;
}
