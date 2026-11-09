import { illustrationOptions } from "@owlky/core";
import {
  avatarShape,
  comingSoon,
  emailSent,
  emptyContent,
  error403,
  error404,
  error500,
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
 * Illustration stories: one per category, one group per picture. The HTML snippets
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
