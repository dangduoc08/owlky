import type { Metadata } from "next";
import { LegalPage, TERMS } from "../../../site/legal.js";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Terms of use (draft)",
  description: "The terms of the hosted Owlky services: the website and the MCP server.",
  // A draft: indexed once the owner approves it (L6).
  robots: { index: false },
};

export default function TermsPage() {
  return <LegalPage title="Terms of use" sections={TERMS} />;
}
