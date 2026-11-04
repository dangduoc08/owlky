# ADR-0012: Release only from `release/v*` tags on main

**Status:** Accepted (2026-11-04) — supersedes the *Publishing* trigger of ADR-0009

## Context
The first release workflow ran on every push to `main` (Changesets action: "Version Packages"
PR, then publish). The owner wants pushes to `main` to only run checks, and releases to happen
only when explicitly tagged.

## Decision
- `ci.yml` runs on pull requests and pushes to `main`: checks and tests only, never publishes.
  It is also a reusable workflow (`workflow_call`).
- `release.yml` runs only on a pushed tag matching `release/v**`:
  1. **verify** — the tagged commit is an ancestor of `origin/main`, and
     `scripts/check-release.mjs` confirms the tag is `release/v<semver>` and equals the version
     of all five packages and the HTML runtime `VERSION`;
  2. **ci** — the full `ci.yml` (lint, types, build, boundaries, size, package validity, unit
     tests in 3 browsers, e2e in 4 projects, audit);
  3. **publish** — `pnpm release` (`pnpm -r publish` of `packages/*`, which replaces
     `workspace:*` and skips versions already on npm), with provenance, in the `npm`
     GitHub environment.
- Versioning stays with Changesets: changesets in PRs → `pnpm version-packages` → commit to main
  → tag that commit.

## Release procedure
```sh
pnpm version-packages                      # bump all packages + runtime VERSION, update changelogs
git commit -am "chore: release v1.2.3"     # via PR or directly to main
git tag release/v1.2.3 <that commit on main>
pnpm check:release release/v1.2.3          # optional local pre-check
git push origin release/v1.2.3
```

## Consequences
- A tag on a branch other than `main`, or with a mismatching version, fails before anything runs.
- Re-pushing a tag for an already published version publishes nothing (pnpm skips it).
- Until npm trusted publishing is configured per package, the workflow needs an `NPM_TOKEN`
  secret; afterwards OIDC is used and the secret should be deleted. Protect the `npm`
  environment (required reviewers) if releases need an approval step.
