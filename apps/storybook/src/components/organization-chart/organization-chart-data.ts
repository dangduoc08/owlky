/*
 * Demo data of the Organization chart stories: invented people with the story avatars
 * (`public/avatars/`). Plain data, so the snippet generator can import it.
 */

export interface Person {
  id: string;
  name: string;
  role: string;
  avatar: string;
}

export interface PersonNode extends Person {
  children?: PersonNode[];
}

export type TeamColor = "primary" | "info" | "warning";

export interface Team {
  id: string;
  name: string;
  color: TeamColor;
  members: PersonNode[];
}

const avatar = (n: number) => `avatars/avatar-${n}.svg`;

export const CEO: Person = {
  id: "maya",
  name: "Maya Lindqvist",
  role: "CEO, Co-founder",
  avatar: avatar(1),
};

const design: PersonNode = {
  id: "jonah",
  name: "Jonah Pereira",
  role: "Lead",
  avatar: avatar(2),
  children: [{ id: "aiko", name: "Aiko Tanaka", role: "Senior", avatar: avatar(3) }],
};

const development: PersonNode = {
  id: "priya",
  name: "Priya Raman",
  role: "Lead",
  avatar: avatar(4),
  children: [
    {
      id: "elias",
      name: "Elias Novak",
      role: "Senior",
      avatar: avatar(5),
      children: [
        {
          id: "sofia",
          name: "Sofia Marchetti",
          role: "Back end developer",
          avatar: avatar(6),
          children: [
            { id: "tomas", name: "Tomás Rivera", role: "Back end developer", avatar: avatar(7) },
          ],
        },
        { id: "noah", name: "Noah Brennan", role: "Front end", avatar: avatar(1) },
      ],
    },
  ],
};

const marketing: PersonNode = {
  id: "leila",
  name: "Leila Haddad",
  role: "Lead",
  avatar: avatar(3),
  children: [
    { id: "oskar", name: "Oskar Berg", role: "Support", avatar: avatar(2) },
    { id: "zara", name: "Zara Okafor", role: "Content writer", avatar: avatar(6) },
  ],
};

/** The company: the CEO and three leads with their reports. */
export const PEOPLE: PersonNode[] = [design, development, marketing];

/** The same people by team (Group story). */
export const TEAMS: Team[] = [
  { id: "design", name: "Product design", color: "primary", members: [design] },
  { id: "development", name: "Development", color: "info", members: [development] },
  { id: "marketing", name: "Marketing", color: "warning", members: [marketing] },
];

/** A product team whose two leads only have reports without reports (Grouped leaves story). */
export const PRODUCT: PersonNode = {
  id: "ines",
  name: "Ines Duarte",
  role: "Head of product",
  avatar: avatar(5),
  children: [
    {
      id: "jonah",
      name: "Jonah Pereira",
      role: "Design lead",
      avatar: avatar(2),
      children: [
        { id: "aiko", name: "Aiko Tanaka", role: "Senior", avatar: avatar(3) },
        { id: "oskar", name: "Oskar Berg", role: "Researcher", avatar: avatar(2) },
        { id: "zara", name: "Zara Okafor", role: "Writer", avatar: avatar(6) },
      ],
    },
    {
      id: "priya",
      name: "Priya Raman",
      role: "Development lead",
      avatar: avatar(4),
      children: [
        { id: "elias", name: "Elias Novak", role: "Senior", avatar: avatar(5) },
        { id: "sofia", name: "Sofia Marchetti", role: "Back end", avatar: avatar(6) },
        { id: "tomas", name: "Tomás Rivera", role: "Back end", avatar: avatar(7) },
        { id: "noah", name: "Noah Brennan", role: "Front end", avatar: avatar(1) },
      ],
    },
  ],
};

/** Number of people in a list of nodes, at every depth. */
export const headcount = (nodes: PersonNode[]): number =>
  nodes.reduce((total, node) => total + 1 + headcount(node.children ?? []), 0);
