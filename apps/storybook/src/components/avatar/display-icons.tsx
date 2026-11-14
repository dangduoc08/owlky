/** Demo portraits in `apps/storybook/public/avatars` (story-only assets). */
export const PEOPLE = [
  "Amara Okafor",
  "Mateo Silva",
  "Linh Tran",
  "Jonas Berg",
  "Priya Nair",
  "Sofia Marino",
  "Kenji Ito",
] as const;
export const portrait = (i: number) => `avatars/avatar-${i}.svg`;
