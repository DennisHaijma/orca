import { useCallback, useEffect, useMemo, useRef } from 'react'
import { workspacesNewlyNeedingUser, type OpenWorkspaceTabs } from './open-workspace-tabs'
import { closeStripTab, cycleStripTab, type WorkspaceStripActionDeps } from './workspace-strip-actions'
import {
  activateWorkspace,
  useActiveWorkspaceId,
  useKnownWorkspaceTabs,
  useWorkspaceIdsNeedingUser,
  useWorkspaceStripShortcuts
} from './workspace-strip-orca-bindings'
import { useWorkspaceStripStore, workspaceStripStore } from './workspace-strip-store'

export type OpenWorkspaceTabsController = {
  visibleTabs: OpenWorkspaceTabs
  activeWorkspaceId: string | null
  activateTab: (workspaceId: string) => void
  closeTab: (workspaceId: string) => void
  closeOtherTabs: (workspaceId: string) => void
}

/** Keeps the strip's tab list in step with Orca: the active workspace, agents needing the user, deletions. */
export function useOpenWorkspaceTabs(): OpenWorkspaceTabsController {
  const tabs = useWorkspaceStripStore((s) => s.tabs)
  const visibleTabs = useKnownWorkspaceTabs(tabs)
  const activeWorkspaceId = useActiveWorkspaceId()
  const needingUser = useWorkspaceIdsNeedingUser()

  useEffect(() => {
    if (activeWorkspaceId !== null) {
      workspaceStripStore.getState().open(activeWorkspaceId)
    }
  }, [activeWorkspaceId])

  const previouslyNeedingUser = useRef<ReadonlySet<string>>(new Set())
  useEffect(() => {
    for (const id of workspacesNewlyNeedingUser(previouslyNeedingUser.current, needingUser)) {
      workspaceStripStore.getState().open(id)
    }
    previouslyNeedingUser.current = new Set(needingUser)
  }, [needingUser])

  const previouslyVisible = useRef<ReadonlySet<string>>(new Set())
  useEffect(() => {
    const visible = new Set(visibleTabs)
    workspaceStripStore.getState().dropRemoved(previouslyVisible.current, visible)
    previouslyVisible.current = visible
  }, [visibleTabs])

  const deps = useMemo<WorkspaceStripActionDeps>(
    () => ({
      visibleTabs,
      activeWorkspaceId,
      activate: activateWorkspace,
      close: (workspaceId, visible) => workspaceStripStore.getState().close(workspaceId, visible)
    }),
    [visibleTabs, activeWorkspaceId]
  )

  const closeTab = useCallback((workspaceId: string) => closeStripTab(deps, workspaceId), [deps])
  const closeOtherTabs = useCallback((workspaceId: string) => {
    activateWorkspace(workspaceId)
    workspaceStripStore.getState().closeOthers(workspaceId)
  }, [])

  const shortcutHandlers = useMemo(
    () => ({
      nextTab: () => cycleStripTab(deps, 'next'),
      previousTab: () => cycleStripTab(deps, 'previous'),
      closeTab: () => {
        if (deps.activeWorkspaceId !== null) {
          closeStripTab(deps, deps.activeWorkspaceId)
        }
      }
    }),
    [deps]
  )
  useWorkspaceStripShortcuts(shortcutHandlers)

  return { visibleTabs, activeWorkspaceId, activateTab: activateWorkspace, closeTab, closeOtherTabs }
}
