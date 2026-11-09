import { illustrationOptions } from "@owlky/core";
import {
  avatarShape,
  comingSoon,
  emailSent,
  emptyContent,
  error403,
  error404,
  error500,
  illustrations,
  maintenance,
  noConnection,
  noResults,
  orderComplete,
  resetPassword,
  signIn,
  upgrade,
  upload,
  welcome,
} from "@owlky/core/illustrations";
import { Avatar, Illustration } from "@owlky/react";
import type { ReactGroup } from "../../helpers/groups.js";

/*
 * Illustration stories: "All" (the contact sheet), then one per category, one group per picture.
 * "All" reuses the category groups and snippets, in the set's order. The HTML snippets
 * (packages/html/src/components/illustration/examples) are generated from these examples:
 * `pnpm build && node apps/storybook/scripts/illustration-snippets.mjs`.
 */

/** Options that change every example at once (Controls, ADR-0015). */
export const ILLUSTRATION_CONTROLS = {
  schema: illustrationOptions,
  keys: ["color", "size"],
} as const;

/** Group title ↔ snippet file suffix, per story. */
export const ILLUSTRATION_FILES: Record<string, readonly (readonly [string, string])[]> = {
  errors: [
    ["Page not found (error404)", "error-404"],
    ["Access denied (error403)", "error-403"],
    ["Server error (error500)", "error-500"],
    ["No connection (noConnection)", "no-connection"],
  ],
  states: [
    ["Empty content (emptyContent)", "empty-content"],
    ["No results (noResults)", "no-results"],
    ["Maintenance (maintenance)", "maintenance"],
    ["Coming soon (comingSoon)", "coming-soon"],
  ],
  account: [
    ["Sign in (signIn)", "sign-in"],
    ["Email sent (emailSent)", "email-sent"],
    ["Reset password (resetPassword)", "reset-password"],
  ],
  dashboard: [
    ["Welcome (welcome)", "welcome"],
    ["Upgrade (upgrade)", "upgrade"],
    ["Order complete (orderComplete)", "order-complete"],
    ["Upload (upload)", "upload"],
  ],
  shapes: [["Avatar shape (avatarShape)", "avatar-shape"]],
};

const PICTURES = {
  errors: [error404, error403, error500, noConnection],
  states: [emptyContent, noResults, maintenance, comingSoon],
  account: [signIn, emailSent, resetPassword],
  dashboard: [welcome, upgrade, orderComplete, upload],
};

const groupsOf = (story: keyof typeof PICTURES): ReactGroup[] =>
  PICTURES[story].map((picture, index) => ({
    title: ILLUSTRATION_FILES[story]?.[index]?.[0] ?? picture.name,
    content: <Illustration illustration={picture} />,
  }));

export const illustrationStories: Record<string, ReactGroup[]> = {
  errors: groupsOf("errors"),
  states: groupsOf("states"),
  account: groupsOf("account"),
  dashboard: groupsOf("dashboard"),
  shapes: [
    {
      title: "Avatar shape (avatarShape)",
      content: (
        <div className="sb-illustration-cover">
          <Illustration illustration={avatarShape} size={144} />
          <Avatar color="primary" size={64}>
            JS
          </Avatar>
        </div>
      ),
    },
  ],
};

/**
 * The "All" story (the contact sheet of the set): every picture of `illustrations`, in its order,
 * as [category story, group index]. A picture missing from the category stories fails here.
 */
export const ILLUSTRATION_ALL: readonly (readonly [story: string, index: number])[] =
  illustrations.map((picture) => {
    for (const [story, files] of Object.entries(ILLUSTRATION_FILES)) {
      const index = files.findIndex(([, file]) => file === picture.name);
      if (index >= 0) return [story, index] as const;
    }
    throw new Error(`Illustration "${picture.name}" is in no story of ILLUSTRATION_FILES.`);
  });

/** React groups of the "All" story. */
export const illustrationAll: ReactGroup[] = ILLUSTRATION_ALL.flatMap(
  ([story, index]) => illustrationStories[story]?.[index] ?? [],
);
