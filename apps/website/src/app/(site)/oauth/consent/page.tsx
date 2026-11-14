import type { Metadata } from "next";
import { Consent } from "../../../../site/account/consent.js";

// A static shell: the authorization request comes in the signed query string.
export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Connect an AI client",
  description: "Allow an MCP client to use the Owlky MCP server with your account.",
  robots: { index: false },
};

export default function ConsentPage() {
  return <Consent />;
}
