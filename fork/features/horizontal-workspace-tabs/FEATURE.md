# Horizontal workspace tabs

| | |
|---|---|
| Written | 2026-10-11T22:41:00+02:00 |
| Last updated | 2026-10-12T20:32:03+02:00 |
| Branch | `feat/horizontal-workspace-tabs` |
| Based on | `v1.4.224` |
| Origin | Our own idea; no upstream issue or pull request found (searched 2026-10-11) |
| Status | **Implemented and in the fork build** (listed in `fork/features.txt` since `v1.4.224-fork.2`). Unit tests, typecheck, Orca's code-quality gate and an end-to-end test in the real app pass on macOS |

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
- Label: the workspace name, shortened with an ellipsis. The project is
  named once ahead of its group of tabs (see "Order of the tabs").
- The same status dot as the sidebar card, from the same source.
- A small agent count next to the name when the workspace has agents.
- Hovering a tab opens a details card: workspace, project and branch, the
  status in words, how many agents and terminals it has, and the sidebar's
  own agent list for that workspace.
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

### Order of the tabs

Added 2026-10-12, after the first try in the running app: with tabs in the
order they were opened, workspaces of one project ended up scattered.

- Setting "Workspace Tab Order", shown under the strip's toggle while the
  strip is on, with two choices:
  - **By project** (default): tabs of one project sit together, the
    project name is shown once ahead of them, and a divider separates
    projects. Projects follow the order they were added to Orca; tabs
    inside a project keep the order they were opened.
  - **Order opened**: one flat row, each tab labelled `project / workspace`.
- The saved list stays in open order either way; grouping is only how it
  is shown, so switching the setting loses nothing.
- Next/previous tab and "which tab becomes active after closing" follow
  the order shown.
- A name is never repeated: a workspace called the same as its project is
  labelled with the one name.

### Left out of the first version

- Dragging tabs to reorder.
- Colouring tabs by project.
- Pinning tabs.
- The sidebar card's issue, pull request and comment details in the tab's
  hover card. They are built from the sidebar card's own controller and
  cannot be reused without editing sidebar files.

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
| Agents of a workspace | `useWorktreeAgentRows` and the list `WorktreeCardAgents` in `src/renderer/src/components/sidebar/` |
| Hover card | `HoverCard` in `src/renderer/src/components/ui/hover-card.tsx`, with its `workspace-details` variant |
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
| `WorkspaceStripTab.tsx` | One tab: dot, label, agent count, hover card, close button, right-click menu |
| `WorkspaceStripTabDetails.tsx` | The contents of a tab's hover card |
| `open-workspace-tabs.ts` | The ordered list of open tabs and its rules (open, close, pick neighbour, drop deleted, restore, group by project). Plain functions, no UI |
| `use-open-workspace-tabs.ts` | Connects that list to Orca's state: adds a tab when the active workspace changes or an agent needs the user, and saves the list |
| `workspace-strip-orca-bindings.ts` | The adapter: the only file that imports Orca's switch action, status hook and status dot |

### Names

- Setting: `workspaceTabStrip` (boolean, default `false`), with its toggle
  in Settings under Appearance.
- Setting: `workspaceTabStripOrder` (`'project'` or `'opened'`, default
  `'project'`; absent counts as `'project'`).
- Saved state: the ordered list of open workspace ids, in the browser's
  local storage under `orca.workspaceStrip.openTabs`. Not in
  `PersistedUIState`: that would mean editing six upstream files, and Orca
  already keeps small interface preferences in local storage.
- Shortcut actions: `workspaceStrip.nextTab`, `workspaceStrip.previousTab`,
  `workspaceStrip.closeTab`, all with no default keys.
- "An agent needs the user" means the workspace status is `permission`,
  the same value the sidebar labels "Needs permission".

### Connection points in existing files

Seven files: 96 added lines and one changed line, nothing rewritten. This is the
checklist for resolving a rebase conflict.

| File | Added |
|---|---|
| `src/renderer/src/app-shell/AppWorkspaceShell.tsx` | The import, and `{layout.workspaceChromeActive ? <WorkspaceStrip /> : null}` as the first child of the center column |
| `src/shared/global-settings-types.ts` | `workspaceTabStrip?: boolean` and `workspaceTabStripOrder?`, after `compactWorktreeCards` |
| `src/shared/default-global-settings.ts` | `workspaceTabStrip: false` and `workspaceTabStripOrder: 'project'`, after `compactWorktreeCards` |
| `src/renderer/src/components/settings/AppearanceInterfaceSection.tsx` | The "Workspace Tab Strip" toggle and the "Workspace Tab Order" choice, just before the advanced disclosure |
| `src/shared/keybindings/types.ts` | The three action ids, before `PluginKeybindingActionId` |
| `src/shared/keybindings/definitions-core-4.ts` | The three definitions, appended at the end |
| `src/renderer/src/components/tab-group/TabGroupPanel.tsx` | `workspaceStripOn`, and `&& !workspaceStripOn` on the collapsed-sidebar spacer |

