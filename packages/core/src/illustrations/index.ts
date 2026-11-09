/*
 * `@owlky/core/illustrations` (ADR-0041): the illustration set as data, one export per picture so
 * bundlers keep only the ones an app imports. Render them with React's `Illustration` or the HTML
 * runtime (`@owlky/html/illustrations`). All artwork is original (MIT). The parts the pictures share
 * (`backdrop`, `person`, …) are exported too, for custom art in the same style
 * (docs/illustrations-style.md).
 */
import type { Illustration } from "../illustration/illustration.js";
import { avatarShape } from "./data/avatar-shape.js";
import { comingSoon } from "./data/coming-soon.js";
import { emailSent } from "./data/email-sent.js";
import { emptyContent } from "./data/empty-content.js";
import { error403 } from "./data/error-403.js";
import { error404 } from "./data/error-404.js";
import { error500 } from "./data/error-500.js";
import { maintenance } from "./data/maintenance.js";
import { noConnection } from "./data/no-connection.js";
import { noResults } from "./data/no-results.js";
import { orderComplete } from "./data/order-complete.js";
import { resetPassword } from "./data/reset-password.js";
import { signIn } from "./data/sign-in.js";
import { upgrade } from "./data/upgrade.js";
import { upload } from "./data/upload.js";
import { welcome } from "./data/welcome.js";

export type {
  Illustration,
  IllustrationNode,
  IllustrationTone,
} from "../illustration/illustration.js";
export type {
  GroundShadowOptions,
  IllustrationBrandTone,
  IllustrationPart,
  IllustrationSkinTone,
  IllustrationSparkleTone,
  LinesOptions,
  PaperOptions,
  PersonOptions,
  ScreenOptions,
} from "./parts.js";
export {
  backdrop,
  cloud,
  dot,
  groundShadow,
  illustrationParts,
  lines,
  paper,
  person,
  plant,
  screen,
  sparkle,
} from "./parts.js";
export {
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
};

/** Every illustration, for catalogs and the HTML runtime's default set (imports all of them). */
export const illustrations: readonly Illustration[] = [
  error404,
  error403,
  error500,
  noConnection,
  maintenance,
  comingSoon,
  emptyContent,
  noResults,
  signIn,
  emailSent,
  resetPassword,
  orderComplete,
  upload,
  welcome,
  upgrade,
  avatarShape,
];
