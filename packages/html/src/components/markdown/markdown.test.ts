import { markdownTree } from "@owlky/core/markdown";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createRuntime } from "../../runtime/runtime.js";
import type { Runtime } from "../../runtime/types.js";
import {
  expectCspSafe,
  expectNoAxeViolations,
  mount,
  resetPage,
  settle,
} from "../../test-utils.js";
import { components } from "../index.js";
import { createMarkdown, type MarkdownInstance, markdown } from "./markdown.js";

const snippets = Object.entries(
  import.meta.glob("./examples/*.html", { query: "?raw", import: "default", eager: true }),
) as [string, string][];
/** Vitest doesn't serve Storybook's static folder: images point at an inline pixel. */
const local = (html: string) =>
  html.replace(
    /images\/cover-1\.svg/g,
    "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==",
  );

let runtime: Runtime | undefined;
afterEach(() => {
  runtime?.stop();
  runtime = undefined;
  resetPage();
  vi.restoreAllMocks();
});
const start = (definition = markdown) => {
  runtime = createRuntime()
    .register(...components, definition)
    .start();
  return runtime;
};

/** Escapes text for a `pre[data-ok-markdown-source]`. */
const escapeSource = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const markup = (source: string, attributes = "") =>
  `<div data-ok-markdown${attributes}><pre data-ok-markdown-source>${escapeSource(source)}</pre></div>`;

async function setup(source: string, attributes = "", definition = markdown) {
  const host = mount(markup(source, attributes));
  const r = start(definition);
  await settle();
  const root = host.querySelector<HTMLElement>("[data-ok-markdown]") as HTMLElement;
  const instance = r.get<MarkdownInstance>(root, "markdown") as MarkdownInstance;
  return { host, root, instance, runtime: r };
}

/** The rendered content: every child but the hidden source. */
const content = (root: HTMLElement) =>
  [...root.childNodes]
    .filter(
      (node) => !(node instanceof HTMLElement && node.hasAttribute("data-ok-markdown-source")),
    )
    .map((node) => (node instanceof Element ? node.outerHTML : node.textContent))
    .join("");

