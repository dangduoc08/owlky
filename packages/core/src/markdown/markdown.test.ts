import type { Element, Root, RootContent } from "hast";
import { describe, expect, it } from "vitest";
import { markdownAttributes, markdownOptions } from "../anatomy/anatomy.js";
import {
  childSpace,
  defaultUrlTransform,
  isExternalUrl,
  type MarkdownHighlighter,
  type MarkdownProcessOptions,
  markdownElementAttributes,
  markdownElementStyle,
  markdownSanitizeSchema,
  markdownTree,
  markdownTreeAsync,
  parseStyle,
} from "./index.js";

/** A compact view of a tree: `tag[attr=value]{style}(children)` and text. */
function show(node: Root | Element): string {
  return node.children
    .map((child: RootContent) => {
      if (child.type === "text")
        return /^\n*$/.test(child.value) ? "" : JSON.stringify(child.value);
      if (child.type !== "element") return `<${child.type}>`;
      const attributes = markdownElementAttributes(child)
        .map(({ name, value }) => (value === true ? name : `${name}=${value}`))
        .join(" ");
      const style = markdownElementStyle(child)
        .map(([p, v]) => `${p}:${v}`)
        .join(";");
      return `${child.tagName}${attributes ? `[${attributes}]` : ""}${style ? `{${style}}` : ""}(${show(child)})`;
    })
    .filter(Boolean)
    .join(" ");
}
const render = (source: string, options: MarkdownProcessOptions = {}) =>
  show(markdownTree(source, options));

/** Every element of a tree. */
function* elements(node: Root | Element): Generator<Element> {
  for (const child of node.children)
    if (child.type === "element") {
      yield child;
      yield* elements(child);
    }
}
const allAttributes = (source: string, options: MarkdownProcessOptions = {}) =>
  [...elements(markdownTree(source, options))].flatMap((element) =>
    markdownElementAttributes(element).map((a) => `${element.tagName} ${a.name}=${a.value}`),
  );

/** A tiny lowlight-like highlighter: wraps `return` in a keyword span. */
const highlighter: MarkdownHighlighter = {
  registered: (language) => language === "js",
  highlight: (_language, value) => ({
    type: "root",
    children: value.split(/(return)/).map((part) =>
      part === "return"
        ? {
            type: "element",
            tagName: "span",
            properties: { className: ["hljs-keyword"] },
            children: [{ type: "text", value: part }],
          }
        : { type: "text", value: part },
    ),
  }),
};

describe("anatomy", () => {
  it("writes the root marker and every flag that is on", () => {
    expect(markdownAttributes()).toEqual({ "data-ok-markdown": "" });
    expect(
      markdownAttributes({
        rawHtml: true,
        skipHtml: true,
        unwrapDisallowed: true,
        externalLinks: true,
      }),
    ).toEqual({
      "data-ok-markdown": "",
      "data-ok-raw-html": "",
      "data-ok-skip-html": "",
      "data-ok-unwrap-disallowed": "",
      "data-ok-external-links": "",
    });
    expect(markdownOptions.options.gfm.default).toBe(true);
  });
});

