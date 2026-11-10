import {
  Button,
  OrganizationChart,
  OrganizationChartNode,
  OrganizationChartToolbar,
  Scrollbar,
  useOrganizationChartApiRef,
} from "@owlky/react";
import { CEO, PEOPLE, type PersonNode } from "./organization-chart-data.js";
import { SimpleCard } from "./organization-chart-examples.js";

/** One person and, below them, their reports, with an id for centerOnNode and a toggle. */
function ZoomNode({ person }: { person: PersonNode }) {
  return (
    <OrganizationChartNode
      nodeId={person.id}
      toggleLabel={`${person.name}'s reports`}
      label={<SimpleCard person={person} />}
    >
      {person.children?.map((child) => (
        <ZoomNode key={child.id} person={child} />
      ))}
    </OrganizationChartNode>
  );
}

/**
 * Zoom and pan: the toolbar, Ctrl or Command with the wheel, a pinch, the + / − / 0 keys and a
 * mouse drag; a button centers a person (opening the collapsed branch above them).
 */
export function ZoomChartDemo() {
  const apiRef = useOrganizationChartApiRef();
  return (
    <div className="sb-org-demo">
      <div className="sb-org-actions">
        <OrganizationChartToolbar chartId="org-zoom" />
        <Button
          id="org-zoom-center"
          variant="outlined"
          onClick={() => apiRef.current?.centerOnNode("tomas")}
        >
          Center on Tomás Rivera
        </Button>
      </div>
      <Scrollbar className="sb-org-scroll sb-org-viewport" aria-label="Zoomable chart, scrollable">
        <OrganizationChart
          id="org-zoom"
          aria-label="Zoomable organization chart"
          apiRef={apiRef}
          enableZoomPan
          enableExpandCollapse
          defaultCollapsedNodes={["sofia"]}
          toggleLabel={`${CEO.name}'s reports`}
          lineColor="primary"
          lineHeight={20}
          nodeId={CEO.id}
          label={<SimpleCard person={CEO} />}
        >
          {PEOPLE.map((person) => (
            <ZoomNode key={person.id} person={person} />
          ))}
        </OrganizationChart>
      </Scrollbar>
    </div>
  );
}
