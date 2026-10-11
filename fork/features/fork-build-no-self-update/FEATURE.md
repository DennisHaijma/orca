# Fork builds never self-update

| | |
|---|---|
| Written | 2026-10-11T22:41:03+02:00 |
| Branch | `feat/fork-build-no-self-update` |
| Based on | `v1.4.224` |
| Origin | Written for this fork; no upstream PR |
| Status | Typecheck and unit test not yet run (no local toolchain); the fork build runs them |

## What it does

A build whose version looks like `1.4.224-fork.1` skips every self-update
path: the scheduled check, the menu check, pinned-build selection, update
nudges and updater setup. Checking for updates from the menu reports
"up to date". Official, RC and local builds are unaffected.

## Why

The fork build is installed by Nix into the read-only store and is ad-hoc
signed. Orca's updater points at `stablyai/orca` releases, so without this
it would offer every official release. Accepting one would either fail (the
signature does not match, and the store is read-only) or swap the fork's
features for a stock build. The version that runs is decided by
`nix-config`, not by the app.

## How it works

- `src/main/updater/fork-build-version.ts` adds `isForkBuildVersion(version)`,
  a pure check for the `X.Y.Z-fork.N` shape.
- The six places that already bail out for unpackaged or dev builds
  (`!app.isPackaged || is.dev`) also bail out for a fork version:
  `updater-setup`, `updater-scheduling`, `updater-menu-checks`,
  `updater-build-selection`, `updater-nudge`, `updater-remote-status`.
- The version is stamped at package time through `ORCA_LOCAL_BUILD_VERSION`,
  which Orca's own electron-builder config already honours.

## Keeping it current

Rebase onto each new release tag:

```sh
git rebase --onto <new-tag> <old-tag> feat/fork-build-no-self-update
```

A conflict means upstream changed one of the six guard lines. Re-apply the
extra `|| isForkBuildVersion(app.getVersion())` condition, and check for
new guard sites with:

```sh
grep -rn "app.isPackaged" src/main/updater
```

## When to drop it

Keep it for as long as the fork ships its own builds. It becomes unnecessary
only if the fork is retired.
