# macOS window glass

| | |
|---|---|
| Written | 2026-10-11T22:41:20+02:00 |
| Branch | `feat/macos-window-glass` |
| Based on | `v1.4.224` |
| Author | Paweł Kotowski ([@pawel-kotowski](https://github.com/pawel-kotowski)) |
| Origin | [stablyai/orca#24359](https://github.com/stablyai/orca/pull/24359), head `3956c5fef3` (12 commits) |
| Requested in | [#25068](https://github.com/stablyai/orca/issues/25068), [#8797](https://github.com/stablyai/orca/issues/8797) |
| Status | Cherry-picked; not yet built or run. Upstream tested it on macOS 26 only, so macOS 15 is unverified |

## Credit

This feature is the work of **Paweł Kotowski**
([@pawel-kotowski](https://github.com/pawel-kotowski)), taken unchanged from
his pull request [stablyai/orca#24359](https://github.com/stablyai/orca/pull/24359)
apart from the one conflict described below. Every commit on this branch
keeps him as its git author and names the original commit it was
cherry-picked from. This fork only carries the work until upstream merges
it; it claims no authorship. Orca is MIT licensed.

## What it does

Makes **Window Blur** work on macOS. Terminals and the native chat show the
blurred desktop behind them, and an opt-in **Interface Glass** setting
extends that to the sidebars, title bar, tab strip, status bar and full
pages. Editors, dialogs and content cards stay solid.

## Why

On stock Orca the macOS blur toggle does nothing: the effect was removed in
#10682 because the old implementation cost about 5 W of GPU power
(#8482). This is the upstream fix, carried here until it ships in a release.

## Settings

All under **Settings → Terminal → Window**. Window Blur needs a restart;
the others apply live once the window was created with glass.

| Setting | Key | Default |
|---|---|---|
| Window Blur | `windowBackgroundBlur` | off |
| Background Opacity (terminals) | `terminalBackgroundOpacity` | existing |
| Chat Glass Opacity | `nativeChatGlassOpacity` | 0.6 |
| Terminals Use Chat Glass | `terminalChatGlass` | off |
| Interface Glass | `interfaceGlass` | off |
| Interface Glass Opacity | `interfaceGlassOpacity` | 0.75 |

## How it works

- `src/main/window/createMainWindow.ts` creates the window with
  `vibrancy: 'under-window'`, `visualEffectState: 'active'` and a clear
  `backgroundColor`. It never sets `transparent: true`, which is what
  caused the old GPU cost.
- `src/shared/window-glass.ts` holds the defaults and the
  `--orca-window-glass` argument that tells the renderer the window has
  glass.
- `src/renderer/src/assets/main.css` has one glass block that swaps solid
  panel fills for the theme colour at the chosen alpha.
- `src/renderer/src/components/settings/MacWindowGlassSettings.tsx` is the
  new settings panel.

The PR author measured +39 mW idle and about +75 mW under heavy terminal
load with glass on.

## Differences from the PR

One conflict when moving the commits onto `v1.4.224`:
`src/renderer/src/components/sidebar/index.tsx`. The release had renamed
the sidebar's ref and dropped a drop-target attribute, so the release's
markup was kept and only the PR's `worktree-sidebar-panel` class was added.
Every commit carries a `(cherry picked from commit …)` line naming its
original.

## Keeping it current

Rebase onto each new release tag:

```sh
git rebase --onto <new-tag> <old-tag> feat/macos-window-glass
```

To take newer commits the author pushed to the PR, cherry-pick what is new
since the recorded head:

```sh
git fetch upstream pull/24359/head
git cherry-pick -x 3956c5fef3..FETCH_HEAD
```

Then update the head recorded in the table above.

## When to drop it

Delete this branch and remove it from the fork's feature list once #24359
is merged and included in a release tag.
