import {
  Breadcrumbs,
  Link,
  OrganizationChart,
  Scrollbar,
  Typography,
  useOrganizationChartApiRef,
} from "@owlky/react";
import { useState } from "react";
import { PersonNodeItem } from "./collapsible-demo.js";
import { CEO, nameOf, PEOPLE, pathOf } from "./organization-chart-data.js";
import { SimpleCard } from "./organization-chart-examples.js";

/**
 * Keyboard and lineage breadcrumb: one tab stop, the arrow keys walk the chart, Space selects
 * the focused person (single selection). A Breadcrumbs above the chart shows the path from the
 * CEO to the selected person; its buttons select a manager and center the chart on them.
 */
export function BreadcrumbChartDemo() {
  const apiRef = useOrganizationChartApiRef();
  const [selected, setSelected] = useState<string[]>(["sofia"]);
  const [current] = selected;
  // The same ids as apiRef.current.getNodePath(current), known before the chart renders.
  const path = current ? pathOf(current) : [];
  const pick = (id: string) => {
    setSelected([id]);
    void apiRef.current?.centerOnNode(id);
  };
  return (
    <div className="sb-org-demo">
      <Breadcrumbs id="org-breadcrumb-trail" aria-label="Path to the selected person">
        {path.length ? (
          path.map((id, index) =>
            index < path.length - 1 ? (
              <Link key={id} value={id} color="inherit" underline="hover" onClick={() => pick(id)}>
                {nameOf(id)}
              </Link>
            ) : (
              <span key={id} aria-current="location">
                {nameOf(id)}
              </span>
            ),
          )
        ) : (
          <span>No one is selected.</span>
        )}
      </Breadcrumbs>
      <Typography variant="body2" color="textSecondary">
        Tab into the chart, then use the arrow keys. Space selects the focused person.
      </Typography>
      <Scrollbar
        className="sb-org-scroll"
        aria-label="Organization chart with a breadcrumb, scrollable"
      >
        <OrganizationChart
          id="org-breadcrumb"
          aria-label="Organization chart with a breadcrumb"
          apiRef={apiRef}
          enableSelection="single"
          enableExpandCollapse
          highlightOnHover
          selectedNodes={selected}
          onSelectionChange={setSelected}
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
