import type { Metadata } from "next";
import { SignIn } from "../../../site/account/sign-in.js";

// A static shell: the providers and the session are read in the browser.
export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to use the Owlky MCP server from your AI coding tools.",
  robots: { index: false },
};

export default function SignInPage() {
  return <SignIn />;
}
