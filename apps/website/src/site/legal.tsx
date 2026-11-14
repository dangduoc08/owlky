import { Alert, AlertTitle, Typography } from "@owlky/react";

/* The privacy policy and terms of use: DRAFTS for the owner's legal review (roadmap L6). They
 * describe what the code does (ADR-0071); bracketed items are for the owner to fill in. */

export interface LegalSection {
  readonly id: string;
  readonly title: string;
  readonly paragraphs: readonly string[];
  readonly items?: readonly string[];
}

export const LEGAL_UPDATED = "2026-11-13";

export const PRIVACY: readonly LegalSection[] = [
  {
    id: "scope",
    title: "What this policy covers",
    paragraphs: [
      "This policy covers owlky.com and the hosted Owlky MCP server at owlky.com/mcp. It is operated by [operator name and address]. You can read the docs, copy the code samples and install the Owlky packages without an account. An account is only needed for the MCP server.",
    ],
  },
  {
    id: "collected",
    title: "Data we keep about an account",
    paragraphs: ["When you sign in with GitHub or Google, we keep:"],
    items: [
      "your name, email address and avatar URL, as the provider shares them, and the provider's account ID;",
      "the date the account was created, and your sessions (an expiry date and a random token; no IP address and no browser details);",
      "personal access tokens you create: their name, the first characters, a one-way hash, and the dates they were created, last used and expire;",
      "AI clients you connect through OAuth: the name and redirect addresses the client registered, the permissions you granted and the date;",
      "MCP usage: the date of your last request, a request counter for the current minute (for the rate limit), and the number of calls per tool with the date of the last call;",
      "whether you opted in to product and marketing email, and when you last changed it (off unless you turn it on);",
      "the features your account may use (empty for everyone today).",
    ],
  },
  {
    id: "not-collected",
    title: "Data we don't keep",
    paragraphs: [
      "We never store or log what you send to the MCP server or what it answers: no prompts, no tool arguments and no results. We don't keep the access tokens GitHub and Google return at sign-in. We don't sell or share personal data, and we don't use advertising or tracking cookies.",
    ],
  },
  {
    id: "cookies",
    title: "Cookies",
    paragraphs: [
      "The site sets cookies only for signing in: a session cookie and short-lived cookies that protect the sign-in redirect. They are strictly necessary, HttpOnly, and sent only to owlky.com. The theme you choose is saved in your browser's local storage, not in a cookie.",
    ],
  },
  {
    id: "processors",
    title: "Services that process data for us",
    paragraphs: ["We use these providers to run the service:"],
    items: [
      "GitHub and Google, to sign you in;",
      "Vercel, which hosts the site and the MCP server and processes request data such as IP addresses in its logs, under its own policy;",
      "Neon, which hosts the database.",
    ],
  },
  {
    id: "retention",
    title: "How long we keep it",
    paragraphs: [
      "We keep account data until you delete the account. Sessions expire after 30 days without use. IP addresses are used in memory for the sign-in rate limits and are not written to our database.",
    ],
  },
  {
    id: "rights",
    title: "Your choices and rights",
    paragraphs: [
      "Your account page shows the data above. You can revoke tokens, disconnect clients, change the email opt-in and delete the account there. Deleting removes the account and every row that belongs to it at once. For other requests, such as a copy of your data or a correction, contact [contact email]. Depending on where you live, you may also complain to a data protection authority.",
    ],
  },
  {
    id: "changes",
    title: "Changes",
    paragraphs: [
      "We will post changes on this page with a new date, and tell account holders by email before a change that affects them takes effect.",
    ],
  },
];

export const TERMS: readonly LegalSection[] = [
  {
    id: "service",
    title: "The service",
    paragraphs: [
      "Owlky is an open-source UI component library. The code is licensed under the MIT license, and these terms don't change that license. These terms cover the hosted services at owlky.com: the website and the MCP server at owlky.com/mcp, operated by [operator name].",
    ],
  },
  {
    id: "accounts",
    title: "Accounts",
    paragraphs: [
      "You need an account to use the MCP server. Sign in with your own GitHub or Google account and keep your personal access tokens secret: anyone who has one can use the MCP server as you. Revoke a token you no longer trust on the account page.",
    ],
  },
  {
    id: "use",
    title: "Acceptable use",
    paragraphs: ["When you use the hosted services, you agree not to:"],
    items: [
      "exceed or work around the rate limits (about 60 requests per minute per account), for example with several accounts;",
      "resell or share access to the MCP server, or let others use your tokens;",
      "probe, disrupt or overload the services, or access other people's data.",
    ],
  },
  {
    id: "availability",
    title: "Availability and changes",
    paragraphs: [
      "The free service is provided as is, without a guarantee of availability. We may change, limit or end features, versions or the service, and we will announce changes that remove something you use. Pinned MCP versions, such as /mcp/v0.1, keep their data for as long as the version is offered.",
    ],
  },
  {
    id: "termination",
    title: "Ending your use",
    paragraphs: [
      "You can delete your account at any time. We may suspend accounts that break these terms. Paid features, if they come, will have their own terms.",
    ],
  },
  {
    id: "liability",
    title: "Warranty and liability",
    paragraphs: [
      "To the extent the law allows, the services are provided without warranties, and we are not liable for indirect or consequential damages, or for code you build with answers from the services. [Governing law and venue to be set by the operator.]",
    ],
  },
  {
    id: "contact",
    title: "Contact",
    paragraphs: ["Questions about these terms: [contact email]."],
  },
];

export function LegalPage({
  title,
  sections,
}: {
  title: string;
  sections: readonly LegalSection[];
}) {
  return (
    <article className="max-w-[48rem]">
      <Typography variant="h2" component="h1" className="m-0 mb-3">
        {title}
      </Typography>
      <Typography color="textSecondary" className="m-0 mb-6">
        {`Draft of ${LEGAL_UPDATED}.`}
      </Typography>
      <Alert severity="warning" className="mb-10" data-site-draft="">
        <AlertTitle>Draft for review</AlertTitle>
        This text is a draft. It isn't in effect yet and will change after legal review.
      </Alert>
      {sections.map((section) => (
        <section key={section.id} aria-labelledby={section.id} className="mb-10">
          <Typography variant="h5" component="h2" id={section.id} className="m-0 mb-3">
            {section.title}
          </Typography>
          {section.paragraphs.map((paragraph) => (
            <Typography key={paragraph} className="m-0 mb-3">
              {paragraph}
            </Typography>
          ))}
          {section.items ? (
            <ul className="m-0 ps-6">
              {section.items.map((item) => (
                <li key={item} className="mb-1">
                  <Typography component="span">{item}</Typography>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}
    </article>
  );
}
