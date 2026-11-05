import { defaultTheme } from "@owlky/tokens";
import { Caption, CDN, GuideDocs, type GuideSection, Preview } from "../shared/guide.js";

const { breakpoints } = defaultTheme;

export const gridSections: GuideSection[] = [
  {
    id: "spacing",
    title: "Spacing",
    body: `All spacing in Owlky is a multiple of one unit, \`--ok-spacing\`. It equals \`0.25rem\`, which is 4px at the default font size. To get a space, multiply the unit: \`calc(var(--ok-spacing) * 4)\` is 16px.

Because the unit is in \`rem\`, spacing grows with the root font size. The **Spacing** story in the sidebar lets you try different values.`,
    html: `<!-- Load once per page -->
<link rel="stylesheet" href="${CDN}/owlky.css">

<style>
  .toolbar {
    display: flex;
    gap: calc(var(--ok-spacing) * 2);   /* 8px */
    padding: calc(var(--ok-spacing) * 4); /* 16px */
  }
</style>`,
    react: `// Load once, in your app's entry file
import "@owlky/styles/owlky.css";

const toolbar = {
  display: "flex",
  gap: "calc(var(--ok-spacing) * 2)", // 8px
  padding: "calc(var(--ok-spacing) * 4)", // 16px
};`,
  },
  {
    id: "tailwind",
    title: "Use Tailwind CSS spacing",
    body: "The Owlky theme for Tailwind CSS v4 sets Tailwind's spacing unit to `--ok-spacing`, so every spacing utility follows it. For example, `gap-2` is 8px and `p-4` is 16px.",
    html: `<div class="flex gap-2 p-4">…</div>`,
    react: `<div className="flex gap-2 p-4">…</div>`,
  },
  {
    id: "breakpoints",
    title: "Breakpoints",
    body: `Owlky components change their layout at these screen widths:

- **sm:** ${breakpoints.sm}px and wider (large phones in landscape, tablets).
- **md:** ${breakpoints.md}px and wider (small laptops).
- **lg:** ${breakpoints.lg}px and wider (desktops).
- **xl:** ${breakpoints.xl}px and wider (large desktops).

The values are also available as \`--ok-breakpoint-sm\` and the other \`--ok-breakpoint-*\` variables, for use in JavaScript. CSS media queries can't read variables, so write the pixel value in your queries.

Tailwind CSS uses different breakpoints by default (640px, 768px, 1024px). To match Owlky, use arbitrary breakpoints such as \`min-[900px]:\`.`,
    html: `<style>
  .layout {
    display: grid;
    gap: calc(var(--ok-spacing) * 6);
  }
  @media (min-width: ${breakpoints.md}px) {
    .layout {
      grid-template-columns: 280px 1fr;
    }
  }
</style>`,
    react: `import { defaultTheme } from "@owlky/tokens";

// Read the breakpoint in code, for example for a matchMedia query
const desktop = window.matchMedia(\`(min-width: \${defaultTheme.breakpoints.md}px)\`);`,
  },
  {
    id: "columns",
    title: "Lay out content in columns",
    body: "Page layouts use a grid of 12 equal columns. A card can span all 12 columns on phones, 6 on tablets and 4 on desktops. Use CSS grid: the browser handles the math. The **Column** story in the sidebar shows 1 to 12 columns.",
    html: `<style>
  .cards {
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    gap: calc(var(--ok-spacing) * 4);
  }
  .cards > * { grid-column: span 12; }
  @media (min-width: ${breakpoints.sm}px) { .cards > * { grid-column: span 6; } }
  @media (min-width: ${breakpoints.lg}px) { .cards > * { grid-column: span 4; } }
</style>

<div class="cards">
  <article>…</article>
  <article>…</article>
  <article>…</article>
</div>`,
    react: `// With the Owlky theme for Tailwind CSS
export function Cards({ children }) {
  return (
    <div className="grid grid-cols-12 gap-4 *:col-span-12 min-[600px]:*:col-span-6 min-[1200px]:*:col-span-4">
      {children}
    </div>
  );
}`,
  },
  {
    id: "accessibility",
    title: "Accessibility",
    body: `- Let content reflow: at a width of 320px, a page must work without horizontal scrolling (WCAG 2.2, success criterion 1.4.10). Prefer \`minmax(0, 1fr)\` and wrapping to fixed widths.
- Keep interactive targets at least 24 × 24px, with enough space between them (success criterion 2.5.8). Owlky components already do.
- Spacing in \`rem\` grows with the user's font size, so text and the space around it stay in proportion.`,
  },
];

function SpacingPreview() {
  return (
    <Preview className="flex-col items-start! gap-2!">
      {[1, 2, 4, 6, 10].map((n) => (
        <div key={n} className="flex items-center gap-3">
          <span className="w-28">
            <Caption>
              × {n} = {n * 4}px
            </Caption>
          </span>
          <span
            aria-hidden="true"
            className="block h-3 rounded-sm"
            style={{
              width: `calc(var(--ok-spacing) * ${n})`,
              backgroundColor: "var(--ok-palette-primary-main)",
            }}
          />
        </div>
      ))}
    </Preview>
  );
}

function BreakpointsPreview() {
  const max = breakpoints.xl;
  return (
    <Preview className="flex-col items-stretch!">
      <div className="relative h-10 rounded-md bg-neutral">
        {(["sm", "md", "lg", "xl"] as const).map((name) => (
          <span
            key={name}
            className="absolute top-0 flex h-full flex-col justify-center border-0 border-l-2 border-solid border-text-secondary pl-1"
            style={{ left: `${(breakpoints[name] / max) * 96}%` }}
          >
            <Caption>
              {name} {breakpoints[name]}
            </Caption>
          </span>
        ))}
      </div>
    </Preview>
  );
}

function ColumnsPreview() {
  return (
    <Preview className="block!">
      <div className="grid grid-cols-12 gap-4 *:col-span-12 min-[600px]:*:col-span-6 min-[1200px]:*:col-span-4">
        {["One", "Two", "Three"].map((label) => (
          <div key={label} className="rounded-lg bg-neutral p-4 text-center">
            {label}
          </div>
        ))}
      </div>
    </Preview>
  );
}

const PREVIEWS = {
  spacing: SpacingPreview,
  breakpoints: BreakpointsPreview,
  columns: ColumnsPreview,
};

/** Grid docs page. */
export function GridDocs() {
  return <GuideDocs sections={gridSections} previews={PREVIEWS} />;
}
