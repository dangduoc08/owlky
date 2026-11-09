import {
  Avatar,
  Card,
  IconButton,
  Label,
  Menu,
  MenuItem,
  OrganizationChart,
  OrganizationChartNode,
  Paper,
  Scrollbar,
  Typography,
} from "@owlky/react";
import { type ReactNode, useState } from "react";
import { DemoIcon } from "../shared/demo-icon.js";
import {
  CEO,
  headcount,
  type Person,
  type PersonNode,
  TEAMS,
  type TeamColor,
} from "./organization-chart-data.js";

interface Actions {
  /** The card whose menu is open, and the button it hangs from. */
  open: { id: string; anchor: HTMLElement } | null;
  setOpen: (open: { id: string; anchor: HTMLElement } | null) => void;
}

/** The "more" button and its menu of actions. */
function CardActions({ id, name, open, setOpen }: { id: string; name: string } & Actions) {
  const button = `org-group-${id}-button`;
  const menu = `org-group-${id}-menu`;
  const isOpen = open?.id === id;
  return (
    <>
      <IconButton
        id={button}
        className="sb-org-more"
        aria-label={`Actions for ${name}`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menu}
        onClick={(event) => setOpen(isOpen ? null : { id, anchor: event.currentTarget })}
      >
        <DemoIcon name="moreHorizontal" />
      </IconButton>
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
    </>
  );
}

/** A person: the avatar over the card's top edge, in the team's color (none for the CEO). */
function MemberCard({
  person,
  color,
  actions,
}: {
  person: Person;
  color?: TeamColor;
  actions: ReactNode;
}) {
  return (
    <Card className={color ? `sb-org-member sb-org-${color}` : "sb-org-member"}>
      <Avatar src={person.avatar} alt="" size={48} />
      {actions}
      <Typography className="sb-org-name" variant="subtitle2" component="span" noWrap>
        {person.name}
      </Typography>
      <Typography className="sb-org-role" variant="caption" color="textSecondary" noWrap>
        {person.role}
      </Typography>
    </Card>
  );
}

function MemberNodes({
  people,
  color,
  ...actions
}: { people: PersonNode[]; color: TeamColor } & Actions) {
  return people.map((person) => (
    <OrganizationChartNode
      key={person.id}
      label={
        <MemberCard
          person={person}
          color={color}
          actions={<CardActions id={person.id} name={person.name} {...actions} />}
        />
      }
    >
      {person.children && <MemberNodes people={person.children} color={color} {...actions} />}
    </OrganizationChartNode>
  ));
}

/** Group: people by team, each team a colored card with its headcount. */
export function GroupChartDemo() {
  const [open, setOpen] = useState<Actions["open"]>(null);
  const actions = { open, setOpen };
  return (
    <Scrollbar className="sb-org-scroll" aria-label="Organization chart by team, scrollable">
      <OrganizationChart
        aria-label="Organization chart by team"
        lineHeight={64}
        label={
          <MemberCard
            person={CEO}
            actions={
              <IconButton className="sb-org-more" aria-label={`Actions for ${CEO.name}`} disabled>
                <DemoIcon name="moreHorizontal" />
              </IconButton>
            }
          />
        }
      >
        {TEAMS.map((team) => (
          <OrganizationChartNode
            key={team.id}
            label={
              <Paper className={`sb-org-team sb-org-${team.color}`} elevation={0}>
                <Typography variant="subtitle1" component="span" noWrap>
                  {team.name}
                </Typography>
                <Label color={team.color}>{headcount(team.members)}</Label>
                <CardActions id={team.id} name={team.name} {...actions} />
              </Paper>
            }
          >
            <MemberNodes people={team.members} color={team.color} {...actions} />
          </OrganizationChartNode>
        ))}
      </OrganizationChart>
    </Scrollbar>
  );
}
