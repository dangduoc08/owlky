import {
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  OrganizationChart,
  OrganizationChartNode,
  Scrollbar,
} from "@owlky/react";
import { useState } from "react";
import { DemoIcon } from "../shared/demo-icon.js";
import { CEO, PEOPLE, type Person, type PersonNode } from "./organization-chart-data.js";

interface Actions {
  /** The person whose menu is open, and the button it hangs from. */
  open: { id: string; anchor: HTMLElement } | null;
  setOpen: (open: { id: string; anchor: HTMLElement } | null) => void;
}

/** A card with the person's avatar, name and role, and a menu of actions. */
function PersonCard({ person, open, setOpen }: { person: Person } & Actions) {
  const button = `org-standard-${person.id}-button`;
  const menu = `org-standard-${person.id}-menu`;
  const isOpen = open?.id === person.id;
  return (
    <div className="sb-org-card">
      <IconButton
        id={button}
        className="sb-org-more"
        aria-label={`Actions for ${person.name}`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menu}
        onClick={(event) => setOpen(isOpen ? null : { id: person.id, anchor: event.currentTarget })}
      >
        <DemoIcon name="moreHorizontal" />
      </IconButton>
      <Avatar src={person.avatar} alt="" size={48} />
      <span className="sb-org-name">{person.name}</span>
      <span className="sb-org-role">{person.role}</span>
      <Menu
        id={menu}
        aria-labelledby={button}
        placement="bottom-end"
        open={isOpen}
        anchorEl={isOpen ? open.anchor : null}
        onOpenChange={() => setOpen(null)}
      >
        <MenuItem>
          <DemoIcon name="trash" />
          Delete
        </MenuItem>
        <MenuItem>
          <DemoIcon name="pen" />
          Edit
        </MenuItem>
      </Menu>
    </div>
  );
}

function PersonNodes({ people, ...actions }: { people: PersonNode[] } & Actions) {
  return people.map((person) => (
    <OrganizationChartNode key={person.id} label={<PersonCard person={person} {...actions} />}>
      {person.children && <PersonNodes people={person.children} {...actions} />}
    </OrganizationChartNode>
  ));
}

/** Standard: cards with an avatar and an actions menu, in a horizontal scroll area. */
export function StandardChartDemo() {
  const [open, setOpen] = useState<Actions["open"]>(null);
  return (
    <Scrollbar className="sb-org-scroll" aria-label="Standard organization chart, scrollable">
      <OrganizationChart
        aria-label="Standard organization chart"
        label={<PersonCard person={CEO} open={open} setOpen={setOpen} />}
      >
        <PersonNodes people={PEOPLE} open={open} setOpen={setOpen} />
      </OrganizationChart>
    </Scrollbar>
  );
}
