import { organizationChartOptions } from "@owlky/core";
import organizationChartApi from "@owlky/docs-content/api/organization-chart.json" with {
  type: "json",
};
import { apiReferenceSection } from "@owlky/docs-content/guide/api-data";
import { OrganizationChart, OrganizationChartNode, Scrollbar } from "@owlky/react";
import { CDN, GuideDocs, type GuideSection, Preview } from "../../helpers/guide.js";
import { OptionsTable, PropsTable } from "../../helpers/guide-tables.js";

export const organizationChartSections: GuideSection[] = [
  {
    id: "overview",
    title: "Overview",
    body: "An organization chart shows a hierarchy as a tree, such as the people of a company or the parts of a product. Each node holds any content you choose, such as a card with a name and a role. Lines join every node to its parent. The chart is a set of nested lists (`ul` and `li`), so screen readers announce each level and how many nodes it has. It needs no JavaScript.",
    html: `<!-- Load once per page: the styles -->
<link rel="stylesheet" href="${CDN}/owlky.css">

<ul data-ok-organization-chart data-ok-line-color="divider" data-ok-line-style="solid"
    aria-label="Company">
  <li data-ok-organization-chart-node>
    <div data-ok-organization-chart-label>Maya Lindqvist, CEO</div>
    <ul data-ok-organization-chart-children>
      <li data-ok-organization-chart-node>
        <div data-ok-organization-chart-label>Jonah Pereira, design</div>
      </li>
      <li data-ok-organization-chart-node>
        <div data-ok-organization-chart-label>Priya Raman, development</div>
      </li>
    </ul>
  </li>
</ul>`,
    react: `import { OrganizationChart, OrganizationChartNode } from "@owlky/react";

export function Company() {
  return (
    <OrganizationChart aria-label="Company" label="Maya Lindqvist, CEO">
      <OrganizationChartNode label="Jonah Pereira, design" />
      <OrganizationChartNode label="Priya Raman, development" />
    </OrganizationChart>
  );
}`,
  },
  {
    id: "nodes",
    title: "Build the tree",
    body: "`OrganizationChart` is the root: its `label` is the top node and its children are the next level. Each `OrganizationChartNode` has a `label` and may hold more nodes, at any depth. In HTML, a node is an `li` with a label `div` and, when it has children, a `ul` of child nodes. Leave out the children list on nodes without children, so no line hangs below them. Labels take any content, such as cards with an avatar, a name, a role and a menu button.",
    html: `<li data-ok-organization-chart-node>
  <div data-ok-organization-chart-label>Priya Raman</div>
  <ul data-ok-organization-chart-children>
    <li data-ok-organization-chart-node>
      <div data-ok-organization-chart-label>Elias Novak</div>
    </li>
  </ul>
</li>`,
    react: `import { OrganizationChartNode } from "@owlky/react";

export function OrganizationChartNodes() {
  return (
    <OrganizationChartNode label="Priya Raman">
      <OrganizationChartNode label="Elias Novak" />
    </OrganizationChartNode>
  );
}`,
  },
  {
    id: "lines",
    title: "Style the lines",
    body: "The line options are set on the root and apply to the whole chart. `lineColor` is `divider` by default. Set it to a palette color for its light tone, or to `inherit` to use the chart's text color, which you can set with the `color` property. `lineStyle` draws `solid`, `dashed` or `dotted` lines. Lengths are numbers in pixels, or strings with a unit such as `\"1.5rem\"`: `lineHeight` (40 by default) is the height of the lines between two levels, `lineWidth` (1) their thickness, `lineBorderRadius` (24) the corner radius where they turn and `nodePadding` (4) the space on each side of every node. In HTML, the lengths need the script: it turns the attributes into private CSS properties, because CSS can't read lengths from attributes. Without the script, the default lengths apply.",
    html: `<!-- The lengths need the script (once per page) -->
<script src="${CDN}/owlky.js" defer></script>

<ul data-ok-organization-chart data-ok-line-color="primary" data-ok-line-style="dashed"
    data-ok-line-height="20" data-ok-line-border-radius="8" aria-label="Company">
  <li data-ok-organization-chart-node>
    <div data-ok-organization-chart-label>Maya Lindqvist, CEO</div>
    <ul data-ok-organization-chart-children>
      <li data-ok-organization-chart-node>
        <div data-ok-organization-chart-label>Jonah Pereira, design</div>
      </li>
      <li data-ok-organization-chart-node>
        <div data-ok-organization-chart-label>Priya Raman, development</div>
      </li>
    </ul>
  </li>
</ul>`,
    react: `import { OrganizationChart, OrganizationChartNode } from "@owlky/react";

export function OrganizationChartLines() {
  return (
    <OrganizationChart
      aria-label="Company"
      label="Maya Lindqvist"
      lineColor="primary"
      lineStyle="dashed"
      lineHeight={20}
      lineBorderRadius={8}
    >
      <OrganizationChartNode label="Jonah Pereira, design" />
      <OrganizationChartNode label="Priya Raman, development" />
    </OrganizationChart>
  );
}`,
  },
  {
    id: "scroll",
    title: "Scroll wide charts",
    body: "A chart is as wide as its widest level and is centered when it fits. Put it in a `Scrollbar` so that a wide chart scrolls sideways inside the page, from its first node, instead of widening the page on small screens. Name the scroll area: it takes keyboard focus so that keyboard users can scroll it.",
    html: `<section data-ok-scrollbar aria-label="Company chart, scrollable" tabindex="0">
  <ul data-ok-organization-chart data-ok-line-color="divider" data-ok-line-style="solid"
      aria-label="Company">
    <li data-ok-organization-chart-node>
      <div data-ok-organization-chart-label>Maya Lindqvist, CEO</div>
      <ul data-ok-organization-chart-children>
        <li data-ok-organization-chart-node>
          <div data-ok-organization-chart-label>Jonah Pereira, design</div>
        </li>
        <li data-ok-organization-chart-node>
          <div data-ok-organization-chart-label>Priya Raman, development</div>
        </li>
      </ul>
    </li>
  </ul>
</section>`,
    react: `import { OrganizationChart, OrganizationChartNode, Scrollbar } from "@owlky/react";

export function CompanyChart() {
  return (
    <Scrollbar aria-label="Company chart, scrollable">
      <OrganizationChart aria-label="Company" label="Maya Lindqvist">
        <OrganizationChartNode label="Jonah Pereira, design" />
        <OrganizationChartNode label="Priya Raman, development" />
      </OrganizationChart>
    </Scrollbar>
  );
}`,
  },
  {
    id: "options",
    title: "Options",
    body: "Every option works the same way in both versions: a prop in React, an attribute in HTML. Values that aren't listed, and lengths that aren't valid, fall back to the default.",
  },
  {
    id: "props",
    title: "Content and behavior",
    body: "These parts hold the content. They aren't options, because HTML writes them as markup.",
  },
  {
    id: "keyboard",
    title: "Keyboard",
    body: "A chart isn't interactive. Buttons and links in its labels work as usual, in reading order: each node, then its children. **Tab** reaches the scroll area of a wide chart, and the arrow keys scroll it.",
  },
  {
    id: "accessibility",
    title: "Accessibility",
    body: `- The chart is a set of nested lists. Screen readers announce each level, the number of nodes in it and the position of each node.
- Name the chart with \`aria-label\` or \`aria-labelledby\`, such as the name of the team it shows.
- Lines are decorative: the list structure carries the hierarchy. Don't rely on a line color alone to convey meaning.
- Text in labels needs a contrast ratio of at least 4.5:1, like any other text.
- In right-to-left pages, the chart mirrors: the first child is on the right.`,
  },
  apiReferenceSection(organizationChartApi),
];

