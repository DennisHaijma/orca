import {
  adjacentWorkspaceTab,
  neighborAfterClose,
  type OpenWorkspaceTabs
} from './open-workspace-tabs'

export type WorkspaceStripActionDeps = {
  visibleTabs: OpenWorkspaceTabs
  activeWorkspaceId: string | null
  activate: (workspaceId: string) => void
  close: (workspaceId: string, visibleTabs: OpenWorkspaceTabs) => void
}

export function closeStripTab(deps: WorkspaceStripActionDeps, workspaceId: string): void {
  if (workspaceId === deps.activeWorkspaceId) {
    const neighbor = neighborAfterClose(deps.visibleTabs, workspaceId)
    if (neighbor === null) {
      return
    }
    // Why first: the active workspace always has a tab, so move off it before removing its tab.
    deps.activate(neighbor)
  }
  deps.close(workspaceId, deps.visibleTabs)
}

export function cycleStripTab(
  deps: WorkspaceStripActionDeps,
  direction: 'next' | 'previous'
): void {
  const target = adjacentWorkspaceTab(deps.visibleTabs, deps.activeWorkspaceId, direction)
  if (target !== null && target !== deps.activeWorkspaceId) {
    deps.activate(target)
  }
}
