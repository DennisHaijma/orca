# Orca fork

A personal fork of [stablyai/orca](https://github.com/stablyai/orca) that
carries a few features ahead of upstream and builds its own macOS app.

## Branches

| Branch | Purpose |
|---|---|
| `ci/fork-build` (default) | This branch: the build workflow and the feature list. Shares no history with upstream. |
| `main` | Untouched mirror of upstream `main`. Never commit to it. |
| `feat/*`, `fix/*` | One branch per feature, based on an upstream release tag. Each has a write-up at `fork/features/<name>/FEATURE.md`. |

Branch names and commit messages follow
[Conventional Commits](https://www.conventionalcommits.org/).

## Features

The build applies the branches listed in [`fork/features.txt`](fork/features.txt),
in order, on top of an upstream release tag.

## Credits

Orca is the work of [stablyai](https://github.com/stablyai/orca) and its
contributors, and is MIT licensed. This fork adds nothing to that claim: it
only carries features until upstream ships them.

| Feature | Author | Source |
|---|---|---|
| `feat/macos-window-glass` | Paweł Kotowski ([@pawel-kotowski](https://github.com/pawel-kotowski)) | [stablyai/orca#24359](https://github.com/stablyai/orca/pull/24359) |
| `feat/fork-build-no-self-update` | Written for this fork | — |

Cherry-picked commits keep their original git author and name the commit
they came from. Each release's notes list the commit authors per feature.
When adding a feature from someone else's pull request, add a row here.

## Building

```sh
gh workflow run fork-build.yml --repo DennisHaijma/orca -f tag=v1.4.224
```

The workflow merges the feature branches onto the tag, runs the tests they
add or change, builds an arm64 macOS app and publishes it as release
`v<upstream version>-fork.<n>`. The app is ad-hoc signed, not notarized, and
never self-updates; `nix-config` decides which build each machine runs.

## Moving to a new upstream release

```sh
git fetch upstream tag v1.4.225 --no-tags
git rebase --onto v1.4.225 v1.4.224 feat/macos-window-glass   # repeat per feature
git push --force-with-lease origin feat/macos-window-glass
gh workflow run fork-build.yml --repo DennisHaijma/orca -f tag=v1.4.225
```

If a feature no longer applies, the build fails before publishing and the
previous release stays the latest.

## Adding a feature

1. Create a branch from the current upstream tag, named `feat/<name>` or `fix/<name>`.
2. Commit the change, or cherry-pick it from a pull request with `git cherry-pick -x`.
3. Add `fork/features/<name>/FEATURE.md` on that branch, with the date and time it was written.
4. Add the branch to `fork/features.txt` here.

## Dropping a feature

Once upstream ships it in a release, remove its line from
`fork/features.txt` and delete the branch.
