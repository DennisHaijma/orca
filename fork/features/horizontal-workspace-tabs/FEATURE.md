# Horizontal workspace tabs

| | |
|---|---|
| Written | 2026-10-11T22:41:00+02:00 |
| Last updated | 2026-10-11T23:15:46+02:00 |
| Branch | `feat/horizontal-workspace-tabs` |
| Based on | `v1.4.224` |
| Origin | Our own idea; no upstream issue or pull request found (searched 2026-10-11) |
| Status | **Implementing.** Plan in [PLAN.md](./PLAN.md). Not in `fork/features.txt`, so fork builds do not include it |

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

- The open tabs and their order are saved and restored on restart.
- A tab whose workspace is not known is hidden. It is removed only when its
  workspace was seen and then disappeared, because remote workspaces can
  load late and must not lose their tabs at startup.

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

## Architecture

Approved 2026-10-11, on the condition that it stays maintainable, modular
and within Orca's contribution rules.

### Existing pieces reused

| Need | Existing piece |
|---|---|
| Switch workspace | `activateAndRevealWorktree` in `src/renderer/src/lib/worktree-activation.ts` |
| Status of a workspace | `useWorktreeActivityStatus` in `src/renderer/src/components/sidebar/` |
| Status dot | `StatusIndicator` in `src/renderer/src/components/sidebar/` |
| Title bar row | `TitlebarMainStrip`, `TitlebarLeftControls`, mounted by `AppWorkspaceShell` in `src/renderer/src/app-shell/` |
| Switch palette | keybinding action `worktree.palette` |
| Shortcut definitions | `src/shared/keybindings/` |
| Settings | `GlobalSettings` in `src/shared/global-settings-types.ts` |

### New files

All under `src/renderer/src/components/workspace-strip/`, each with its
test next to it.

| File | Job |
|---|---|
| `WorkspaceStrip.tsx` | The row: lays out the tabs, the + button, scrolling |
| `WorkspaceStripTab.tsx` | One tab: dot, label, tooltip, close button, right-click menu |
| `open-workspace-tabs.ts` | The ordered list of open tabs and its rules (open, close, pick neighbour, drop deleted, restore). Plain functions, no UI |
| `use-open-workspace-tabs.ts` | Connects that list to Orca's state: adds a tab when the active workspace changes or an agent needs the user, and saves the list |
| `workspace-strip-orca-bindings.ts` | The adapter: the only file that imports Orca's switch action, status hook and status dot |

### Names

- Setting: `workspaceTabStrip` (boolean, default `false`), with its toggle
  in Settings under Appearance.
- Saved state: the ordered list of open workspace ids, in the browser's
  local storage under `orca.workspaceStrip.openTabs`. Not in
  `PersistedUIState`: that would mean editing six upstream files, and Orca
  already keeps small interface preferences in local storage.
- Shortcut actions: `workspaceStrip.nextTab`, `workspaceStrip.previousTab`,
  `workspaceStrip.closeTab`, all with no default keys.
- "An agent needs the user" means the workspace status is `permission`,
  the same value the sidebar labels "Needs permission".

### Connection points in existing files

Five files, each with a few added lines and nothing rewritten. This list is
the checklist for resolving a rebase conflict; exact lines are filled in as
they are written.

| File | Added |
|---|---|
| `src/renderer/src/app-shell/AppWorkspaceShell.tsx` | Mounts the strip above the existing row when the setting is on |
| `src/shared/global-settings-types.ts` | The `workspaceTabStrip` setting |
| `src/shared/default-global-settings.ts` | Its default, `false` |
| An Appearance settings section in `src/renderer/src/components/settings/` | The toggle |
| A definitions file in `src/shared/keybindings/` | The three shortcut actions |

Not edited: anything under `components/sidebar/` or `components/tab-bar/`,
and `assets/main.css`.

## Testing

Tests are written first: a failing test for each behaviour, then the code
that makes it pass.

| Test file | What it proves |
|---|---|
| `open-workspace-tabs.test.ts` | Opening adds at the right and never duplicates; closing the active tab picks the neighbour; the last tab cannot be closed; deleted workspaces are dropped; a workspace that needs the user gets a tab without becoming active; restoring skips workspaces that no longer exist |
| `WorkspaceStripTab.test.tsx` | A tab renders its label and status dot; click switches workspace; middle-click and the close button close it |
| `WorkspaceStrip.test.tsx` | One tab per open workspace; the active one is marked; the strip is absent when the setting is off |
| Orca's existing keybinding tests | The three new actions cause no shortcut conflicts and are reported as unassigned |

Orca's required checks before a change is called done: `pnpm tc`,
`pnpm test <files>`, and `pnpm run check:code-quality:changed`.

Checked in the running app, using a background launch and screenshots
through the developer protocol as Orca's rules require (never bringing a
test window to the front): strip on and off, sidebar open and closed, many
tabs, and Interface Glass on.

Not covered: Windows and Linux can only be written to Orca's conventions
here, not seen running.

On every upstream release the fork build type-checks and runs these tests.

## Before implementation can start

Orca needs Node 24 and pnpm 12.8.1. The machine this was designed on has
Node 23.8 and no pnpm, so none of the checks can run there until both are
installed.

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
