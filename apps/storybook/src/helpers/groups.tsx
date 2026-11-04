import type { StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";

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

export interface HtmlGroup {
  title: string;
  /** A canonical snippet from @minimal-tailwind/html, rendered exactly as users paste it. */
  html: string;
}

/** HTML story: the same groups, each row filled with a canonical snippet. */
export function htmlGroupsStory(groups: HtmlGroup[]): StoryObj {
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
          code: groups.map((group) => `<!-- ${group.title} -->\n${group.html.trim()}`).join("\n\n"),
        },
      },
    },
  };
}
