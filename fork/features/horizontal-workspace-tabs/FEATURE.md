# Horizontal workspace tabs

| | |
|---|---|
| Written | 2026-10-11T22:41:00+02:00 |
| Last updated | 2026-10-11T23:11:27+02:00 |
| Branch | `feat/horizontal-workspace-tabs` |
| Based on | `v1.4.224` |
| Origin | Our own idea; no upstream issue or pull request found (searched 2026-10-11) |
| Status | **Designing.** Behaviour and layout are decided (below); architecture and testing are proposed but not yet approved. No code yet. Not in `fork/features.txt`, so fork builds do not include it |

## Goal

An optional strip of workspace tabs across the top of the window, like
browser tabs. It should:

- show at a glance which workspaces have agents working or waiting,
- switch workspace in one click, close to the existing tabs, without a
  mouse trip to a wide left sidebar,
- let the sidebar stay closed, giving its width back to the terminal.

It is an extra. The sidebar is not reworked and behaves exactly as today;
the strip is off unless switched on in settings.

## Decisions

Each was chosen by the user during the design session on 2026-10-11.

### Layout

- The strip takes the top (title bar) row, beside the window buttons.
- The existing tab row (terminals, editors, browser tabs) moves down one
  row. Today that row *is* the title bar in the workspace view, so the strip
  costs about 36px of height while it is on. Accepted.
- Sharing the single row was rejected: it would mean editing the existing
  tab strip's overflow and drag code.
- The strip spans the top whether the sidebar is open or closed.
- Empty space in the strip still drags the window.
- On macOS the strip starts after the 80px reserved for the window buttons;
  on Windows and Linux it ends before the window buttons.
- Only the workspace view shows the strip. Settings, Tasks and similar
  pages keep their current title bar.

### What a tab is

- One tab per workspace (not per agent, not per project).
- Label: `project / workspace`, shortened with an ellipsis; the tooltip has
  the full name, branch and status in words.
- The same status dot as the sidebar card, from the same source.
- The active workspace's tab is highlighted like the active tab in the
  existing tab row.

### Which workspaces have tabs

- Opened ones, like a browser. Switching to a workspace by any route
  (sidebar, switch palette, shortcut, CLI) gives it a tab, added at the right.
- A workspace whose agent needs the user (waiting for permission or input)
  gets a tab automatically, without switching to it.
- Working or finished agents do not open tabs on their own.

### Closing

- Close button on hover; middle-click also closes.
- Closing only removes the tab. The workspace, its terminals and its agents
  keep running and stay in the sidebar.
- Closing the active tab switches to the neighbouring tab. The last tab
  cannot be closed.
- A deleted workspace loses its tab.
- Right-click menu: Close, Close others.

### Overflow

- Tabs shrink to a minimum width, then the strip scrolls sideways, keeping
  the active tab in view.

### The + button

- Opens Orca's existing "Switch worktree" palette.

### Keyboard

- Three new actions: next workspace tab, previous workspace tab, close
  workspace tab.
- They ship with no default keys; the user assigns them in Orca's shortcut
  settings. Existing shortcuts are unchanged.

### Memory

- The open tabs and their order are saved with Orca's other window state
  and restored on restart. Tabs for workspaces that no longer exist are
  dropped on load.

### Glass

- The strip uses the title bar's surface, so it follows Interface Glass
  (`feat/macos-window-glass`) when that is on and is solid otherwise. Each
  feature works without the other.

### Left out of the first version

- Dragging tabs to reorder.
- Grouping or colouring tabs by project.
- Pinning tabs.

## Keeping maintenance low

The feature has to survive a rebase onto each upstream release with as few
conflicts as possible.

- New code lives in its own folder. Upstream cannot conflict with files it
  does not have.
- Edits to existing files are single added lines at a few connection
  points, listed below once they exist.
- The sidebar and the existing tab strip are read from, never modified.
- Borrowed Orca internals are called through one adapter file, so an
  upstream rename is a one-file fix.
- Styles use existing utility classes in the feature's own components, not
  additions to the shared `main.css`.
- The fork build type-checks and runs this feature's tests on every
  release; a break fails the build before anything is published.

A large upstream redesign of the title bar or of workspace switching would
still need real rework.

## Orca's own rules that apply

From `AGENTS.md` and `docs/STYLEGUIDE.md`:

- Reuse existing components, state and actions before writing new ones.
- Only existing colour tokens and `components/ui` primitives; no computed
  class-name strings.
- No clickable targets in the macOS window-button band.
- Shortcuts use the platform modifier, never a hard-coded Command key.
- Workspaces may be folders or on a remote host, not only local git
  worktrees.
- Agent status has a single source; this feature only decides how to
  present it.
- Concrete file names (no `utils` or `helpers`), brief comments only, no
  `max-lines` suppressions.

## Proposed architecture (not yet approved)

Existing pieces to reuse:

| Need | Existing piece |
|---|---|
| Switch workspace | `activateAndRevealWorktree` in `src/renderer/src/lib/worktree-activation.ts` |
| Status of a workspace | `useWorktreeActivityStatus` in `src/renderer/src/components/sidebar/` |
| Status dot | `StatusIndicator` in `src/renderer/src/components/sidebar/` |
| Title bar row | `TitlebarMainStrip`, `TitlebarLeftControls`, mounted by `AppWorkspaceShell` in `src/renderer/src/app-shell/` |
| Switch palette | keybinding action `worktree.palette` |
| Shortcut definitions | `src/shared/keybindings/` |
| Saved window state | `PersistedUIState` in `src/shared/persisted-ui-state-types.ts` |
| Settings | `GlobalSettings` in `src/shared/global-settings-types.ts` |

New code, all under `src/renderer/src/components/workspace-strip/`:
the strip, a tab, the open-tabs state, the adapter for the borrowed
internals, and tests.

Connection points in existing files (to be confirmed and listed with exact
lines once written): the mount in the window layout, one setting and its
toggle in Settings, one saved-state field, and the three shortcut actions.

## Still to decide

- Architecture details and the exact connection points.
- How the feature is tested.
- The setting's name and where it sits in Settings.

## Related upstream work

None of these is a horizontal strip, but they touch the same area and may
conflict or be worth building on:

- [#26393](https://github.com/stablyai/orca/issues/26393) / [#26394](https://github.com/stablyai/orca/pull/26394): compact one-row projects in the sidebar.
- [#10153](https://github.com/stablyai/orca/issues/10153) / [#10152](https://github.com/stablyai/orca/pull/10152): swap which edge the workspace list sits on.
- [#21560](https://github.com/stablyai/orca/pull/21560): a worktree's agents as cards inside one tab.
- [#17925](https://github.com/stablyai/orca/issues/17925): session tabs carry no repo, role or state.

## When it is ready

Add `feat/horizontal-workspace-tabs` to `fork/features.txt` on
`ci/fork-build`, and consider proposing it upstream as a feature request
or pull request. If upstream adopts it, this branch can be deleted.