const PREVIEWS = {
  overview: () => (
    <Preview>
      <OrganizationChart aria-label="Company" label="Maya Lindqvist, CEO">
        <OrganizationChartNode label="Jonah Pereira, design" />
        <OrganizationChartNode label="Priya Raman, development" />
      </OrganizationChart>
    </Preview>
  ),
  lines: () => (
    <Preview>
      <OrganizationChart
        aria-label="Company"
        label="Maya Lindqvist"
        lineColor="primary"
        lineStyle="dashed"
        lineHeight={20}
        lineBorderRadius={8}
      >
        <OrganizationChartNode label="Jonah Pereira">
          <OrganizationChartNode label="Aiko Tanaka" />
        </OrganizationChartNode>
        <OrganizationChartNode label="Priya Raman" />
        <OrganizationChartNode label="Leila Haddad" />
      </OrganizationChart>
    </Preview>
  ),
  scroll: () => (
    <Preview>
      <Scrollbar aria-label="Company chart, scrollable" style={{ width: "100%" }}>
        <OrganizationChart aria-label="Company" label="Maya Lindqvist">
          {["Jonah Pereira", "Priya Raman", "Leila Haddad", "Oskar Berg", "Zara Okafor"].map(
            (name) => (
              <OrganizationChartNode key={name} label={name}>
                <OrganizationChartNode label="Team" />
              </OrganizationChartNode>
            ),
          )}
        </OrganizationChart>
      </Scrollbar>
    </Preview>
  ),
  options: () => <OptionsTable schema={organizationChartOptions} />,
  props: () => (
    <PropsTable
      label="Organization chart parts"
      rows={[
        {
          react: "label",
          html: "div[data-ok-organization-chart-label]",
          type: "ReactNode",
          description: "Content of a node, on the chart (its top node) and on every node.",
        },
        {
          react: "OrganizationChartNode",
          html: "li[data-ok-organization-chart-node]",
          type: "component",
          description: "One node: its label and its children.",
        },
        {
          react: "children",
          html: "ul[data-ok-organization-chart-children]",
          type: "ReactNode",
          description: "The nodes of the next level. Leave it out on nodes without children.",
        },
      ]}
    />
  ),
};

/** Organization chart docs page (ADR-0019). */
export function OrganizationChartDocs() {
  return <GuideDocs sections={organizationChartSections} previews={PREVIEWS} />;
}