describe("markdown runtime", () => {
  it("renders the source before it and hides it", async () => {
    const { root, instance } = await setup("# Title\n\nSome **bold**.");
    const source = root.querySelector("[data-ok-markdown-source]") as HTMLElement;
    expect(source.hidden).toBe(true);
    expect(root.lastElementChild).toBe(source);
    expect(content(root)).toBe("<h1>Title</h1>\n<p>Some <strong>bold</strong>.</p>");
    expect(instance.value).toBe("# Title\n\nSome **bold**.");
  });

  it("renders every snippet like the core tree, CSP-safe markup, no axe violations", async () => {
    for (const [, html] of snippets) {
      const host = mount(local(html));
      expectCspSafe(host, html);
      runtime = start(createMarkdown({ highlighter: undefined }));
      await settle();
      const root = host.querySelector<HTMLElement>("[data-ok-markdown]") as HTMLElement;
      expect(root.querySelector("h1")?.textContent).toBe("h1");
      expect(root.querySelectorAll("input[type=checkbox]")).toHaveLength(3);
      expect(root.querySelectorAll("label > input[type=checkbox]")).toHaveLength(3);
      expect(root.querySelector("table td")?.getAttribute("style")).toMatch(/text-align: left/);
      expect(root.querySelector("a")?.getAttribute("target")).toBe("_blank");
      await expectNoAxeViolations(host);
      runtime.stop();
      resetPage();
    }
  });

  it("follows option attributes and re-renders when they change", async () => {
    const source = "~~x~~ <b>y</b> [l](https://a.b)";
    const { root } = await setup(source);
    expect(content(root)).toBe(
      '<p><del>x</del> &lt;b&gt;y&lt;/b&gt; <a href="https://a.b">l</a></p>',
    );
    const rendered = new Promise((resolve) => root.addEventListener("ok:markdown:render", resolve));
    root.setAttribute("data-ok-raw-html", "");
    await rendered;
    expect(content(root)).toBe('<p><del>x</del> <b>y</b> <a href="https://a.b">l</a></p>');
    root.setAttribute("data-ok-external-links", "");
    await settle();
    expect(root.querySelector("a")?.getAttribute("rel")).toBe("noopener noreferrer");
    root.setAttribute("data-ok-skip-html", "");
    root.setAttribute("data-ok-gfm", "false");
    await settle();
    expect(content(root)).toContain("<p>~~x~~ y <a");
    root.setAttribute("data-ok-allowed-elements", 'p em ../x "><img');
    root.setAttribute("data-ok-unwrap-disallowed", "");
    await settle();
    expect(content(root)).toBe("<p>~~x~~ y l</p>");
    root.removeAttribute("data-ok-allowed-elements");
    root.setAttribute("data-ok-disallowed-elements", "a");
    root.removeAttribute("data-ok-unwrap-disallowed");
    await settle();
    expect(content(root)).toBe("<p>~~x~~ y </p>");
  });

  it("re-renders when the source text changes, and through setValue / render", async () => {
    const { root, instance } = await setup("one");
    const events: string[] = [];
    root.addEventListener("ok:markdown:render", (event) =>
      events.push((event as CustomEvent<{ value: string }>).detail.value),
    );
    const source = root.querySelector("[data-ok-markdown-source]") as HTMLElement;
    source.textContent = "two";
    await settle();
    expect(content(root)).toBe("<p>two</p>");
    instance.setValue("*three*");
    expect(content(root)).toBe("<p><em>three</em></p>");
    expect(instance.value).toBe("*three*");
    instance.render();
    expect(events).toEqual(["two", "*three*", "*three*"]);
  });

  it("reports errors, keeps the source visible, and recovers", async () => {
    const { root } = await setup(
      "x",
      ' data-ok-allowed-elements="p" data-ok-disallowed-elements="a"',
    );
    const source = root.querySelector("[data-ok-markdown-source]") as HTMLElement;
    expect(source.hidden).toBe(false);
    const failed = new Promise<unknown>((resolve) =>
      root.addEventListener("ok:markdown:error", (event) =>
        resolve((event as CustomEvent<{ error: unknown }>).detail.error),
      ),
    );
    root.setAttribute("data-ok-allowed-elements", "p em");
    expect(await failed).toBeInstanceOf(TypeError);
    root.removeAttribute("data-ok-disallowed-elements");
    await settle();
    expect(source.hidden).toBe(true);
    expect(content(root)).toBe("<p>x</p>");
  });

  it("leaves markup without a source (server-rendered) alone", async () => {
    const host = mount("<div data-ok-markdown><p>Prerendered</p></div>");
    const r = start();
    await settle();
    const root = host.querySelector<HTMLElement>("[data-ok-markdown]") as HTMLElement;
    const instance = r.get<MarkdownInstance>(root, "markdown") as MarkdownInstance;
    instance.setValue("# new");
    instance.render();
    expect(root.innerHTML).toBe("<p>Prerendered</p>");
    expect(instance.value).toBe("");
  });

  it("builds DOM with createElement / setAttribute / CSSOM only (S1, S6, S15)", async () => {
    const add = () => (tree: { children: unknown[] }) => {
      tree.children.push(
        {
          type: "element",
          tagName: "svg",
          properties: { viewBox: "0 0 1 1", onLoad: "alert(1)" },
          children: [
            { type: "element", tagName: "path", properties: { strokeWidth: 2 }, children: [] },
          ],
        },
        { type: "element", tagName: 'x"><img', properties: {}, children: [] },
        {
          type: "element",
          tagName: "div",
          properties: { style: "text-align: right; --gap: 1px" },
          children: [],
        },
        {
          type: "element",
          tagName: "script",
          properties: {},
          children: [{ type: "text", value: "window.pwned = 1" }],
        },
      );
    };
    const { root } = await setup(
      '<img src=x onerror="window.pwned=1"> [x](javascript:window.pwned=1)',
      " data-ok-raw-html",
      createMarkdown({ rehypePlugins: [add] }),
    );
    const svg = root.querySelector("svg") as SVGSVGElement;
    expect(svg.namespaceURI).toBe("http://www.w3.org/2000/svg");
    expect(svg.getAttribute("viewBox")).toBe("0 0 1 1");
    expect(svg.hasAttribute("onload")).toBe(false);
    expect(svg.querySelector("path")?.getAttribute("stroke-width")).toBe("2");
    const div = root.querySelector("div") as HTMLDivElement;
    expect(div.style.textAlign).toBe("right");
    expect(div.style.getPropertyValue("--gap")).toBe("1px");
    expect(root.querySelector("script")).toBeNull();
    expect(root.querySelector("img")?.hasAttribute("onerror")).toBe(false);
    expect(root.querySelector("a")?.hasAttribute("href")).toBe(false);
    await settle();
    expect((window as { pwned?: number }).pwned).toBeUndefined();
  });

  it("takes plugins, allowElement, urlTransform and a highlighter from createMarkdown", async () => {
    const definition = createMarkdown({
      remarkPlugins: [],
      remarkRehypeOptions: { footnoteLabel: "Notes" },
      allowElement: (element) => element.tagName !== "em",
      urlTransform: (url) => `/go?${url}`,
      highlighter: {
        registered: () => true,
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
      },
    });
    const { root } = await setup("[a](b) *c*\n\n```js\nx\n```\n\nn[^1]\n\n[^1]: f", "", definition);
    expect(root.querySelector("a")?.getAttribute("href")).toBe("/go?b");
    expect(root.querySelector("em")).toBeNull();
    expect(root.querySelector("code.hljs .hljs-keyword")?.textContent).toBe("x\n");
    expect(root.querySelector("h2")?.textContent).toBe("Notes");
  });

  it("renders asynchronously with async: true and drops stale results", async () => {
    const definition = createMarkdown({
      async: true,
      rehypePlugins: [
        () => async () => {
          await new Promise((resolve) => setTimeout(resolve, 5));
        },
      ],
    });
    const { root, instance } = await setup("first", "", definition);
    const rendered = new Promise<string>((resolve) =>
      root.addEventListener("ok:markdown:render", (event) =>
        resolve((event as CustomEvent<{ value: string }>).detail.value),
      ),
    );
    instance.setValue("second");
    instance.setValue("third");
    expect(await rendered).toBe("third");
    expect(content(root)).toBe("<p>third</p>");
    const failed = new Promise((resolve) => root.addEventListener("ok:markdown:error", resolve));
    root.setAttribute("data-ok-allowed-elements", "p");
    root.setAttribute("data-ok-disallowed-elements", "a");
    await failed;
    // Destroyed while processing: nothing is written afterwards.
    root.removeAttribute("data-ok-disallowed-elements");
    instance.setValue("late");
    runtime?.destroy(root);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(content(root)).toBe("<p>third</p>");
  });

  it("is idempotent, stops observing on destroy, and works inserted later", async () => {
    const host = mount("");
    const r = start();
    host.innerHTML = markup("late");
    await settle();
    const root = host.querySelector<HTMLElement>("[data-ok-markdown]") as HTMLElement;
    r.init(host);
    expect(content(root)).toBe("<p>late</p>");
    r.destroy(root);
    (root.querySelector("[data-ok-markdown-source]") as HTMLElement).textContent = "changed";
    await settle();
    expect(content(root)).toBe("<p>late</p>");
  });

  it("matches the core pipeline for the same source", async () => {
    const source = "# A\n\n- [x] b\n\n| c |\n| - |\n| d |";
    const { root } = await setup(source);
    const tree = markdownTree(source);
    const tags = (node: {
      children: { type: string; tagName?: string; children?: unknown }[];
    }): string[] =>
      node.children.flatMap((child) =>
        child.type === "element" ? [child.tagName as string, ...tags(child as never)] : [],
      );
    const domTags = [...root.querySelectorAll("*:not([data-ok-markdown-source])")].map((e) =>
      e.tagName.toLowerCase(),
    );
    expect(domTags).toEqual(tags(tree as never));
  });
});
