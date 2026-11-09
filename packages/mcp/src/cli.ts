#!/usr/bin/env node
// `owlky-mcp` (`npx -y @owlky/mcp`): the Owlky MCP server over stdio (ADR-0046).
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createOwlkyServer } from "./server.js";

const server = createOwlkyServer();
await server.connect(new StdioServerTransport());