describe("markdownTree", () => {
  it("renders CommonMark blocks and inline marks", () => {
    expect(render("# One\n\nSome **bold**, *em* and `code`.\n\n> quote\n\n---")).toBe(
      'h1("One") p("Some " strong("bold") ", " em("em") " and " code("code") ".") blockquote(p("quote")) hr()',
    );
  });

  it("renders GitHub Flavored Markdown: task lists, tables, strikethrough, autolinks", () => {
    expect(render("- [x] done\n- [ ] todo")).toBe(
      'ul[class=contains-task-list](li[class=task-list-item](label(input[type=checkbox checked disabled]() " " "done")) li[class=task-list-item](label(input[type=checkbox disabled]() " " "todo")))',
    );
    expect(render("| a | b | c |\n|:-|:-:|-:|\n| 1 | 2 | 3 |")).toBe(
      'table(thead(tr(th{text-align:left}("a") th{text-align:center}("b") th{text-align:right}("c"))) tbody(tr(td{text-align:left}("1") td{text-align:center}("2") td{text-align:right}("3"))))',
    );
    expect(render("~~gone~~ www.example.com")).toBe(
      'p(del("gone") " " a[href=http://www.example.com]("www.example.com"))',
    );
  });

  it("names task list boxes with a label (tight, loose, nested, raw HTML)", () => {
    expect(render("- [ ] a *b*\n  - [x] c")).toBe(
      'ul[class=contains-task-list](li[class=task-list-item](label(input[type=checkbox disabled]() " " "a " em("b")) ul[class=contains-task-list](li[class=task-list-item](label(input[type=checkbox checked disabled]() " " "c")))))',
    );
    expect(render("- [ ] a\n\n- b")).toBe(
      'ul[class=contains-task-list](li[class=task-list-item](p(label(input[type=checkbox disabled]() " " "a"))) li(p("b")))',
    );
    expect(
      render(
        '<p><input type="checkbox" disabled> x<br>y</p><div><input type="checkbox" disabled></div>',
        { rawHtml: true },
      ),
    ).toBe(
      'p(label(input[type=checkbox disabled]() " x" br() "y")) div(input[type=checkbox disabled]())',
    );
    // Only checkboxes; filters can't remove the label.
    expect(render("<p><b>x</b></p>", { rawHtml: true })).toBe('p(b("x"))');
    expect(render("- [ ] a", { allowedElements: ["ul", "li", "input"] })).toBe(
      'ul[class=contains-task-list](li[class=task-list-item](label(input[type=checkbox disabled]() " " "a")))',
    );
  });

  it("turns GitHub Flavored Markdown off with gfm: false", () => {
    expect(render("~~gone~~", { gfm: false })).toBe('p("~~gone~~")');
  });

  it("renders footnotes with a visually hidden label", () => {
    const html = render("Note[^1]\n\n[^1]: Text");
    expect(html).toContain("a[href=#user-content-fn-1 id=user-content-fnref-1 data-footnote-ref");
    expect(html).toContain('h2[class=sr-only id=footnote-label]("Footnotes")');
  });

  it("drops whitespace between table parts (React would warn, browsers move it)", () => {
    const tree = markdownTree("<table>\n<tr>\n<td>x</td>\n</tr>\n</table>", { rawHtml: true });
    const table = [...elements(tree)].find((e) => e.tagName === "table") as Element;
    expect(table.children.every((child) => child.type === "element")).toBe(true);
  });

  it("treats a non-string source as empty", () => {
    expect(render(undefined as unknown as string)).toBe("");
    expect(markdownTree(42).children).toEqual([]);
  });

  it("processes asynchronous plugins with markdownTreeAsync", async () => {
    const later = () => async (tree: Root) => {
      await Promise.resolve();
      (tree.children as unknown[]).push({
        type: "element",
        tagName: "hr",
        properties: {},
        children: [],
      });
    };
    expect(() => markdownTree("x", { rehypePlugins: [later] })).toThrow();
    expect(show(await markdownTreeAsync("x", { rehypePlugins: [later] }))).toBe('p("x") hr()');
    expect(show(await markdownTreeAsync(null))).toBe("");
    await expect(
      markdownTreeAsync("x", { allowedElements: ["p"], disallowedElements: ["a"] }),
    ).rejects.toThrow(TypeError);
  });

  it("runs remark and rehype plugins and passes remarkRehypeOptions", () => {
    const shout = () => (tree: Root) => {
      for (const element of elements(tree)) element.properties["dataShout"] = "yes";
    };
    expect(render("hi", { rehypePlugins: [shout] })).toBe('p[data-shout=yes]("hi")');
    const html = render("a[^1]\n\n[^1]: b", {
      remarkRehypeOptions: { footnoteLabel: "Notes", clobberPrefix: "x-" },
    });
    expect(html).toContain('("Notes")');
    expect(html).toContain("#x-fn-1");
    const noop = () => () => {};
    expect(render("hi", { remarkPlugins: [noop] })).toBe('p("hi")');
  });
});

