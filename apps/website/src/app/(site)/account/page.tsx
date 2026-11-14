import type { Metadata } from "next";
import { Account } from "../../../site/account/account.js";

// A static shell: the account is loaded in the browser with the session cookie.
export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Account",
  description: "Your Owlky account: MCP access, personal access tokens and email settings.",
  robots: { index: false },
};

export default function AccountPage() {
  return <Account />;
}