The setting sits next to `compactWorktreeCards`, not next to
`windowBackgroundBlur`, because `feat/macos-window-glass` adds its
settings there and the two features must not conflict with each other.

Not edited: anything under `components/sidebar/` or `components/tab-bar/`,
and `assets/main.css`. Both folders are imported from, through
`workspace-strip-orca-bindings.ts` only.

### Differences from the design

- **`TabGroupPanel.tsx` is a seventh connection point.** With the sidebar
  closed, the existing tab row reserved space for the floating title bar
  controls. Those now sit over the strip's row, so the reservation is
  skipped while the strip is on. Without this the lower row had a gap.
- **"An agent needs the user" comes from Orca's agent-status store**
  (`hasPermission`), not from terminal-title guesses. A tab the user closed
  does not reopen while the same agent is still waiting.
- **The toggle is not in the settings search index.** It filters correctly
  on the Appearance page; adding it to the global index would mean editing
  `appearance-search.ts`.
- **Interface text uses inline English fallbacks**; the translation
  catalogs are not edited. Orca's localization check was not run.
- **A tab is identified by workspace id alone.** If the same workspace id
  exists on two hosts, the tab activates Orca's default for that id.

- **Projects are ordered as Orca's project list holds them**, which is the
  order they were added. The sidebar can sort and group projects its own
  way; the strip does not follow that.
- **The agent count includes finished agents the sidebar still lists**,
  because it counts the same rows the sidebar shows.

## Testing

| Test | What it proves |
|---|---|
| `open-workspace-tabs.test.ts` | Grouping by project and its ordering. The tab-list rules: open, no duplicates, close, last tab stays, neighbor choice, cycling, deleted workspaces dropped, late-loading workspaces kept, only newly waiting agents open a tab, stored data parsed safely |
| `open-workspace-tabs-storage.test.ts` | Saving and restoring; corrupt, missing or failing storage never throws |
| `workspace-strip-store.test.ts` | The store starts from saved tabs, saves on change, and does not rewrite when nothing changed |
| `workspace-strip-actions.test.ts` | Closing the active tab switches to its neighbor first; the last tab stays; next/previous cycling |
| `workspace-strip-keybindings.test.ts` | The three shortcut actions exist and ship unassigned on every platform |
| `WorkspaceStripTab.test.tsx` | A tab renders project, workspace name and status dot; the active tab is marked; no close button when it cannot close; nothing for an unknown workspace; no project inside a group; no repeated name; the agent count |
| `WorkspaceStripTabDetails.test.tsx` | The hover card shows workspace, project, branch, status and the agent and terminal counts, and lists agents only when there are some |
| `WorkspaceStrip.test.tsx` | Nothing while the setting is off; one tab per open workspace; the only tab cannot be closed; each project named once with a divider between projects; project left on the tabs when not grouped |
| `tests/e2e/workspace-strip.spec.ts` | In the real app: off by default; appears as the top row above the existing tabs; a second workspace gets a tab; clicking switches; sidebar closed keeps tabs clear of the title bar controls and leaves no gap below; closing the active tab moves to its neighbor and keeps the workspace; the last tab has no close button; the project is named once and the order setting switches grouping off and on; hovering a tab shows its details card |

Run them with:

```sh
pnpm test src/renderer/src/components/workspace-strip
pnpm exec playwright test tests/e2e/workspace-strip.spec.ts --config tests/playwright.config.ts --project electron-headless
```

Set `ORCA_WORKSPACE_STRIP_SCREENSHOT_DIR` to also save screenshots of the
two tab rows. They are clipped to those rows on purpose, so a screenshot
never contains terminal output.

Passing on macOS as of the last update: the 59 unit tests, `pnpm tc`,
`pnpm run check:code-quality:changed`, the end-to-end test, and Orca's
existing layout, settings, tab-group and shortcut tests (1803 tests; these
were last run before the tab order and hover card were added).

Not yet checked:

- The three shortcuts pressed in the running app (their matching is Orca's
  own, tested; the wiring is not exercised end to end).
- Many tabs overflowing the strip.
- The hover card's agent list and the agent count with real agents
  running; the test app has none, so only the empty case ran end to end.
- The "Workspace Tab Order" control clicked in the running app.
- The strip together with Interface Glass, which lives on another branch.
- The settings toggle clicked in the running app (the test enables the
  setting directly).
- Windows and Linux.
- `pnpm lint` in full, including the localization catalog check.

## Working on this branch

Orca needs Node 24 and pnpm 12.8.1. Then `pnpm install`, and the commands
under Testing.

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
