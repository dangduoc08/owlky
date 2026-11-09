import type { MarkdownHighlighter } from "@owlky/core/markdown";
import { act, render, screen } from "@testing-library/react";
import { type ComponentProps, StrictMode } from "react";
import { renderToStaticMarkup, renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { expectNoAxeViolations } from "../test-utils.js";
import { type ExtraProps, Markdown, MarkdownAsync, markdownSanitizeSchema } from "./markdown.js";
import { MarkdownHooks } from "./markdown-hooks.js";

const DOCUMENT = `# Title

Some **bold** and *em* text with \`code\` and [a link](https://example.com).

- [x] Done
- [ ] Todo

| Name | Count |
| :-- | --: |
| Apples | 3 |

\`\`\`js
return 1
\`\`\`

![A cover](cover.svg)

> A quote with ~~strike~~.

---

Note[^1]

[^1]: The note.
`;

const highlighter: MarkdownHighlighter = {
  registered: (language) => language === "js",
  highlight: (_language, value) => ({
    type: "root",
    children: [
      {
        type: "element",
        tagName: "span",
        properties: { className: ["hljs-keyword"] },
        children: [{ type: "text", value }],
      },
    ],
  }),
};

const root = (container: HTMLElement) =>
  container.querySelector("[data-ok-markdown]") as HTMLElement;

afterEach(() => vi.restoreAllMocks());

/** A replacement link that records the hast node it receives. */
const seen: string[] = [];
function Link({ node, children, ...props }: ComponentProps<"a"> & ExtraProps) {
  seen.push(node?.tagName ?? "");
  return (
    <a {...props} data-custom="">
      {children}
    </a>
  );
}

describe("Markdown", () => {
  it("renders GitHub Flavored Markdown as elements on a data-ok-markdown root", () => {
    const { container } = render(<Markdown highlighter={highlighter}>{DOCUMENT}</Markdown>);
    const element = root(container);
    expect(element.getAttribute("data-ok-runtime")).toBe("off");
    expect(screen.getByRole("heading", { level: 1, name: "Title" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "a link" }).getAttribute("href")).toBe(
      "https://example.com",
    );
    const boxes = screen.getAllByRole("checkbox") as HTMLInputElement[];
    expect(boxes.map((box) => [box.checked, box.disabled])).toEqual([
      [true, true],
      [false, true],
    ]);
    // The checked state is markup too (same DOM as HTML).
    expect(boxes[0]?.hasAttribute("checked")).toBe(true);
    expect(screen.getByRole("table")).toBeTruthy();
    expect(screen.getByRole("cell", { name: "3" }).style.textAlign).toBe("right");
    expect(element.querySelector("pre code.hljs.language-js .hljs-keyword")?.textContent).toBe(
      "return 1\n",
    );
    expect(screen.getByRole("img", { name: "A cover" }).getAttribute("src")).toBe("cover.svg");
    expect(element.querySelector("blockquote del")?.textContent).toBe("strike");
    expect(element.querySelector("[data-footnote-ref]")?.getAttribute("data-footnote-ref")).toBe(
      "",
    );
    expect(element.querySelector("h2.sr-only")?.textContent).toBe("Footnotes");
  });

  it("passes root props and refs to the div, and writes the option attributes", () => {
    const ref = { current: null as HTMLDivElement | null };
    const { container } = render(
      <Markdown
        ref={ref}
        id="doc"
        className="prose"
        aria-label="Notes"
        rawHtml
        skipHtml
        unwrapDisallowed
        externalLinks
        gfm={false}
        allowedElements={["p", "a"]}
      >
        text
      </Markdown>,
    );
    const element = root(container);
    expect(ref.current).toBe(element);
    expect(element.id).toBe("doc");
    expect(element.className).toBe("prose");
    for (const name of [
      "data-ok-raw-html",
      "data-ok-skip-html",
      "data-ok-unwrap-disallowed",
      "data-ok-external-links",
    ])
      expect(element.getAttribute(name)).toBe("");
    expect(element.getAttribute("data-ok-gfm")).toBe("false");
    expect(element.getAttribute("data-ok-allowed-elements")).toBe("p a");
    const other = render(<Markdown disallowedElements={["img", "hr"]}>x</Markdown>);
    expect(root(other.container).getAttribute("data-ok-disallowed-elements")).toBe("img hr");
    expect(root(other.container).hasAttribute("data-ok-gfm")).toBe(false);
  });

  it("shows raw HTML as text by default, sanitizes it with rawHtml, drops it with skipHtml", () => {
    const source = 'Hi <b onclick="alert(1)">there</b> <img src=x onerror="alert(1)">';
    const text = render(<Markdown>{source}</Markdown>);
    expect(root(text.container).textContent).toBe(source);
    expect(root(text.container).querySelector("b")).toBeNull();
    const raw = render(<Markdown rawHtml>{source}</Markdown>);
    const b = root(raw.container).querySelector("b") as HTMLElement;
    expect(b.textContent).toBe("there");
    expect(b.getAttribute("onclick")).toBeNull();
    expect(root(raw.container).querySelector("img")?.getAttribute("onerror")).toBeNull();
    const skipped = render(<Markdown skipHtml>{source}</Markdown>);
    expect(root(skipped.container).textContent).toBe("Hi there ");
  });

  it("keeps text-align / text-transform from raw HTML as style properties", () => {
    const { container } = render(
      <Markdown rawHtml>
        {
          '<p style="text-align: center; color: red">a <span style="text-transform: uppercase">b</span></p>'
        }
      </Markdown>,
    );
    const p = root(container).querySelector("p") as HTMLElement;
    expect(p.style.textAlign).toBe("center");
    expect(p.style.color).toBe("");
    expect((p.querySelector("span") as HTMLElement).style.textTransform).toBe("uppercase");
  });

  it("neutralizes javascript: URLs by default and applies urlTransform", () => {
    const evil = render(
      <Markdown>{"[x](javascript:alert(1)) ![y](data:image/png;base64,AA)"}</Markdown>,
    );
    expect(root(evil.container).querySelector("a")?.hasAttribute("href")).toBe(false);
    expect(root(evil.container).querySelector("img")?.hasAttribute("src")).toBe(false);
    const custom = render(
      <Markdown urlTransform={(url, key) => (key === "href" ? `/out?${url}` : null)}>
        {"[x](https://a.b) ![y](z.png)"}
      </Markdown>,
    );
    expect(root(custom.container).querySelector("a")?.getAttribute("href")).toBe(
      "/out?https://a.b",
    );
    expect(root(custom.container).querySelector("img")?.hasAttribute("src")).toBe(false);
  });

  it("opens external links in a new tab with externalLinks", () => {
    const { container } = render(
      <Markdown externalLinks>{"[out](https://a.b) [in](/docs)"}</Markdown>,
    );
    const [out, inside] = root(container).querySelectorAll("a");
    expect(out?.getAttribute("target")).toBe("_blank");
    expect(out?.getAttribute("rel")).toBe("noopener noreferrer");
    expect(inside?.hasAttribute("target")).toBe(false);
  });

  it("filters elements: allowedElements, disallowedElements, unwrapDisallowed, allowElement", () => {
    const allowed = render(<Markdown allowedElements={["p"]}>{"# T\n\n*a* b"}</Markdown>);
    expect(root(allowed.container).innerHTML.trim()).toBe("<p> b</p>");
    const unwrapped = render(
      <Markdown disallowedElements={["em"]} unwrapDisallowed>
        {"*a* b"}
      </Markdown>,
    );
    expect(root(unwrapped.container).innerHTML.trim()).toBe("<p>a b</p>");
    const decided = render(
      <Markdown allowElement={(element) => element.tagName !== "strong"}>{"**a** b"}</Markdown>,
    );
    expect(root(decided.container).innerHTML.trim()).toBe("<p> b</p>");
  });

  it("replaces elements with components (receiving node) or other tag names", () => {
    seen.length = 0;
    const { container } = render(
      <Markdown components={{ a: Link, h1: "h2" }}>{"# Title\n\n[x](/y)"}</Markdown>,
    );
    expect(root(container).querySelector("h2")?.textContent).toBe("Title");
    expect(root(container).querySelector("h2")?.hasAttribute("node")).toBe(false);
    expect(root(container).querySelector("a[data-custom]")?.getAttribute("href")).toBe("/y");
    expect(seen).toEqual(["a"]);
  });

  it("runs plugins and passes remarkRehypeOptions", () => {
    const mark =
      () => (tree: { children: { type: string; properties?: Record<string, unknown> }[] }) => {
        for (const child of tree.children)
          if (child.type === "element" && child.properties) child.properties["dataMark"] = "1";
      };
    const { container } = render(
      <Markdown
        rehypePlugins={[mark]}
        remarkPlugins={[]}
        remarkRehypeOptions={{ footnoteLabel: "Notes" }}
        sanitizeSchema={markdownSanitizeSchema}
      >
        {"p[^1]\n\n[^1]: n"}
      </Markdown>,
    );
    expect(root(container).querySelector("p")?.getAttribute("data-mark")).toBe("1");
    expect(root(container).querySelector("h2")?.textContent).toBe("Notes");
  });

  it("renders SVG and form values from plugins without React warnings", () => {
    const error = vi.spyOn(console, "error");
    const add = () => (tree: { children: unknown[] }) => {
      tree.children.push(
        {
          type: "element",
          tagName: "svg",
          properties: { viewBox: "0 0 1 1", ariaHidden: "true" },
          children: [
            { type: "element", tagName: "path", properties: { strokeWidth: 2 }, children: [] },
          ],
        },
        {
          type: "element",
          tagName: "input",
          properties: { type: "text", value: "v" },
          children: [],
        },
        {
          type: "element",
          tagName: "div",
          properties: { style: "--gap: 2px; text-align: left" },
          children: [],
        },
      );
    };
    const { container } = render(<Markdown rehypePlugins={[add]}>x</Markdown>);
    const svg = root(container).querySelector("svg") as SVGSVGElement;
    expect(svg.namespaceURI).toBe("http://www.w3.org/2000/svg");
    expect(svg.getAttribute("viewBox")).toBe("0 0 1 1");
    expect(svg.querySelector("path")?.getAttribute("stroke-width")).toBe("2");
    expect((root(container).querySelector("input") as HTMLInputElement).value).toBe("v");
    const div = root(container).querySelector("div") as HTMLElement;
    expect(div.style.getPropertyValue("--gap")).toBe("2px");
    expect(div.style.textAlign).toBe("left");
    expect(error).not.toHaveBeenCalled();
  });

  it("renders the same markup on the server (SSR) and in StrictMode", () => {
    const markup = renderToString(<Markdown>{DOCUMENT}</Markdown>);
    expect(markup).toContain("data-ok-markdown");
    const { container } = render(
      <StrictMode>
        <Markdown>{DOCUMENT}</Markdown>
      </StrictMode>,
    );
    const host = document.createElement("div");
    host.innerHTML = renderToStaticMarkup(<Markdown>{DOCUMENT}</Markdown>);
    // Same nodes and attributes (order and style serialization aside).
    for (const element of [root(container), root(host)])
      for (const styled of element.querySelectorAll("[style]")) {
        styled.setAttribute("data-style", (styled as HTMLElement).style.cssText);
        styled.removeAttribute("style");
      }
    const normalize = (node: Node): string =>
      node instanceof Element
        ? `<${node.tagName} ${[...node.attributes]
            .map((a) => `${a.name}=${a.value}`)
            .sort()
            .join(" ")}>${[...node.childNodes].map(normalize).join("")}</>`
        : (node.textContent ?? "");
    expect(normalize(root(container))).toBe(normalize(root(host)));
  });

  it("renders nothing for empty or missing children", () => {
    const { container } = render(<Markdown />);
    expect(root(container).childNodes).toHaveLength(0);
  });

  it("has no axe violations (S11 n/a, WCAG 2.2 AA)", async () => {
    const { container } = render(
      <Markdown rawHtml externalLinks highlighter={highlighter}>
        {DOCUMENT}
      </Markdown>,
    );
    await expectNoAxeViolations(container);
  });
});

describe("MarkdownAsync", () => {
  it("resolves to the same element with asynchronous plugins", async () => {
    const later = () => async () => {
      await Promise.resolve();
    };
    const element = await MarkdownAsync({ children: "# Hi", rehypePlugins: [later], id: "a" });
    const { container } = render(element);
    expect(root(container).id).toBe("a");
    expect(root(container).querySelector("h1")?.textContent).toBe("Hi");
  });
});

describe("MarkdownHooks", () => {
  it("shows the fallback, then the content; follows new children", async () => {
    const later = () => async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    };
    const plugins = [later];
    const { container, rerender } = render(
      <MarkdownHooks fallback={<span>Loading</span>} rehypePlugins={plugins}>
        {"# One"}
      </MarkdownHooks>,
    );
    expect(root(container).textContent).toBe("Loading");
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
    expect(root(container).querySelector("h1")?.textContent).toBe("One");
    rerender(
      <MarkdownHooks fallback={<span>Loading</span>} rehypePlugins={plugins}>
        {"# Two"}
      </MarkdownHooks>,
    );
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
    expect(root(container).querySelector("h1")?.textContent).toBe("Two");
  });

  it("reports failures through onError and ignores results after unmount", async () => {
    const onError = vi.fn();
    render(
      <MarkdownHooks allowedElements={["p"]} disallowedElements={["a"]} onError={onError}>
        x
      </MarkdownHooks>,
    );
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
    expect(onError).toHaveBeenCalledWith(expect.any(TypeError));
    const quiet = vi.fn();
    const { unmount } = render(
      <MarkdownHooks allowedElements={["p"]} disallowedElements={["a"]} onError={quiet}>
        x
      </MarkdownHooks>,
    );
    const late = render(<MarkdownHooks>y</MarkdownHooks>);
    unmount();
    late.unmount();
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
    expect(quiet).not.toHaveBeenCalled();
    // Without onError a failure is ignored.
    render(
      <MarkdownHooks allowedElements={["p"]} disallowedElements={["a"]}>
        x
      </MarkdownHooks>,
    );
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
  });
});
