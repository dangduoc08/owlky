import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { loadManifest, type Manifest } from "./manifest.js";
import { createOwlkyServer } from "./server.js";

let cached: Manifest | undefined;
/** The committed manifest, read once per test file. */
export const manifest = (): Manifest => {
  cached ??= loadManifest();
  return cached;
};

/** A client connected to a fresh server through the SDK's in-memory transport. */
export async function connect(options: { manifest?: Manifest } = {}) {
  const server = createOwlkyServer({ manifest: options.manifest ?? manifest() });
  const client = new Client({ name: "owlky-test", version: "0.0.0" });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  const call = async (name: string, args: Record<string, unknown> = {}) =>
    (await client.callTool({ name, arguments: args })) as CallToolResult;
  return {
    client,
    call,
    close: async () => {
      await client.close();
      await server.close();
    },
  };
}

/** The text of a tool result. */
export const textOf = (result: CallToolResult): string =>
  result.content.map((part) => (part.type === "text" ? part.text : "")).join("\n");
