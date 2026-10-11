# Horizontal workspace tabs: implementation plan

Written 2026-10-11T23:21:19+02:00. Implements [FEATURE.md](./FEATURE.md). Executed in this
order, test first for every task: write the failing test, watch it fail,
write the code, watch it pass, commit.

All new files are under `src/renderer/src/components/workspace-strip/`.
Run a test with `pnpm test <path>`; typecheck with `pnpm tc`.

## Two changes from the spec, found while reading the code

- **Open tabs are saved in the browser's local storage, not in
  `PersistedUIState`.** Adding a field there means editing six upstream
  files, including the schema paired clients exchange. Orca already keeps
  small interface preferences in local storage
  (`landing-preflight-dismissal.ts`), and this needs no upstream edit.
- **A missing workspace's tab is hidden, and removed only once it was seen
  and then disappeared.** Orca has no "all workspaces loaded" signal, and
  remote hosts load late, so dropping unknown tabs at startup would lose
  tabs for workspaces that are merely still loading.

## Tasks

- [x] **1. Tab-list rules** — `open-workspace-tabs.ts`, pure functions:
  `openWorkspaceTab`, `closeWorkspaceTab`, `closeOtherWorkspaceTabs`,
  `neighborAfterClose`, `adjacentWorkspaceTab`,
  `dropRemovedWorkspaceTabs`, `parseStoredWorkspaceTabs`.
- [x] **2. Storage** — `open-workspace-tabs-storage.ts`: read and write the
  list under one local-storage key; unreadable or malformed data yields an
  empty list and never throws.
- [x] **3. Strip state** — `workspace-strip-store.ts`: a small store of its
  own holding the open tab ids, with open / close / close-others actions
  that persist through task 2.
- [x] **4. Adapter** — `workspace-strip-orca-bindings.ts`: the only file
  importing Orca internals (switch workspace, status, status dot, names,
  known workspaces, workspaces needing the user, open the switch palette,
  the setting, shortcut matching).
- [x] **5. Tab** — `WorkspaceStripTab.tsx`: dot, `project / workspace`
  label, tooltip, close button, middle-click, right-click menu.
- [x] **6. Strip** — `WorkspaceStrip.tsx` and `use-open-workspace-tabs.ts`:
  renders the tabs and the + button, scrolls the active tab into view, opens
  a tab for the active workspace and for workspaces needing the user,
  removes tabs of deleted workspaces, handles the three shortcut actions.
- [x] **7. Connect to Orca** — the setting and its default, the toggle in
  Settings, the three shortcut definitions, the mount in
  `AppWorkspaceShell.tsx`.
- [x] **8. Verify** — `pnpm tc`, the feature's tests,
  `pnpm run check:code-quality:changed`, then background screenshots of
  the running app: strip on and off, sidebar open and closed, many tabs.
- [x] **9. Record** — list the exact connection points in FEATURE.md.

## Most likely to bite

1. A stored tab id for a workspace that no longer exists (hidden, not a
   crash; covered in tasks 1 and 6).
2. Corrupt or foreign data under the storage key (task 2).
3. Closing the only visible tab (task 1).
4. The floating workspace panel, which has a workspace id but is not a
   workspace to switch to (never gets a tab; task 6).
5. Sidebar closed: the floating title bar controls overlap the strip's left
   edge (the strip reserves that width; checked by screenshot in task 8).
