import type { Metadata } from "next";
import { LegalPage, PRIVACY } from "../../../site/legal.js";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Privacy policy (draft)",
  description: "What owlky.com and the Owlky MCP server keep about you, and what they never keep.",
  // A draft: indexed once the owner approves it (L6).
  robots: { index: false },
};

export default function PrivacyPage() {
  return <LegalPage title="Privacy policy" sections={PRIVACY} />;
}
