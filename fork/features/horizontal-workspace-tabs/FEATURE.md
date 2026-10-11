# Horizontal workspace tabs

| | |
|---|---|
| Written | 2026-10-11T22:55:56+02:00 |
| Branch | `feat/horizontal-workspace-tabs` |
| Based on | `v1.4.224` |
| Origin | Our own idea; no upstream issue or pull request found (searched 2026-10-11) |
| Status | **Exploring.** No code yet. Not in `fork/features.txt`, so fork builds do not include it |

## The idea

Collapse the left workspace sidebar into a horizontal strip across the top
of the window, so workspaces and their agents are switched like browser
tabs and the sidebar's width goes back to the terminal.

## Open questions

- Is the strip a replacement for the sidebar, or what the sidebar collapses
  into when closed?
- What does one tab show: workspace name only, or also agent state, unread
  dot and branch?
- How do repos and groups appear when there are many workspaces: grouped
  tabs, overflow scrolling, or a dropdown?
- How does it sit next to the existing per-workspace tab strip (terminals,
  editors, browser), which is already a row of tabs?

## Where to start reading

- `src/renderer/src/app-shell/AppWorkspaceShell.tsx` lays out the window
  and mounts the sidebar (`WorktreeSidebar`).
- `src/renderer/src/components/sidebar/` is the sidebar itself;
  `index.tsx` is its root.
- `src/renderer/src/components/tab-bar/` is the existing tab strip, the
  closest thing to reuse for look and drag behaviour.

## Related upstream work

None of these is a horizontal strip, but they touch the same area and may
conflict or be worth building on:

- [#26393](https://github.com/stablyai/orca/issues/26393) / [#26394](https://github.com/stablyai/orca/pull/26394): compact one-row projects in the sidebar.
- [#10153](https://github.com/stablyai/orca/issues/10153) / [#10152](https://github.com/stablyai/orca/pull/10152): swap which edge the workspace list sits on.
- [#21560](https://github.com/stablyai/orca/pull/21560): a worktree's agents as cards inside one tab.
- [#17925](https://github.com/stablyai/orca/issues/17925): session tabs carry no repo, role or state.

## When it is ready

Add `feat/horizontal-workspace-tabs` to `fork/features.txt` on
`ci/fork-build`, and consider opening it upstream as a feature request or
pull request.
