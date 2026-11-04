# ADR-0016: Rename the library to Owlky (`ok` namespace)

**Status:** Accepted (2026-11-04) — renames identifiers used by ADR-0001…0015 (decisions unchanged)

## Context
The project was called "Minimal Tailwind", and its short namespace `mt` came from that name. The
owner renamed the project to **Owlky**. "Minimal" stays as the design style the library follows
(the Minimal UI kit / minimals.cc reference); only the old project name is removed.

## Decision
| Was | Now |
|---|---|
| npm scope `@minimal-tailwind/*` | `@owlky/*` (`tokens`, `styles`, `core`, `react`, `html`) |
| project name "Minimal Tailwind" | "Owlky" |
| anatomy `data-mt-*` | `data-ok-*` |
| CSS variables `--mt-*`, private `--_mt-*` | `--ok-*`, `--_ok-*` |
| events `mt:<component>:<event>` | `ok:<component>:<event>` |
| CDN global `MinimalTailwind` | `Owlky` |
| shared slots `Symbol.for("minimal-tailwind.*")` | `Symbol.for("owlky.*")` |
| bundles `minimal-tailwind.css / .min.css / .js` | `owlky.css / owlky.min.css / owlky.js` |
| log prefix `[minimal-tailwind]`, id prefix `mt` | `[owlky]`, `ok` |

Earlier ADRs, specs and docs were updated to the new identifiers in place (names only).

## Consequences
- Nothing was published under the old name, so no migration path or compatibility aliases are
  needed. The shared-state protocol keys changed with the prefix, so an Owlky runtime never shares
  state with a pre-rename build — by design.
- Owner actions outside the repo: rename the GitHub repository and the local folder, create the
  npm org `@owlky`, replace `OWNER` in the `repository` fields.
