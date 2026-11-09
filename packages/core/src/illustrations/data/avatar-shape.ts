import type { Illustration } from "../../illustration/illustration.js";

/** Avatar shape: the paper-colored curve that cuts a profile cover around an avatar. Original artwork (MIT). */
export const avatarShape: Illustration = {
  name: "avatar-shape",
  viewBox: "0 0 144 62",
  nodes: [
    {
      tag: "path",
      tone: "paper",
      attrs: { d: "M0 62C30 62 42 56 52 38 60 24 64 10 72 10s12 14 20 28c10 18 22 24 52 24Z" },
    },
  ],
};
