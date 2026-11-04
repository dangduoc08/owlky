# Architecture Decision Records

Short, numbered records of decisions that shape the codebase. Change a decision by adding a new
ADR that supersedes the old one — don't rewrite history.

| #                                              | Decision                                                                  | Status   |
| ---------------------------------------------- | ------------------------------------------------------------------------- | -------- |
| [0001](0001-monorepo-and-packages.md)          | Monorepo with five packages and strict boundaries                         | Accepted |
| [0002](0002-design-tokens.md)                  | TypeScript tokens → CSS variables, AA-checked                             | Accepted |
| [0003](0003-styling-architecture.md)           | `data-mt-*` anatomy, zero-specificity CSS in cascade layers, prebuilt CSS | Accepted |
| [0004](0004-shared-core.md)                    | Shared framework-free core for behavior and anatomy                       | Accepted |
| [0005](0005-html-runtime.md)                   | HTML Core Runtime: registry, delegation, lifecycle, idempotency           | Accepted |
| [0006](0006-browser-baseline-and-fallbacks.md) | Browser baseline and native-API fallbacks                                 | Accepted |
| [0007](0007-shared-state-and-versioning.md)    | Page-wide shared state and runtime version policy                         | Accepted |
| [0008](0008-framework-independence.md)         | Framework independence, enforced                                          | Accepted |
| [0009](0009-build-and-publishing.md)           | Build, distribution and publishing                                        | Accepted (publishing trigger superseded by 0012) |
| [0010](0010-testing-strategy.md)               | Testing strategy                                                          | Accepted |
| [0011](0011-foundations-first.md)             | Foundations first; sample components removed (references in git)        | Accepted |
| [0012](0012-release-by-tag.md)                | Release only from `release/v*` tags on main                              | Accepted |

Template: **Context** (why decide) · **Decision** (what) · **Consequences** (trade-offs, follow-ups).
