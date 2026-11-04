# ADR-0007: Page-wide shared state and runtime version policy

**Status:** Accepted

## Context

A page may contain React and HTML components, the CDN bundle _and_ an npm bundle, or two library
versions. Overlays must still stack correctly and nothing may be initialized twice. Global state
must stay minimal.

## Decision

### What is global (and nothing else)

| Key (`Symbol.for`)               | Contents                                                | Why it must be shared                                           |
| -------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------- |
| `owlky.runtime`       | `{ protocol, version, runtime }` (shape frozen forever) | One runtime per page: no duplicate listeners/instances          |
| `owlky.layer-stack@1` | `{ layers: Element[] }`                                 | Escape/backdrop only for the topmost overlay, across all copies |
| `owlky.scroll-lock@1` | `{ count, saved }`                                      | Nested/parallel overlays must not unlock the page early         |

Everything else is module- or instance-scoped: the instance registry lives inside the runtime;
ids use a per-copy random prefix (no shared counter); warnings are per-copy flags. The only
`window` property is `Owlky`, set by the CDN bundle.

Shared-state keys embed a **protocol number**. Changing a shape bumps it, so incompatible copies
use separate state instead of corrupting each other (they stop coordinating, they don't crash).
The runtime slot is unversioned on purpose so every copy can see who owns the page.

### Runtime versions on one page (`getRuntime()`)

| Situation                                         | Behavior                                                                                                                                                                               |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| First copy                                        | Creates and owns the runtime.                                                                                                                                                          |
| Same protocol, same version (script loaded twice) | Reuses the owner silently. `register()` of existing names is a no-op.                                                                                                                  |
| Same protocol, different version                  | Reuses the owner; logs one `console.warn`. New component names from the newer copy are added.                                                                                          |
| Different protocol                                | Logs one `console.error` naming both versions and gets an **inactive** runtime (`active: false`, all methods no-ops). The owner keeps working; the second copy never touches the page. |

`PROTOCOL` (in `runtime/version.ts`) is bumped with any breaking change to the runtime ↔
component contract, which also means a major release.

## Consequences

- Two incompatible versions degrade predictably: one works, the other is clearly reported.
- Shared-state shapes are part of the public contract and need the same care as APIs.
