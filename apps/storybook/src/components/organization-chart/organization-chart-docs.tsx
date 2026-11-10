import { organizationChartNodeOptions, organizationChartOptions } from "@owlky/core";
import organizationChartApi from "@owlky/docs-content/api/organization-chart.json" with {
  type: "json",
};
import { apiReferenceSection } from "@owlky/docs-content/guide/api-data";
import {
  OrganizationChart,
  OrganizationChartNode,
  OrganizationChartToolbar,
  Scrollbar,
} from "@owlky/react";
import searchGroup from "../../../../../packages/html/src/components/organization-chart/examples/search-group.html?raw";
import { CDN, GuideDocs, type GuideSection, Preview } from "../../helpers/guide.js";
import { OptionsTable, PropsTable } from "../../helpers/guide-tables.js";
import { snippetElement } from "../../helpers/snippet-markup.js";
import { SearchChartDemo } from "./search-demo.js";

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
    body: "The line options are set on the root and apply to the whole chart, unless a node sets its own. `lineColor` is `divider` by default. Set it to a palette color for its light tone, or to `inherit` to use the chart's text color, which you can set with the `color` property. `lineStyle` draws `solid`, `dashed` or `dotted` lines. Lengths are numbers in pixels, or strings with a unit such as `\"1.5rem\"`: `lineHeight` (40 by default) is the height of the lines between two levels, `lineWidth` (1) their thickness, `lineBorderRadius` (24) the corner radius where they turn and `nodePadding` (4) the space on each side of every node. In HTML, the lengths need the script: it turns the attributes into private CSS properties, because CSS can't read lengths from attributes. Without the script, the default lengths apply.",
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
    id: "node-lines",
    title: "Style the lines of a node",
    body: "Set `lineColor` and `lineStyle` on a node to style the lines from that node to its children, and the border of its toggle button. They take the same values as the chart's options. Nodes without them use the chart's lines. By default, a node's lines stop at its children: the next level uses the chart's lines again. Set `edgeColorMode` to `\"node\"` on the chart to carry a node's lines through its whole branch, down to the nodes that set their own, for example to give each team its own color. In HTML, the node options are the same `data-ok-line-color` and `data-ok-line-style` attributes, on the node's `li`. They need no script. Lines are decorative, so don't rely on their color alone to convey meaning: say it in the labels too.",
    html: `<ul data-ok-organization-chart data-ok-line-color="divider" data-ok-line-style="solid"
    data-ok-edge-color-mode="node" aria-label="Company">
  <li data-ok-organization-chart-node>
    <div data-ok-organization-chart-label>Maya Lindqvist, CEO</div>
    <ul data-ok-organization-chart-children>
      <li data-ok-organization-chart-node data-ok-line-color="primary">
        <div data-ok-organization-chart-label>Jonah Pereira, design</div>
        <ul data-ok-organization-chart-children>
          <li data-ok-organization-chart-node>
            <div data-ok-organization-chart-label>Aiko Tanaka, design</div>
          </li>
        </ul>
      </li>
      <li data-ok-organization-chart-node data-ok-line-color="info" data-ok-line-style="dashed">
        <div data-ok-organization-chart-label>Priya Raman, development</div>
        <ul data-ok-organization-chart-children>
          <li data-ok-organization-chart-node>
            <div data-ok-organization-chart-label>Elias Novak, development</div>
          </li>
        </ul>
      </li>
    </ul>
  </li>
</ul>`,
    react: `import { OrganizationChart, OrganizationChartNode } from "@owlky/react";

export function TeamColors() {
  return (
    <OrganizationChart aria-label="Company" edgeColorMode="node" label="Maya Lindqvist, CEO">
      <OrganizationChartNode lineColor="primary" label="Jonah Pereira, design">
        <OrganizationChartNode label="Aiko Tanaka, design" />
      </OrganizationChartNode>
      <OrganizationChartNode lineColor="info" lineStyle="dashed" label="Priya Raman, development">
        <OrganizationChartNode label="Elias Novak, development" />
      </OrganizationChartNode>
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
    id: "group-leaves",
    title: "Group leaf nodes",
    body: "A wide level of people without reports makes a chart wide. Set `groupLeafNodes` to stack them in one column under their parent instead, joined by a line along their side. A node's children are grouped when there are two or more of them and none has children of its own. A level that mixes leaves with branches keeps its row, and a single child keeps its straight line. Branches that collapse or load their children on demand count as branches. `groupLeafNodesSpacing` sets the space between grouped leaves: 8 pixels by default, or a string with a unit. Grouping follows the `direction`: the column grows upward in a `bottom` chart, and in `left` and `right` charts the leaves form a row after their parent. In HTML, the spacing needs the script, like the other lengths. Grouping itself is CSS only.",
    html: `<ul data-ok-organization-chart data-ok-line-color="divider" data-ok-line-style="solid"
    data-ok-group-leaf-nodes aria-label="Design team">
  <li data-ok-organization-chart-node>
    <div data-ok-organization-chart-label>Jonah Pereira, design lead</div>
    <ul data-ok-organization-chart-children>
      <li data-ok-organization-chart-node>
        <div data-ok-organization-chart-label>Aiko Tanaka</div>
      </li>
      <li data-ok-organization-chart-node>
        <div data-ok-organization-chart-label>Oskar Berg</div>
      </li>
      <li data-ok-organization-chart-node>
        <div data-ok-organization-chart-label>Zara Okafor</div>
      </li>
    </ul>
  </li>
