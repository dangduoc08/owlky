import type { StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";
import { jsxSource } from "./jsx-source.js";

/*
 * Story layout shared by React and HTML stories, so both render identical DOM (parity tests):
 * titled groups, each a wrapping row of examples.
 */

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="sb-group">
      <h3 className="sb-group-title">{title}</h3>
      {children}
    </section>
  );
}

export interface ReactGroup {
  title: string;
  content: ReactNode;
}

/** React story body: titled groups of examples. */
export function Groups({ groups }: { groups: ReactGroup[] }) {
  return (
    <div className="sb-groups">
      {groups.map((group) => (
        <Group key={group.title} title={group.title}>
          <div className="sb-row">{group.content}</div>
        </Group>
      ))}
    </div>
  );
}

/** React story: the groups plus their JSX (with imports) in the Code panel. */
export function reactGroupsStory(groups: ReactGroup[]): StoryObj {
  return {
    render: () => <Groups groups={groups} />,
    parameters: { docs: { source: { language: "tsx", code: jsxSource(groups) } } },
  };
}

export interface HtmlGroup {
  title: string;
  /** A canonical snippet from @minimal-tailwind/html, rendered exactly as users paste it. */
  html: string;
}

/**
 * HTML story: the same groups, each row filled with a canonical snippet. `setup` (what to load:
 * CSS, runtime) heads the code shown in the Code panel.
 */
export function htmlGroupsStory(groups: HtmlGroup[], setup = ""): StoryObj {
  return {
    render: () => (
      <div className="sb-groups">
        {groups.map((group) => (
          <Group key={group.title} title={group.title}>
            {/* biome-ignore lint/security/noDangerouslySetInnerHtml: trusted, repository-owned snippet files. */}
            <div className="sb-row" dangerouslySetInnerHTML={{ __html: group.html }} />
          </Group>
        ))}
      </div>
    ),
    parameters: {
      docs: {
        source: {
          language: "html",
          code: [
            setup.trim(),
            ...groups.map((group) => `<!-- ${group.title} -->\n${group.html.trim()}`),
          ]
            .filter(Boolean)
            .join("\n\n"),
        },
      },
    },
  };
}
