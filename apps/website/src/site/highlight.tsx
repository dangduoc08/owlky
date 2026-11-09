import type { ReactNode } from "react";
import { createHighlighter, createJavaScriptRegexEngine, type Highlighter } from "shiki";
import type { CodeLanguage } from "../content/types.js";

/*
 * Code highlighting at build time (Shiki, server components only): the page ships colored
 * spans, never the highlighter. One dark theme for every page theme, like Storybook's code
 * blocks; every token color of `github-dark-default` reaches 4.5:1 on its background.
 */

const THEME = "github-dark-default";
const LANGUAGES: CodeLanguage[] = ["html", "tsx", "ts", "css", "bash"];

let highlighter: Promise<Highlighter> | undefined;
const load = () => {
  highlighter ??= createHighlighter({
    themes: [THEME],
    langs: LANGUAGES,
    engine: createJavaScriptRegexEngine(),
  });
  return highlighter;
};

/** A highlighted code block in a named, keyboard-reachable scroll region. */
export async function HighlightedCode({
  code,
  language,
  label,
}: {
  code: string;
  language: CodeLanguage;
  label: string;
}): Promise<ReactNode> {
  const { tokens, bg, fg } = (await load()).codeToTokens(code, { lang: language, theme: THEME });
  return (
    <section
      data-site-code={language}
      aria-label={label}
      // biome-ignore lint/a11y/noNoninteractiveTabindex: scrollable regions must be keyboard-reachable.
      tabIndex={0}
      style={{ backgroundColor: bg, color: fg }}
    >
      <pre>
        <code>
          {tokens.map((line, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: lines of a static block.
            <span key={index} data-line="">
              {line.map((token, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: tokens of a static line.
                <span key={i} style={{ color: token.color }}>
                  {token.content}
                </span>
              ))}
              {index < tokens.length - 1 ? "\n" : null}
            </span>
          ))}
        </code>
      </pre>
    </section>
  );
}
