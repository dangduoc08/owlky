/** Demo icons for the Avatar, Badge, Chip and Label stories (decorative, same SVG as the snippets). */
export function FolderIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path
        d="M3 7.5A2.5 2.5 0 0 1 5.5 5h4l2 2h7A2.5 2.5 0 0 1 21 9.5v7a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 16.5z"
        fill="currentColor"
      />
    </svg>
  );
}

export function MailIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path
        d="M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zm0 2v.4l8 5.1 8-5.1V7z"
        fill="currentColor"
        fillRule="evenodd"
      />
    </svg>
  );
}

export function FaceIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path
        d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 2a8 8 0 1 1 0 16 8 8 0 0 1 0-16zM8 13.5a4.5 4.5 0 0 0 8 0z"
        fill="currentColor"
        fillRule="evenodd"
      />
    </svg>
  );
}

export function CheckIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path
        d="m5 12.5 4.5 4.5L19 7.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TrashIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M9 3h6l1 2h4v2H4V5h4zm-3 6h12l-1 12H7z" fill="currentColor" />
    </svg>
  );
}

for (const [name, icon] of Object.entries({ FolderIcon, MailIcon, FaceIcon, CheckIcon, TrashIcon }))
  (icon as { displayName?: string }).displayName = name;

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
