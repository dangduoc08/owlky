import { Button, OrganizationChart, Scrollbar, Typography } from "@owlky/react";
import { useState } from "react";
import { PersonNodeItem } from "./collapsible-demo.js";
import { CEO, nameOf, PEOPLE } from "./organization-chart-data.js";
import { SimpleCard } from "./organization-chart-examples.js";

/** The leads: the "Select the leads" button's selection. */
const LEADS = PEOPLE.map((person) => person.id);

/**
 * Selection (multi): a click on a card or Space on a focused node selects or deselects it; the
 * arrow keys move between nodes. The buttons set and clear the selection, and a polite status
 * line names the selected people.
 */
export function SelectionChartDemo() {
  const [selected, setSelected] = useState<string[]>(["priya"]);
  return (
    <div className="sb-org-demo">
      <div className="sb-org-actions">
        <Button id="org-select-leads" variant="outlined" onClick={() => setSelected(LEADS)}>
          Select the leads
        </Button>
        <Button id="org-select-clear" variant="outlined" onClick={() => setSelected([])}>
          Clear selection
        </Button>
      </div>
      <Typography id="org-selection-status" role="status" variant="body2" color="textSecondary">
        {selected.length ? `Selected: ${selected.map(nameOf).join(", ")}` : "No one is selected."}
      </Typography>
      <Scrollbar className="sb-org-scroll" aria-label="Selectable organization chart, scrollable">
        <OrganizationChart
          id="org-selection"
          aria-label="Selectable organization chart"
          enableSelection="multi"
          enableExpandCollapse
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
