/**
 * An original owl mark for the Motion stories (story-only). Every shape has `pathLength="1"`, so a
 * Motion with `variant="draw"` can trace it.
 */
export function OwlLogo({ size = 160, label }: { size?: number; label: string }) {
  return (
    <svg
      className="sb-motion-logo"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      role="img"
      aria-label={label}
    >
      <path
        pathLength={1}
        d="M14 22 L9 7 L22 13 C25 11 29 10 32 10 C35 10 39 11 42 13 L55 7 L50 22 C53 27 54 32 54 38 C54 51 44 58 32 58 C20 58 10 51 10 38 C10 32 11 27 14 22 Z"
      />
      <circle className="sb-motion-logo-eye" pathLength={1} cx="24" cy="30" r="7" />
      <circle className="sb-motion-logo-eye" pathLength={1} cx="40" cy="30" r="7" />
      <path className="sb-motion-logo-beak" pathLength={1} d="M28 39 L32 46 L36 39 Z" />
    </svg>
  );
}
OwlLogo.displayName = "OwlLogo";
