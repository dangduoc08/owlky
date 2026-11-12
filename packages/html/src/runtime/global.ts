import { supports } from "@owlky/core";
import { createRuntime } from "./runtime.js";
import type { Runtime } from "./types.js";
import { PROTOCOL, VERSION } from "./version.js";

/**
 * The page-wide runtime slot (ADR-0007). Deliberately unversioned so every copy — any version —
 * can see who owns the page. Its shape must never change: `{ protocol, version, runtime }`.
 */
const RUNTIME_SLOT = Symbol.for("owlky.runtime");

interface RuntimeSlot {
  readonly protocol: number;
  readonly version: string;
  readonly runtime: Runtime;
}

/** Per-copy (module) flags, so each copy reports each situation once. */
const reported = { shared: false, conflict: false };

type GlobalWithSlot = typeof globalThis & { [RUNTIME_SLOT]?: RuntimeSlot };

/** A runtime that does nothing: returned to a copy whose protocol conflicts with the owner. */
function createInactiveRuntime(): Runtime {
  const inactive: Runtime = {
    version: VERSION,
    protocol: PROTOCOL,
    active: false,
    supports,
    register: () => inactive,
    start: () => inactive,
    stop: () => {},
    connect: () => {},
    init: () => {},
    destroy: () => {},
    get: () => undefined,
    getOrCreate: () => undefined,
    load: () => Promise.resolve(),
    loaded: () => false,
  };
  return inactive;
}

/**
 * Returns the page-wide runtime, creating it on first call.
 *
 * - First copy on the page: creates and owns the runtime.
 * - Another copy, same protocol: reuses the owner's runtime (no duplicate listeners/instances).
 *   Its components are registered into it; names the owner already has are kept as-is.
 * - Another copy, different protocol: logs an error once and gets an inactive runtime, so two
 *   incompatible runtimes never manage the same elements. The owner keeps working.
 */
export function getRuntime(): Runtime {
  const scope = globalThis as GlobalWithSlot;
  const slot = scope[RUNTIME_SLOT];
  if (!slot) {
    const runtime = createRuntime();
    Object.defineProperty(scope, RUNTIME_SLOT, {
      value: { protocol: PROTOCOL, version: VERSION, runtime } satisfies RuntimeSlot,
      configurable: true,
    });
    return runtime;
  }
  if (slot.protocol === PROTOCOL) {
    if (slot.version !== VERSION && !reported.shared) {
      reported.shared = true;
      console.warn(
        `[owlky] Runtime ${VERSION} found runtime ${slot.version} already active; sharing it. Load one copy of the library to avoid surprises.`,
      );
    }
    return slot.runtime;
  }
  if (!reported.conflict) {
    reported.conflict = true;
    console.error(
      `[owlky] Runtime ${VERSION} (protocol ${PROTOCOL}) is disabled: runtime ${slot.version} (protocol ${slot.protocol}) already manages this page. Load a single version of @owlky/html.`,
    );
  }
  return createInactiveRuntime();
}
