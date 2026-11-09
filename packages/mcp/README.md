# @owlky/mcp

A [Model Context Protocol](https://modelcontextprotocol.io) (MCP) server for
[Owlky](https://github.com/dangduoc08/owlky). It gives your coding agent the exact Owlky API, so
the agent stops guessing props, `data-ok-*` attributes and token names.

- **Exact.** Every answer comes from the same sources as the library: the option schemas, the
  component specs, the docs guides, the HTML snippets, the React examples and the design tokens.
- **Versioned.** The data ships inside the package, so it always matches the Owlky version you
  install.
- **Offline.** The server reads only its own data file. It makes no network requests and never
  runs the markup you send it.

## Run the server

You need Node.js 22.12 or later. Your MCP client starts the server over stdio with this command:

```sh
npx -y @owlky/mcp
```

The `-y` flag tells `npx` to install the package without asking. To use the version that your
project installs, add `@owlky/mcp` to your dev dependencies and use `npx owlky-mcp` instead.

## Add the server to your editor

### Claude Code

Run this command in your project:

```sh
claude mcp add owlky -- npx -y @owlky/mcp
```

To share the server with your team, add it to `.mcp.json` in the project root instead:

```json
{
  "mcpServers": {
    "owlky": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@owlky/mcp"]
    }
  }
}
```

### Cursor

Add the server to `.cursor/mcp.json` in your project, or to `~/.cursor/mcp.json` for every
project:

```json
{
  "mcpServers": {
    "owlky": {
      "command": "npx",
      "args": ["-y", "@owlky/mcp"]
    }
  }
}
```

### Visual Studio Code

Add the server to `.vscode/mcp.json` in your project:

```json
{
  "servers": {
    "owlky": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@owlky/mcp"]
    }
  }
}
```

Other MCP clients use the same command and arguments.

## Tools

Every tool is read-only. Each result has a Markdown text for the agent and structured content
that matches the tool's output schema.

| Tool | Input | Returns |
| --- | --- | --- |
| `list_components` | `query` (optional) | Every component with its name, title, summary, React exports and HTML root attribute. Every word of the query must match. |
| `get_component` | `name` | One component: the options table (React prop, HTML attribute, values, default), anatomy, states, behavior, keyboard, accessibility, events, required parts, related components and its examples. The name can be the component name, its title or a React export, such as `icon-button`, `Icon button` or `IconButton`. |
| `get_examples` | `component`, `framework` (`html`, `react` or `both`), `story` (optional) | Copyable code of the component's examples: the HTML snippet with the stylesheet and script it needs, and the React source with its imports. Large components list their examples first: pass `story` to get one. |
| `search_tokens` | `query`, `limit` (optional, 1 to 200) | `--ok-*` CSS variables with their group and their light and dark values, and the Tailwind CSS utilities of `@owlky/styles/theme.css`. |
| `get_guide` | `id` (optional), `section` (optional) | A usage guide, section by section, with HTML and React code: the introduction, a foundation such as `colors` or `typography`, or a component guide such as `button`. Without `id`, the list of guides. |
| `validate_markup` | `markup` (up to 200,000 characters), `component` (optional) | Problems in Owlky HTML: unknown `data-ok-*` attributes, values outside an option's allowed values, missing required parts, parts outside their component, and presence attributes with a value. With `component`, the markup must also contain that component. |

When a name is unknown, the tool returns an error that suggests the closest names.

## Resources and prompts

The server also offers its data as resources:

- `owlky://components/<name>`: a component's options, specification and examples, in Markdown.
- `owlky://tokens`: every design token and Tailwind CSS utility, in JSON.
- `owlky://guides/<id>`: a usage guide, in Markdown.

Two prompts start a task with the right workflow: `build-html-page` and `build-react-page`. Each one
takes a `task` description and tells the agent to look up components, examples and tokens with the
tools, then to check its HTML with `validate_markup`.

## Use the server in code

The package also exports the server factory, for example to connect it to another transport:

```ts
import { createOwlkyServer } from "@owlky/mcp";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = createOwlkyServer();
await server.connect(new StdioServerTransport());
```

## License

MIT.
