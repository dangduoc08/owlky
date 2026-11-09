import { describe, expect, it } from "vitest";
import { decodeEntities, scanMarkup } from "./markup.js";

const tags = (markup: string) => scanMarkup(markup).elements.map((element) => element.tag);

describe("scanMarkup", () => {
  it("reads tags, attributes, positions and parents", () => {
    const { elements } = scanMarkup(
      "<div data-ok-a=\"x\" hidden>\n  <span class='b' data-n=3>Text</span>\n</div>",
    );
    expect(elements).toEqual([
      {
        tag: "div",
        attributes: [
          ["data-ok-a", "x"],
          ["hidden", ""],
        ],
        line: 1,
        column: 1,
        parent: -1,
      },
      {
        tag: "span",
        attributes: [
          ["class", "b"],
          ["data-n", "3"],
        ],
        line: 2,
        column: 3,
        parent: 0,
      },
    ]);
  });

  it("lowercases names and decodes values", () => {
    const [element] = scanMarkup(
      '<DIV Data-OK-X="a &amp; b &#39;c&#x27; &lt;d&gt; &bogus;">',
    ).elements;
    expect(element?.tag).toBe("div");
    expect(element?.attributes).toEqual([["data-ok-x", "a & b 'c' <d> &bogus;"]]);
  });

  it("skips comments, doctypes, processing instructions and raw text", () => {
    expect(
      tags(
        '<!doctype html><?xml version="1.0"?><!-- <b> --><script>if (a<b) "<i>"</script><style>p>b{}</style><textarea><u></textarea><p></p>',
      ),
    ).toEqual(["script", "style", "textarea", "p"]);
  });

  it("handles void, self-closing and SVG elements", () => {
    const { elements } = scanMarkup('<p><img src="a"><br/><svg><path d="M0"/></svg><i></i></p>');
    expect(elements.map((e) => [e.tag, e.parent])).toEqual([
      ["p", -1],
      ["img", 0],
      ["br", 0],
      ["svg", 0],
      ["path", 3],
      ["i", 0],
    ]);
  });

  it("closes to the matching open element and ignores stray end tags", () => {
    const { elements } = scanMarkup("<ul><li><b>one</ul></span><p></p>");
    expect(elements.map((e) => [e.tag, e.parent])).toEqual([
      ["ul", -1],
      ["li", 0],
      ["b", 1],
      ["p", -1],
    ]);
  });

  it("survives text that only looks like markup and unterminated input", () => {
    expect(tags("a < b and <3 <")).toEqual([]);
    expect(tags("<!-- open")).toEqual([]);
    expect(tags("<!doctype")).toEqual([]);
    expect(tags("<p>text</p")).toEqual(["p"]);
    expect(tags("<script>never closed")).toEqual(["script"]);
    const [quoted] = scanMarkup('<a title="never closed').elements;
    expect(quoted?.attributes).toEqual([["title", "never closed"]]);
    const [spaced] = scanMarkup("<a title = 'x' / data-ok-y >").elements;
    expect(spaced?.attributes).toEqual([
      ["title", "x"],
      ["data-ok-y", ""],
    ]);
    const [unquoted] = scanMarkup("<a href=/x>").elements;
    expect(unquoted?.attributes).toEqual([["href", "/x"]]);
    expect(scanMarkup("<a b").elements[0]?.attributes).toEqual([["b", ""]]);
    expect(scanMarkup("<a ").elements[0]?.attributes).toEqual([]);
    expect(scanMarkup("<a b/c>").elements[0]?.attributes).toEqual([["b/c", ""]]);
    expect(tags("<p></p> trailing text")).toEqual(["p"]);
  });

  it("scans large input in linear time", () => {
    const markup = '<span data-ok-x="1"><script>x</script></span>'.repeat(5000);
    const start = performance.now();
    expect(scanMarkup(markup).elements).toHaveLength(10_000);
    expect(performance.now() - start).toBeLessThan(2000);
  });
});

describe("decodeEntities", () => {
  it("keeps invalid code points as written", () => {
    expect(decodeEntities("&#0; &#x110000; &#65;")).toBe("&#0; &#x110000; A");
  });
});
