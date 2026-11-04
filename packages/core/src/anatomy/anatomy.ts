/*
 * Anatomy: the single mapping from component options to DOM attributes. React spreads these
 * objects; HTML snippets are written to match them (verified by the e2e anatomy parity test).
 * Defaults are emitted explicitly so rendered markup is self-describing.
 *
 * Each component adds a `<name>Attributes(options)` function here (see AGENTS.md checklist).
 */

export type DataAttributes = { [key: `data-mt-${string}`]: string };