describe("raw HTML", () => {
  const source = 'Text <b onclick="x()">bold</b>\n\n<div><em>block</em></div>';

  it("shows HTML as text by default (react-markdown)", () => {
    expect(render(source)).toBe(
      'p("Text " "<b onclick=\\"x()\\">" "bold" "</b>") "<div><em>block</em></div>"',
    );
  });

  it("drops HTML with skipHtml, also when rawHtml is on", () => {
    expect(render(source, { skipHtml: true })).toBe('p("Text " "bold")');
    expect(render(source, { skipHtml: true, rawHtml: true })).toBe('p("Text " "bold")');
  });

  it("renders sanitized HTML with rawHtml", () => {
    expect(render(source, { rawHtml: true })).toBe('p("Text " b("bold")) div(em("block"))');
  });

  it("keeps only text-align and text-transform styles from raw HTML", () => {
    expect(
      render(
        '<p style="text-align: center; color: red; text-transform: UPPERCASE; background: url(x)">a</p><span style="color: red">b</span>',
        { rawHtml: true },
      ),
    ).toBe('p{text-align:center;text-transform:UPPERCASE}("a") span("b")');
  });

  it("keeps footnote links working after the sanitizer prefixes ids", () => {
    const html = render(
      'Note[^1] <a href="#here">x</a> <a href="#user-content-y">y</a>\n\n[^1]: Text',
      {
        rawHtml: true,
      },
    );
    expect(html).toContain("a[href=#user-content-fn-1 id=user-content-fnref-1");
    expect(html).toContain("li[id=user-content-fn-1]");
    // No matching id: the link stays as written.
    expect(html).toContain('a[href=#here]("x")');
    expect(html).toContain('a[href=#user-content-y]("y")');
  });

  it("follows a custom sanitize schema", () => {
    const schema = { ...markdownSanitizeSchema, tagNames: ["p"] };
    expect(render("<p><b>x</b></p>", { rawHtml: true, sanitizeSchema: schema })).toBe('p("x")');
    const notes = render("x[^1]\n\n[^1]: a", {
      rawHtml: true,
      sanitizeSchema: { ...schema, clobberPrefix: "" },
    });
    expect(notes).not.toMatch(/sup|section|href/);
  });
});

describe("element filters", () => {
  it("keeps only allowedElements; removes disallowedElements", () => {
    expect(render("# T\n\n*a* b", { allowedElements: ["p"] })).toBe('p(" b")');
    expect(render("# T\n\n*a* b", { disallowedElements: ["em", "h1"] })).toBe('p(" b")');
  });

  it("keeps the children of removed elements with unwrapDisallowed", () => {
    expect(
      render("# T\n\n*a* b", { disallowedElements: ["em", "h1"], unwrapDisallowed: true }),
    ).toBe('"T" p("a" " b")');
    // Nested removals unwrap all the way down.
    expect(render("***x***", { allowedElements: ["p"], unwrapDisallowed: true })).toBe('p("x")');
  });

  it("asks allowElement after the lists, with the index and parent", () => {
    const calls: string[] = [];
    const html = render("a *b* `c`", {
      disallowedElements: ["code"],
      allowElement: (element, index, parent) => {
        calls.push(`${element.tagName}@${index} in ${parent.type}`);
        return element.tagName !== "em";
      },
    });
    expect(html).toBe('p("a " " ")');
    expect(calls).toEqual(["p@0 in root", "em@1 in element"]);
  });

  it("refuses allowedElements together with disallowedElements", () => {
    expect(() => markdownTree("x", { allowedElements: ["p"], disallowedElements: ["a"] })).toThrow(
      /can't be combined/,
    );
  });
});