</ul>`,
    react: `import { OrganizationChart, OrganizationChartNode } from "@owlky/react";

export function DesignTeam() {
  return (
    <OrganizationChart aria-label="Design team" groupLeafNodes label="Jonah Pereira, design lead">
      <OrganizationChartNode label="Aiko Tanaka" />
      <OrganizationChartNode label="Oskar Berg" />
      <OrganizationChartNode label="Zara Okafor" />
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
    id: "highlight",
    title: "Highlight a path and find a node",
    body: `- **Highlight on hover:** with \`highlightOnHover\`, hovering a node or moving the focus into it highlights its path to the top node: the lines on the path take the primary color, and the other nodes fade. \`dimOpacity\` sets how much they fade, from 0 (not at all) to 1 (hidden), and is 0.7 by default.
- **Highlight from code:** \`highlightNode(nodeId)\` highlights a node and its path until \`clearHighlight()\`. It opens the collapsed nodes above it, then scrolls it into view, and returns a promise that resolves once it is in view. The node gets a ring and \`data-ok-highlighted\`, and nothing fades, so that every node keeps its text contrast while the result shows. Hovering another node highlights that node instead, for as long as the pointer stays.
- **Search:** put an \`Autocomplete\` next to the chart, with one option per node and the node's id as the option's value. When the value changes, call \`highlightNode(value)\`, and write what happened in a \`role="status"\` element, so that screen readers announce it politely.

In React, the highlighted node is the \`highlightedNode\` prop (or \`defaultHighlightedNode\`), reported through \`onHighlightedNodeChange\`. In HTML, it is the \`data-ok-highlighted\` attribute on the node, and the instance has \`highlightNode(nodeId)\`, \`clearHighlight()\` and \`getHighlightedNode()\`.`,
    html: `<!-- Load once per page: the styles and the script -->
<link rel="stylesheet" href="${CDN}/owlky.css">
<script src="${CDN}/owlky.js" defer></script>

${snippetElement(searchGroup, "data-ok-autocomplete ")}
<p data-ok-typography data-ok-variant="body2" id="org-search-status" role="status"></p>

${snippetElement(searchGroup, "data-ok-scrollbar ")}

<script type="module">
  const chart = Owlky.runtime.get(document.getElementById("org-search"), "organization-chart");
  const field = document.querySelector("[data-ok-autocomplete]");
  const status = document.getElementById("org-search-status");

  // The options' values are the nodes' data-ok-node-id
  field.addEventListener("ok:autocomplete:change", (event) => {
    const { value } = event.detail;
    const option = value && field.querySelector(\`[role="option"][data-ok-value="\${CSS.escape(value)}"]\`);
    if (option) {
      chart.highlightNode(value);
      status.textContent = \`\${option.textContent.trim()} is highlighted in the chart.\`;
    } else {
      chart.clearHighlight();
      status.textContent = "";
    }
  });
</script>`,
    react: `import {
  Autocomplete,
  OrganizationChart,
  OrganizationChartNode,
  Typography,
  useOrganizationChartApiRef,
} from "@owlky/react";
import { useState } from "react";

const people = [
  { value: "maya", label: "Maya Lindqvist" },
  { value: "priya", label: "Priya Raman" },
  { value: "elias", label: "Elias Novak" },
];

export function SearchableCompany() {
  const apiRef = useOrganizationChartApiRef();
  const [status, setStatus] = useState("");
  return (
    <>
      <Autocomplete
        label="Find a person"
        options={people}
        onChange={(value) => {
          const person = people.find((item) => item.value === value);
          if (person) {
            void apiRef.current?.highlightNode(person.value);
            setStatus(\`\${person.label} is highlighted in the chart.\`);
          } else {
            apiRef.current?.clearHighlight();
            setStatus("");
          }
        }}
      />
      <Typography role="status" variant="body2">
        {status}
      </Typography>
      <OrganizationChart
        aria-label="Company"
        apiRef={apiRef}
        enableExpandCollapse
        highlightOnHover
        defaultCollapsedNodes={["priya"]}
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
    id: "zoom",
    title: "Zoom and pan",
    body: `Set \`enableZoomPan\` to let people zoom a large chart and drag it around. Put the chart in a \`Scrollbar\` with a fixed height: the zoomed chart scrolls inside it, and the page never scrolls sideways. Then:

- **Zoom with the pointer:** hold **Ctrl** (**Command** on macOS) and turn the mouse wheel, or pinch on a trackpad. The point under the pointer stays in place. A wheel without the key scrolls as usual, so the chart never takes over the page's scrolling.
- **Zoom with the keyboard:** press **+** to zoom in, **−** to zoom out and **0** to return to 100%, while the scroll area or a control in the chart has the focus.
- **Pan:** drag the chart with the mouse. Touch screens scroll it natively.
- **Use the toolbar:** \`OrganizationChartToolbar\` shows zoom out, the level, zoom in, fit and reset buttons for the chart whose \`id\` its \`chartId\` names. Place it next to the scroll area, so it doesn't scroll away. In HTML, the toolbar is a \`div\` whose \`data-ok-organization-chart-toolbar\` attribute names the chart, and it needs no script of its own.

The level goes from \`minZoom\` (0.25) to \`maxZoom\` (2), and 1 is 100%. Control it with \`zoom\` and \`onZoomChange\`, or start from \`defaultZoom\`. In HTML, \`data-ok-zoom\` holds the level. **Fit to screen** picks the largest level up to 100% at which the whole chart fits the scroll area. It doesn't enlarge a small chart, so text never grows past its normal size. To bring a node into view, call \`centerOnNode(id)\`: it opens the collapsed branches above the node first.`,
    html: `<!-- Zoom and pan need the script (once per page) -->
<script src="${CDN}/owlky.js" defer></script>

<!-- The toolbar names the chart by its id -->
<div data-ok-organization-chart-toolbar="company-chart" role="group" aria-label="Zoom">
  <button type="button" data-ok-icon-button data-ok-color="default" data-ok-size="sm"
          data-ok-organization-chart-zoom-out aria-label="Zoom out" aria-controls="company-chart">
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path><path d="M8 11h6"></path></svg>
  </button>
  <output data-ok-organization-chart-zoom-value></output>
  <button type="button" data-ok-icon-button data-ok-color="default" data-ok-size="sm"
          data-ok-organization-chart-zoom-in aria-label="Zoom in" aria-controls="company-chart">
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path><path d="M11 8v6"></path><path d="M8 11h6"></path></svg>
  </button>
  <button type="button" data-ok-icon-button data-ok-color="default" data-ok-size="sm"
          data-ok-organization-chart-fit aria-label="Fit to screen" aria-controls="company-chart">
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"></path><path d="M17 3h2a2 2 0 0 1 2 2v2"></path><path d="M21 17v2a2 2 0 0 1-2 2h-2"></path><path d="M7 21H5a2 2 0 0 1-2-2v-2"></path></svg>
  </button>
  <button type="button" data-ok-icon-button data-ok-color="default" data-ok-size="sm"
          data-ok-organization-chart-reset aria-label="Reset zoom" aria-controls="company-chart">
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
  </button>
</div>

<!-- A scroll area with a fixed height: the zoomed chart scrolls inside it -->
<section data-ok-scrollbar aria-label="Company chart, scrollable" tabindex="0" style="height: 400px">
  <ul data-ok-organization-chart data-ok-line-color="divider" data-ok-line-style="solid"
      data-ok-enable-zoom-pan data-ok-zoom="1" id="company-chart" aria-label="Company">
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
</section>

<script type="module">
  // The level changes through a cancelable event, with the new and the previous level
  document.getElementById("company-chart").addEventListener("ok:organization-chart:zoom", (event) => {
    console.log(\`Zoom: \${event.detail.previous} to \${event.detail.zoom}\`);
  });
</script>`,
    react: `import {
  OrganizationChart,
  OrganizationChartNode,
  OrganizationChartToolbar,
  Scrollbar,
} from "@owlky/react";

export function ZoomableCompany() {
  return (
    <>
      <OrganizationChartToolbar chartId="company-chart" />
      {/* A scroll area with a fixed height: the zoomed chart scrolls inside it */}
      <Scrollbar aria-label="Company chart, scrollable" style={{ height: 400 }}>
        <OrganizationChart
          id="company-chart"
          aria-label="Company"
          enableZoomPan
          onZoomChange={(level) => console.log(\`Zoom: \${level}\`)}
          label="Maya Lindqvist, CEO"
        >
          <OrganizationChartNode label="Jonah Pereira, design" />
          <OrganizationChartNode label="Priya Raman, development" />
        </OrganizationChart>
      </Scrollbar>
    </>
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
- **\`ok:organization-chart:zoom\`** (cancelable) fires when someone zooms with the wheel, a pinch, the keys or the toolbar, with \`detail.zoom\` (the new level) and \`detail.previous\`. Call \`preventDefault()\` to keep the level.
- **\`ok:organization-chart:loadchildren\`** fires the first time a node with an empty children list expands, with \`detail.nodeId\`, \`detail.node\` and \`detail.respondWith(nodes)\`.
- **Instance:** \`runtime.get(element, "organization-chart")\` returns \`{ expand(id), collapse(id), isExpanded(id), expandAll(), collapseAll(), expandToDepth(depth), expandSubtree(id), collapseSubtree(id), highlightNode(id), clearHighlight(), getHighlightedNode(), zoom(factor), zoomIn(), zoomOut(), setZoom(level), getZoom(), resetZoom(), fitScreen(), centerOnNode(id) }\`. \`zoom(factor)\` multiplies the level by 1 + factor, and \`zoomIn()\` and \`zoomOut()\` multiply or divide it by 1.25. \`expand(id)\` returns a promise that resolves once the children are loaded and shown, \`highlightNode(id)\` one that resolves once the node is in view, and \`centerOnNode(id)\` one that resolves once the scroll starts. The methods don't fire events.
- **React:** \`onExpand(nodeId)\`, \`onCollapse(nodeId)\`, \`onCollapsedNodesChange(nodeIds)\`, \`onHighlightedNodeChange(nodeId)\`, \`onZoomChange(level)\` and the same methods on \`apiRef\`.`,
  },
  {
    id: "keyboard",
    title: "Keyboard",
    body: `Buttons and links in a chart's labels work as usual, in reading order: each node, its toggle button, then its children. **Tab** reaches the scroll area of a wide chart, and the arrow keys scroll it. With \`enableZoomPan\`, these keys work while the scroll area or a control in the chart has the focus:

- **+** or **=:** zooms in.
- **−:** zooms out.
- **0:** returns to 100%.

They don't apply in text fields, menus and other widgets with keys of their own, or with **Ctrl**, **Command** or **Alt**, which stay the browser's zoom.`,
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
- A click on a label is a shortcut for pointer users: keyboard users reach the toggle button with **Tab**.
- The hover highlight follows the keyboard focus too, so keyboard users see the same path. Faded nodes stay readable but drop below the text contrast minimum while the highlight lasts: set \`dimOpacity\` to 0 to keep full contrast, as the path's colors still show it.
- A node found by a search gets a ring and a colored path, and nothing fades. Announce the result in a \`role="status"\` element: the highlight itself is visual only.
- Zooming has keyboard and toolbar alternatives to the wheel, pinch and drag. The toolbar's level is an \`output\` element, so screen readers announce each new level politely. At a limit, the zoom in or zoom out button has \`aria-disabled="true"\` and keeps the focus.
- At every level, the browser scrolls the focused control into view inside the scroll area.
- Below 100%, buttons in the chart are smaller than the 24 by 24 pixel minimum target size. People choose that view themselves, as with the browser's zoom, and **0** or **Reset zoom** returns to full size. Start charts at 100%.
- Zoom steps are instant. \`centerOnNode\` and \`highlightNode\` scroll smoothly, unless the user prefers reduced motion.`,
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
  "node-lines": () => (
    <Preview>
      <OrganizationChart aria-label="Company" edgeColorMode="node" label="Maya Lindqvist, CEO">
        <OrganizationChartNode lineColor="primary" label="Jonah Pereira, design">
          <OrganizationChartNode label="Aiko Tanaka, design" />
        </OrganizationChartNode>
        <OrganizationChartNode lineColor="info" lineStyle="dashed" label="Priya Raman, development">
          <OrganizationChartNode label="Elias Novak, development" />
        </OrganizationChartNode>
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
  "group-leaves": () => (
    <Preview>
      <OrganizationChart aria-label="Design team" groupLeafNodes label="Jonah Pereira, design lead">
        <OrganizationChartNode label="Aiko Tanaka" />
        <OrganizationChartNode label="Oskar Berg" />
        <OrganizationChartNode label="Zara Okafor" />
      </OrganizationChart>
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
  highlight: () => (
    <Preview>
      <SearchChartDemo />
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
  zoom: () => (
    <Preview>
      <ZoomPreview />
    </Preview>
  ),
  options: () => (
    <>
      <OptionsTable schema={organizationChartOptions} />
      <OptionsTable schema={organizationChartNodeOptions} />
    </>
  ),
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
        {
          react: "highlightedNode",
          html: "data-ok-highlighted",
          type: "string | null",
          description:
            "The highlighted node: its nodeId on the chart in React, the attribute on the node in HTML. Set by highlightNode().",
        },
      ]}
    />
  ),
};

/** The zoom section's preview: the toolbar over a 320px scroll area. */
function ZoomPreview() {
  return (
    <div style={{ display: "grid", gap: 8, width: "100%" }}>
      <OrganizationChartToolbar chartId="docs-zoom-chart" />
      <Scrollbar aria-label="Zoomable company chart, scrollable" style={{ height: 320 }}>
        <OrganizationChart
          id="docs-zoom-chart"
          aria-label="Zoomable company"
          enableZoomPan
          label="Maya Lindqvist, CEO"
        >
          <OrganizationChartNode label="Jonah Pereira, design">
            <OrganizationChartNode label="Aiko Tanaka" />
          </OrganizationChartNode>
          <OrganizationChartNode label="Priya Raman, development">
            <OrganizationChartNode label="Elias Novak" />
            <OrganizationChartNode label="Noah Brennan" />
          </OrganizationChartNode>
          <OrganizationChartNode label="Leila Haddad, marketing" />
        </OrganizationChart>
      </Scrollbar>
    </div>
  );
}

/** Organization chart docs page (ADR-0019). */
export function OrganizationChartDocs() {
  return <GuideDocs sections={organizationChartSections} previews={PREVIEWS} />;
}
