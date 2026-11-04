import type { StoryObj } from "@storybook/react-vite";

/**
 * Renders a canonical HTML snippet from @owlky/html exactly as a user would paste it.
 * The HTML runtime (started in preview.tsx) mounts its components automatically via
 * MutationObserver — the story never calls any JavaScript, just like a static page.
 */
function HtmlSnippet({ html }: { html: string }) {
  // biome-ignore lint/security/noDangerouslySetInnerHtml: trusted, repository-owned snippet files.
  return <div className="sb-row" dangerouslySetInnerHTML={{ __html: html }} />;
}

export function htmlStory(html: string, description?: string): StoryObj {
  return {
    render: () => <HtmlSnippet html={html} />,
    parameters: {
      docs: {
        source: { code: html.trim(), language: "html" },
        ...(description ? { description: { story: description } } : {}),
      },
    },
  };
}
