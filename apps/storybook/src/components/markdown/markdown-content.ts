// The demo documents of the Markdown stories, shared by the React demos and the HTML snippets
// (`node apps/storybook/scripts/markdown-snippets.mjs` writes the snippets from them). Plain
// data: Node runs this file with type stripping.

/** "Markdown content": every block GitHub Flavored Markdown writes. */
export const MARKDOWN_CONTENT = `# h1

## h2

**Paragraph** Placeholder text fills a layout while the real copy is being written, so you can review spacing and type before the words arrive.

[Link (https://www.example.com/)](https://www.example.com/)

###### List

- [x] Draft the release notes
- [ ] Update the changelog
- [ ] Announce the release

---

###### A table:

| Syntax | Description | Notes |
| :-- | :-: | --: |
| Header | Title | Here's this |
| Paragraph | Text | And more |

\`\`\`javascript
for (var i = 1; i <= 20; i++) {
  if (i % 15 == 0)
    return "FizzBuzz"
  else if (i % 3 == 0)
    return "Fizz"
  else if (i % 5 == 0)
    return "Buzz"
  else
    return i
}
\`\`\`

\`Code inline\`

![Abstract waves at dusk](images/cover-1.svg)

> A block quote with ~~strikethrough~~ and a URL: https://react.dev.
`;

/** "Html content": the same document written as HTML (rendered with `rawHtml`). */
export const HTML_CONTENT = `<h1>h1</h1>
<h2>h2</h2>
<p><strong>Paragraph</strong> Placeholder text fills a layout while the real copy is being written, so you can review spacing and type before the words arrive.</p>
<p><a href="https://www.example.com/">Link (https://www.example.com/)</a></p>
<h6>List</h6>
<ul>
<li><input type="checkbox" checked disabled> Draft the release notes</li>
<li><input type="checkbox" disabled> Update the changelog</li>
<li><input type="checkbox" disabled> Announce the release</li>
</ul>
<hr>
<h6>A table:</h6>
<table>
<thead><tr><th style="text-align: left">Syntax</th><th style="text-align: center">Description</th><th style="text-align: right">Notes</th></tr></thead>
<tbody>
<tr><td style="text-align: left">Header</td><td style="text-align: center">Title</td><td style="text-align: right">Here's this</td></tr>
<tr><td style="text-align: left">Paragraph</td><td style="text-align: center">Text</td><td style="text-align: right">And more</td></tr>
</tbody>
</table>
<pre><code class="language-javascript">for (var i = 1; i &lt;= 20; i++) {
  if (i % 15 == 0)
    return "FizzBuzz"
  else if (i % 3 == 0)
    return "Fizz"
  else if (i % 5 == 0)
    return "Buzz"
  else
    return i
}</code></pre>
<p><code>Code inline</code></p>
<p><img src="images/cover-1.svg" alt="Abstract waves at dusk"></p>
<blockquote><p>A block quote with <s>strikethrough</s> and a URL: <a href="https://react.dev">https://react.dev</a>.</p></blockquote>
`;