describe("URLs and links", () => {
  it("defaultUrlTransform keeps relative URLs and safe protocols only", () => {
    for (const safe of [
      "https://a.b/c",
      "HTTP://a",
      "mailto:x@y.z",
      "irc://h",
      "ircs://h",
      "xmpp:a@b",
      "/path:x",
      "page?q=a:b",
      "#id:x",
      "relative",
      "",
    ])
      expect(defaultUrlTransform(safe)).toBe(safe);
    for (const unsafe of [
      "javascript:alert(1)",
      "JaVaScRiPt:alert(1)",
      " javascript:alert(1)",
      "java\tscript:alert(1)",
      "vbscript:x",
      "data:text/html,<script>",
      "file:///etc/passwd",
      "tel:123",
    ])
      expect(defaultUrlTransform(unsafe)).toBe("");
  });

  it("empties unsafe link and image URLs (S3)", () => {
    expect(render("[x](javascript:alert(1)) ![y](data:image/svg+xml,<svg>)")).toBe(
      'p(a("x") " " img[alt=y]())',
    );
    // Entities and autolinks can't smuggle a protocol in either.
    expect(render("[x](&#106;avascript:alert(1)) <javascript:alert(1)>")).toBe(
      'p(a("x") " " a("javascript:alert(1)"))',
    );
  });

  it("checks raw HTML URLs, srcset and SVG links too", () => {
    expect(
      render('<a href="javascript:x">a</a><img src="https://ok/x.png">', { rawHtml: true }),
    ).toBe('p(a("a") img[src=https://ok/x.png]())');
    const svgLink = () => (tree: Root) => {
      (tree.children as unknown[]).push({
        type: "element",
        tagName: "img",
        properties: { src: "a.png", srcSet: ["a.png 1x", "javascript:x 2x"] },
        children: [],
      });
      (tree.children as unknown[]).push({
        type: "element",
        tagName: "img",
        properties: { srcSet: "a.png 1x, b.png 2x" },
        children: [],
      });
      (tree.children as unknown[]).push({
        type: "element",
        tagName: "use",
        properties: { xLinkHref: "javascript:x", href: "javascript:y" },
        children: [],
      });
      (tree.children as unknown[]).push({
        type: "element",
        tagName: "blockquote",
        properties: { cite: "javascript:z" },
        children: [],
      });
    };
    expect(render("", { rehypePlugins: [svgLink] })).toBe(
      "img[src=a.png]() img[srcset=a.png 1x, b.png 2x]() use() blockquote()",
    );
  });

  it("uses urlTransform with the key and node; null or undefined removes the URL", () => {
    const seen: string[] = [];
    const html = render("[a](x) ![b](y)", {
      urlTransform: (url, key, node) => {
        seen.push(`${key}:${url}:${node.tagName}`);
        return key === "src" ? null : `/go?${url}`;
      },
    });
    expect(html).toBe('p(a[href=/go?x]("a") " " img[alt=b]())');
    expect(seen).toEqual(["href:x:a", "src:y:img"]);
    expect(render("[a](x)", { urlTransform: () => undefined })).toBe('p(a("a"))');
  });

  it("opens absolute http(s) links in a new tab with externalLinks", () => {
    expect(render("[a](https://x.y) [b](/local) [c](mailto:m@x.y)", { externalLinks: true })).toBe(
      'p(a[href=https://x.y target=_blank rel=noopener noreferrer]("a") " " a[href=/local]("b") " " a[href=mailto:m@x.y]("c"))',
    );
    expect(isExternalUrl("HTTPS://x")).toBe(true);
    expect(isExternalUrl("//x")).toBe(false);
  });

  it("adds noopener noreferrer to any target=_blank link", () => {
    const blank = (rel: unknown) => () => (tree: Root) => {
      (tree.children as unknown[]).push({
        type: "element",
        tagName: "a",
        properties: { href: "/x", target: "_blank", ...(rel === undefined ? {} : { rel }) },
        children: [],
      });
    };
    expect(render("", { rehypePlugins: [blank(undefined)] })).toBe(
      "a[href=/x target=_blank rel=noopener noreferrer]()",
    );
    expect(render("", { rehypePlugins: [blank("nofollow")] })).toBe(
      "a[href=/x target=_blank rel=nofollow noopener noreferrer]()",
    );
    expect(render("", { rehypePlugins: [blank(["noopener"])] })).toBe(
      "a[href=/x target=_blank rel=noopener noreferrer]()",
    );
  });
});

