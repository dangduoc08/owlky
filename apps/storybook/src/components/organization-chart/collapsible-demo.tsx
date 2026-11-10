import {
  Button,
  OrganizationChart,
  OrganizationChartNode,
  Scrollbar,
  useOrganizationChartApiRef,
} from "@owlky/react";
import { CEO, PEOPLE, type PersonNode } from "./organization-chart-data.js";
import { SimpleCard } from "./organization-chart-examples.js";

/** One person and, below them, their reports; the toggle is named after the person. */
function PersonNodeItem({ person }: { person: PersonNode }) {
  return (
    <OrganizationChartNode
      nodeId={person.id}
      toggleLabel={`${person.name}'s reports`}
      label={<SimpleCard person={person} />}
    >
      {person.children?.map((child) => (
        <PersonNodeItem key={child.id} person={child} />
      ))}
    </OrganizationChartNode>
  );
}

/** Collapsible nodes: a toggle per branch, a click on a card toggles it too, and the methods. */
export function CollapsibleChartDemo() {
  const apiRef = useOrganizationChartApiRef();
  return (
    <div className="sb-org-demo">
      <div className="sb-org-actions">
        <Button id="org-expand-all" variant="outlined" onClick={() => apiRef.current?.expandAll()}>
          Expand all
        </Button>
        <Button
          id="org-collapse-all"
          variant="outlined"
          onClick={() => apiRef.current?.collapseAll()}
        >
          Collapse all
        </Button>
        <Button
          id="org-expand-depth"
          variant="outlined"
          onClick={() => apiRef.current?.expandToDepth(1)}
        >
          Show the leads only
        </Button>
      </div>
      <Scrollbar className="sb-org-scroll" aria-label="Collapsible organization chart, scrollable">
        <OrganizationChart
          id="org-collapsible"
          aria-label="Collapsible organization chart"
          apiRef={apiRef}
          enableExpandCollapse
          expandCollapseOnNodeClick
          defaultCollapsedNodes={["elias"]}
          lineColor="primary"
          lineHeight={20}
          nodeId={CEO.id}
          toggleLabel={`${CEO.name}'s reports`}
          label={<SimpleCard person={CEO} />}
        >
          {PEOPLE.map((person) => (
            <PersonNodeItem key={person.id} person={person} />
          ))}
        </OrganizationChart>
      </Scrollbar>
    </div>
  );
}
