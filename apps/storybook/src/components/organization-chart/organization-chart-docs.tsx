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
    id: "direction",
    title: "Choose a direction",
    body: `\`direction\` sets the side the top node sits on, and the chart grows away from it:

- **\`top\`:** the default. Children sit below their parent.
- **\`bottom\`:** children sit above their parent.
- **\`left\`:** the top node sits at the start of the line, and children follow toward the end. In a right-to-left page, the chart mirrors and grows toward the left.
- **\`right\`:** the reverse of \`left\`.

Horizontal charts suit deep trees with short labels: each level adds width instead of height. Every direction keeps the same markup, so screen readers, the reading order and the **Tab** order follow the tree, parent before children, whatever the layout. Toggle buttons sit on the side of the label that faces the children, and their arrow points at them. The direction doesn't change with the screen width. To use another direction on small screens, change the prop or the attribute from your own code, for example after \`matchMedia("(max-width: 600px)")\` matches.`,
    html: `<ul data-ok-organization-chart data-ok-direction="left" data-ok-line-color="divider"
    data-ok-line-style="solid" aria-label="Company">
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

export function SidewaysCompany() {
  return (
    <OrganizationChart aria-label="Company" direction="left" label="Maya Lindqvist, CEO">
      <OrganizationChartNode label="Jonah Pereira, design" />
      <OrganizationChartNode label="Priya Raman, development" />
    </OrganizationChart>
  );
}`,
  },
  {
    id: "collapse",
    title: "Collapse and expand nodes",
    body: 'Set `enableExpandCollapse` to give every node with children a toggle button on the bottom edge of its label. The button collapses the node\'s children and expands them again, with an animation. A collapsed node draws no lines below it, and its button shows how many nodes it hides. Every node starts expanded: list the ids of the nodes to collapse at first in `defaultCollapsedNodes`, or control them with `collapsedNodes` and `onCollapsedNodesChange`. Give each node a `nodeId` and a `toggleLabel`, such as "Priya Raman\'s reports", which names its button for screen readers. Set `expandCollapseOnNodeClick` to also toggle a node when someone clicks its label, outside its own buttons and links. In HTML, the markup holds the state: a collapsed node\'s children list has `hidden` and its button has `aria-expanded="false"`. The script toggles both.',
    html: `<!-- Load once per page: the styles and the script -->
<link rel="stylesheet" href="${CDN}/owlky.css">
<script src="${CDN}/owlky.js" defer></script>

<ul data-ok-organization-chart data-ok-line-color="divider" data-ok-line-style="solid"
    data-ok-enable-expand-collapse data-ok-expand-collapse-on-node-click aria-label="Company">
  <li data-ok-organization-chart-node data-ok-node-id="maya">
    <div data-ok-organization-chart-label>Maya Lindqvist, CEO</div>
    <button type="button" data-ok-organization-chart-toggle aria-expanded="true"
            aria-controls="maya-reports">
      <span data-ok-organization-chart-toggle-label>Maya Lindqvist's reports</span>
      <svg data-ok-organization-chart-toggle-icon aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"></path></svg>
      <span data-ok-organization-chart-badge></span>
    </button>
    <ul data-ok-organization-chart-children data-ok-collapse id="maya-reports">
      <li data-ok-organization-chart-node data-ok-node-id="jonah">
        <div data-ok-organization-chart-label>Jonah Pereira, design</div>
      </li>
      <li data-ok-organization-chart-node data-ok-node-id="priya">
        <div data-ok-organization-chart-label>Priya Raman, development</div>
        <!-- Collapsed at first: aria-expanded="false" and a hidden list -->
        <button type="button" data-ok-organization-chart-toggle aria-expanded="false"
                aria-controls="priya-reports">
          <span data-ok-organization-chart-toggle-label>Priya Raman's reports</span>
          <svg data-ok-organization-chart-toggle-icon aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"></path></svg>
          <span data-ok-organization-chart-badge></span>
        </button>
        <ul data-ok-organization-chart-children data-ok-collapse id="priya-reports" hidden>
          <li data-ok-organization-chart-node data-ok-node-id="elias">
            <div data-ok-organization-chart-label>Elias Novak</div>
          </li>
          <li data-ok-organization-chart-node data-ok-node-id="noah">
            <div data-ok-organization-chart-label>Noah Brennan</div>
          </li>
        </ul>
      </li>
    </ul>
  </li>
</ul>`,
    react: `import { OrganizationChart, OrganizationChartNode } from "@owlky/react";

export function CollapsibleCompany() {
  return (
    <OrganizationChart
      aria-label="Company"
      enableExpandCollapse
      expandCollapseOnNodeClick
      defaultCollapsedNodes={["priya"]}
      nodeId="maya"
      toggleLabel="Maya Lindqvist's reports"
      label="Maya Lindqvist, CEO"
    >
      <OrganizationChartNode nodeId="jonah" label="Jonah Pereira, design" />
      <OrganizationChartNode
        nodeId="priya"
        toggleLabel="Priya Raman's reports"
        label="Priya Raman, development"
      >
        <OrganizationChartNode nodeId="elias" label="Elias Novak" />
        <OrganizationChartNode nodeId="noah" label="Noah Brennan" />
      </OrganizationChartNode>
    </OrganizationChart>
  );
}`,
  },
  {
    id: "methods",
    title: "Expand and collapse from code",
    body: "The chart's methods change many nodes at once: `expandAll()`, `collapseAll()`, `expandToDepth(depth)`, `expandSubtree(nodeId)` and `collapseSubtree(nodeId)`, plus `expand(nodeId)`, `collapse(nodeId)` and `isExpanded(nodeId)` for one node. The top node is at depth 0, so `expandToDepth(1)` shows the top node and its children only. The methods change only nodes whose children are loaded, and they fire no events. In React, pass a ref from `useOrganizationChartApiRef()` to `apiRef`. In HTML, get the chart's instance from the runtime.",
    html: `<button type="button" id="collapse-all">Collapse all</button>
<button type="button" id="leads-only">Show the leads only</button>

<script type="module">
  // The chart from the previous example
  const element = document.querySelector('[aria-label="Company"]');
  const chart = Owlky.runtime.get(element, "organization-chart");
  document.getElementById("collapse-all").addEventListener("click", () => chart.collapseAll());
  document.getElementById("leads-only").addEventListener("click", () => chart.expandToDepth(1));
</script>`,
    react: `import {
  Button,
  OrganizationChart,
  OrganizationChartNode,
  useOrganizationChartApiRef,
} from "@owlky/react";

export function CompanyWithActions() {
  const apiRef = useOrganizationChartApiRef();
  return (
    <>
      <Button onClick={() => apiRef.current?.collapseAll()}>Collapse all</Button>
      <Button onClick={() => apiRef.current?.expandToDepth(1)}>Show the leads only</Button>
      <OrganizationChart
        aria-label="Company"
        apiRef={apiRef}
        enableExpandCollapse
        nodeId="maya"
        label="Maya Lindqvist, CEO"
      >
        <OrganizationChartNode nodeId="priya" label="Priya Raman, development">
          <OrganizationChartNode nodeId="elias" label="Elias Novak" />
        </OrganizationChartNode>
      </OrganizationChart>
    </>
  );
}`,
  },
  {
    id: "lazy",
    title: "Load children on demand",
    body: 'A node can load its children the first time it expands, such as from a server. In React, set `hasChildren` on the node and pass `loadChildren` to the chart: it receives the node\'s id and resolves with the child nodes. In HTML, give the node a toggle and an empty, hidden children list, then answer the `ok:organization-chart:loadchildren` event with `detail.respondWith()`, which takes child node elements or a promise of them. While the children load, the toggle shows a progress indicator and has `aria-busy="true"`. When no children come back, the node becomes a leaf. When the promise is rejected, the node stays collapsed and the next expand tries again. Children load once: catch errors in your loader to show a message, and reject so that people can retry.',
    html: `<ul data-ok-organization-chart data-ok-line-color="divider" data-ok-line-style="solid"
    data-ok-enable-expand-collapse aria-label="Company" id="company">
  <li data-ok-organization-chart-node data-ok-node-id="maya">
    <div data-ok-organization-chart-label>Maya Lindqvist, CEO</div>
    <!-- No children yet: an empty, hidden list and a progress indicator -->
    <button type="button" data-ok-organization-chart-toggle aria-expanded="false"
            aria-controls="maya-reports">
      <span data-ok-organization-chart-toggle-label>Maya Lindqvist's reports</span>
      <svg data-ok-organization-chart-toggle-icon aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"></path></svg>
      <span role="progressbar" data-ok-circular-progress data-ok-variant="indeterminate"
            data-ok-color="inherit" aria-hidden="true" data-ok-organization-chart-spinner><svg data-ok-circular-progress-svg aria-hidden="true" viewBox="22 22 44 44"><circle data-ok-circular-progress-circle cx="44" cy="44" r="20.2" stroke-width="3.6"></circle></svg></span>
      <span data-ok-organization-chart-badge></span>
    </button>
    <ul data-ok-organization-chart-children data-ok-collapse id="maya-reports" hidden></ul>
  </li>
</ul>

<template id="maya-reports-template">
  <li data-ok-organization-chart-node data-ok-node-id="priya">
    <div data-ok-organization-chart-label>Priya Raman, development</div>
  </li>
</template>

<script type="module">
  const chart = document.getElementById("company");
  chart.addEventListener("ok:organization-chart:loadchildren", (event) => {
    // A server request works the same way: respond with a promise of the nodes
    const template = document.getElementById(\`\${event.detail.nodeId}-reports-template\`);
    event.detail.respondWith(template ? template.content.cloneNode(true) : null);
  });
</script>`,
    react: `import { OrganizationChart, OrganizationChartNode } from "@owlky/react";

const REPORTS: Record<string, string[]> = { maya: ["Priya Raman", "Jonah Pereira"] };

async function fetchReports(id: string) {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return REPORTS[id] ?? [];
}

export function LazyCompany() {
  return (
    <OrganizationChart
      aria-label="Company"
      enableExpandCollapse
      nodeId="maya"
      hasChildren
      toggleLabel="Maya Lindqvist's reports"
      label="Maya Lindqvist, CEO"
      loadChildren={async ({ id }) => {
        const names = await fetchReports(id);
        return names.map((name) => <OrganizationChartNode key={name} label={name} />);
      }}
    />
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
    id: "events",
    title: "Events and methods",
    body: `- **\`ok:organization-chart:expand\`** (cancelable) fires on the chart before someone expands a node, with \`detail.nodeId\` and \`detail.node\`. Call \`preventDefault()\` to keep the node collapsed.
- **\`ok:organization-chart:collapse\`** (cancelable) fires before someone collapses a node, with the same details.
- **\`ok:organization-chart:loadchildren\`** fires the first time a node with an empty children list expands, with \`detail.nodeId\`, \`detail.node\` and \`detail.respondWith(nodes)\`.
- **Instance:** \`runtime.get(element, "organization-chart")\` returns \`{ expand(id), collapse(id), isExpanded(id), expandAll(), collapseAll(), expandToDepth(depth), expandSubtree(id), collapseSubtree(id) }\`. \`expand(id)\` returns a promise that resolves once the children are loaded and shown. The methods don't fire events.
- **React:** \`onExpand(nodeId)\`, \`onCollapse(nodeId)\`, \`onCollapsedNodesChange(nodeIds)\` and the same methods on \`apiRef\`.`,
  },
  {
    id: "keyboard",
    title: "Keyboard",
    body: "A chart has no keys of its own. Buttons and links in its labels work as usual, in reading order: each node, its toggle button, then its children. **Tab** reaches the scroll area of a wide chart, and the arrow keys scroll it.",
  },
  {
    id: "accessibility",
    title: "Accessibility",
    body: `- The chart is a set of nested lists. Screen readers announce each level, the number of nodes in it and the position of each node.
- Name the chart with \`aria-label\` or \`aria-labelledby\`, such as the name of the team it shows.
- Lines are decorative: the list structure carries the hierarchy. Don't rely on a line color alone to convey meaning.
- Text in labels needs a contrast ratio of at least 4.5:1, like any other text.
- In right-to-left pages, the chart mirrors: the first child is on the right, and a \`left\` chart grows toward the left.
- Every \`direction\` keeps the tree's reading order: a node, then its children.
- Toggle buttons have \`aria-expanded\` and \`aria-controls\`. Their name is the hidden \`toggleLabel\` followed by the visible number of hidden nodes, so that speech input users can say what they see. Make each \`toggleLabel\` unique, such as the person's name and "reports".
- Collapsed children are hidden from screen readers too. While children load, the toggle has \`aria-busy="true"\`.
- A click on a label is a shortcut for pointer users: keyboard users reach the toggle button with **Tab**.`,
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
  direction: () => (
    <Preview>
      <Scrollbar aria-label="Sideways company chart, scrollable" style={{ width: "100%" }}>
        <OrganizationChart aria-label="Company" direction="left" label="Maya Lindqvist, CEO">
          <OrganizationChartNode label="Jonah Pereira, design">
            <OrganizationChartNode label="Aiko Tanaka" />
          </OrganizationChartNode>
          <OrganizationChartNode label="Priya Raman, development" />
          <OrganizationChartNode label="Leila Haddad, marketing" />
        </OrganizationChart>
      </Scrollbar>
    </Preview>
  ),
  collapse: () => (
    <Preview>
      <OrganizationChart
        aria-label="Company"
        enableExpandCollapse
        expandCollapseOnNodeClick
        defaultCollapsedNodes={["priya"]}
        nodeId="maya"
        toggleLabel="Maya Lindqvist's reports"
        label="Maya Lindqvist, CEO"
      >
        <OrganizationChartNode nodeId="jonah" label="Jonah Pereira, design" />
        <OrganizationChartNode
          nodeId="priya"
          toggleLabel="Priya Raman's reports"
          label="Priya Raman, development"
        >
          <OrganizationChartNode nodeId="elias" label="Elias Novak" />
          <OrganizationChartNode nodeId="noah" label="Noah Brennan" />
        </OrganizationChartNode>
      </OrganizationChart>
    </Preview>
  ),
  lazy: () => (
    <Preview>
      <OrganizationChart
        aria-label="Company"
        enableExpandCollapse
        nodeId="maya"
        hasChildren
        toggleLabel="Maya Lindqvist's reports"
        label="Maya Lindqvist, CEO"
        loadChildren={async () => {
          await new Promise((resolve) => setTimeout(resolve, 500));
          return ["Priya Raman", "Jonah Pereira"].map((name) => (
            <OrganizationChartNode key={name} label={name} />
          ));
        }}
      />
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
        {
          react: "nodeId",
          html: "data-ok-node-id",
          type: "string",
          description: "The node's id, used by the methods, events and collapsedNodes.",
        },
        {
          react: "toggleLabel",
          html: "span[data-ok-organization-chart-toggle-label]",
          type: "string",
          description:
            'The name of the node\'s toggle button, hidden on screen. Default "Child nodes".',
        },
        {
          react: "hasChildren",
          html: "an empty ul[data-ok-organization-chart-children][hidden]",
          type: "boolean",
          description: "The node has children to load with loadChildren on its first expand.",
        },
        {
          react: "collapseBadgeEnabled",
          html: "span[data-ok-organization-chart-badge]",
          type: "boolean",
          description:
            "Shows the number of hidden nodes on collapsed toggles. Default true. In HTML, leave the span out for no badge.",
        },
      ]}
    />
  ),
};

/** Organization chart docs page (ADR-0019). */
export function OrganizationChartDocs() {
  return <GuideDocs sections={organizationChartSections} previews={PREVIEWS} />;
}