describe("security (malicious input)", () => {
  const nasty = [
    "<script>alert(1)</script>",
    '<img src=x onerror="alert(1)">',
    '<a href="javascript:alert(1)">x</a>',
    '<iframe src="https://evil"></iframe>',
    '<svg><script>alert(1)</script><a xlink:href="javascript:x">y</a></svg>',
    '<math><mi xlink:href="javascript:x">z</mi></math>',
    "<style>body{display:none}</style>",
    '<form action="https://evil"><input name="x" formaction="javascript:x"></form>',
    '<object data="x.swf"></object><embed src="x">',
    '<base href="https://evil/"><meta http-equiv="refresh" content="0;url=javascript:x">',
    '<div id="__proto__" name="constructor" style="position:fixed;inset:0" class="x">c</div>',
    '<details open ontoggle="alert(1)"><summary>s</summary></details>',
    '<p srcdoc="<script>" is="x-y" onmouseover="x">p</p>',
    "<template><img src=x onerror=alert(1)></template>",
    '<noscript><p title="</noscript><img src=x onerror=alert(1)>"></noscript>',
    "<!-- comment --><![CDATA[x]]>",
    '<a href="&#0000106&#0000097vascript:alert(1)">e</a>',
  ].join("\n\n");

  it("never outputs scripts, handlers, frames, forms, styles or unsafe URLs (S1, S4, S14, S15, S17)", () => {
    for (const rawHtml of [false, true]) {
      const tree = markdownTree(nasty, { rawHtml });
      const tags = [...elements(tree)].map((e) => e.tagName);
      for (const tag of [
        "script",
        "iframe",
        "style",
        "form",
        "object",
        "embed",
        "base",
        "meta",
        "template",
        "svg",
        "math",
      ])
        expect(tags).not.toContain(tag);
      const attributes = allAttributes(nasty, { rawHtml });
      for (const attribute of attributes) {
        expect(attribute).not.toMatch(/^\S+ on[a-z]+=/i);
        if (!attribute.includes(" title=")) expect(attribute).not.toMatch(/javascript:/i);
        expect(attribute).not.toMatch(/^\S+ (srcdoc|formaction|action|is|style)=/);
      }
      // DOM clobbering: ids and names get a prefix.
      if (rawHtml) expect(attributes).toContain("div id=user-content-__proto__");
    }
  });

  it("drops dangerous elements and attributes even when plugins add them", () => {
    const inject = () => (tree: Root) => {
      (tree.children as unknown[]).push(
        {
          type: "element",
          tagName: "script",
          properties: {},
          children: [{ type: "text", value: "x" }],
        },
        { type: "element", tagName: "IFRAME", properties: { src: "https://x" }, children: [] },
        {
          type: "element",
          tagName: "p",
          properties: {
            onClick: "x()",
            onclick: "y()",
            srcDoc: "<b>",
            is: "x-y",
            "bad name": "z",
            '"><img': "1",
            hidden: false,
            title: null,
            tabIndex: Number.NaN,
            dataOk: true,
          },
          children: [],
        },
        { type: "comment", value: "c" },
        { type: "doctype" },
      );
    };
    expect(render("", { rehypePlugins: [inject] })).toBe("p[data-ok]()");
  });

  it("ignores prototype keys in options and trees (S5)", () => {
    const polluted = JSON.parse('{"__proto__": {"polluted": 1}, "rawHtml": false}');
    render("x", polluted);
    expect(({} as Record<string, unknown>)["polluted"]).toBeUndefined();
    render('<div title="__proto__">x</div>', { rawHtml: true });
    expect(({} as Record<string, unknown>)["polluted"]).toBeUndefined();
  });

  it("handles very long and deeply nested input", () => {
    const long = "a".repeat(100_000);
    expect(render(long)).toBe(`p("${long}")`);
    const nested = `${"> ".repeat(200)}deep`;
    expect(render(nested).match(/blockquote/g)).toHaveLength(200);
  });
});

