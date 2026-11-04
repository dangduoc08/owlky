/** Package version. Kept in sync with package.json by scripts/sync-versions.mjs (checked in tests). */
export const VERSION = "0.0.0";

/**
 * Runtime protocol (ADR-0007). Bump on any breaking change to the runtime ↔ component contract
 * or to the global runtime slot. Copies with the same protocol share one runtime; copies with a
 * different protocol refuse to start instead of fighting over the same elements.
 */
export const PROTOCOL = 1;