describe("highlighting", () => {
  const code = "```js\nreturn 1\n```";

  it("highlights fenced code in a registered language and adds the hljs class", () => {
    expect(render(code, { highlighter })).toBe(
      'pre(code[class=hljs language-js](span[class=hljs-keyword]("return") " 1\\n"))',
    );
  });

  it("leaves code without a language, unknown languages, no-highlight and inline code alone", () => {
    expect(render("```\nreturn\n```", { highlighter })).toBe('pre(code("return\\n"))');
    expect(render("```py\nreturn\n```", { highlighter })).toBe(
      'pre(code[class=language-py]("return\\n"))',
    );
    expect(render("`return`", { highlighter })).toBe('p(code("return"))');
    expect(
      render('<pre><code class="language-js no-highlight">return</code></pre>', {
        rawHtml: true,
        highlighter,
        sanitizeSchema: {
          ...markdownSanitizeSchema,
          attributes: { ...markdownSanitizeSchema.attributes, code: ["className"] },
        },
      }),
    ).toBe('pre(code[class=language-js no-highlight]("return"))');
  });

  it("highlights raw HTML code blocks (lang- prefix too) and skips code with elements", () => {
    expect(
      render('<pre><code class="language-js">return</code></pre>', { rawHtml: true, highlighter }),
    ).toBe('pre(code[class=hljs language-js](span[class=hljs-keyword]("return")))');
    const lang = () => (tree: Root) => {
      (tree.children as unknown[]).push({
        type: "element",
        tagName: "pre",
        properties: {},
        children: [
          {
            type: "element",
            tagName: "code",
            properties: { className: ["lang-js", "hljs"] },
            children: [{ type: "text", value: "return" }],
          },
        ],
      });
    };
    expect(render("", { rehypePlugins: [lang], highlighter })).toBe(
      'pre(code[class=hljs lang-js](span[class=hljs-keyword]("return")))',
    );
    expect(render("<pre><code><b>x</b></code></pre>", { rawHtml: true, highlighter })).toBe(
      'pre(code(b("x")))',
    );
    expect(render("<pre>plain</pre>", { rawHtml: true, highlighter })).toBe('pre("plain")');
  });

  it("leaves the code as text when the highlighter throws", () => {
    const broken: MarkdownHighlighter = {
      registered: () => true,
      highlight: () => {
        throw new Error("grammar");
      },
    };
    expect(render(code, { highlighter: broken })).toBe(
      'pre(code[class=language-js]("return 1\\n"))',
    );
  });
});

describe("attributes and styles for the renderers", () => {
  it("serializes values: booleans, lists (space or comma), numbers", () => {
    const element = {
      type: "element",
      tagName: "img",
      properties: {
        className: ["a", "b"],
        srcSet: ["a 1x", "b 2x"],
        width: 10,
        hidden: true,
        alt: "",
      },
      children: [],
    } as unknown as Element;
    expect(markdownElementAttributes(element)).toEqual([
      { name: "class", property: "className", value: "a b" },
      { name: "srcset", property: "srcSet", value: "a 1x, b 2x" },
      { name: "width", property: "width", value: "10" },
      { name: "hidden", property: "hidden", value: true },
      { name: "alt", property: "alt", value: "" },
    ]);
  });

  it("uses SVG attribute names inside svg", () => {
    const element = {
      type: "element",
      tagName: "path",
      properties: { strokeWidth: 2, viewBox: "0 0 1 1" },
      children: [],
    } as unknown as Element;
    expect(markdownElementAttributes(element, "svg").map((a) => a.name)).toEqual([
      "stroke-width",
      "viewBox",
    ]);
    const svg = { ...element, tagName: "svg" };
    expect(childSpace(svg, "html")).toBe("svg");
    expect(childSpace({ ...element, tagName: "foreignObject" }, "svg")).toBe("html");
    expect(childSpace(element, "svg")).toBe("svg");
    expect(
      markdownElementAttributes({
        type: "element",
        tagName: "p",
        children: [],
      } as unknown as Element),
    ).toEqual([]);
  });

  it("parses styles and drops resource-loading values", () => {
    expect(parseStyle("color: red; ; bad; :x; width:; background: URL(x); --a: 1")).toEqual([
      ["color", "red"],
      ["--a", "1"],
    ]);
    expect(parseStyle(5)).toEqual([]);
  });
});
