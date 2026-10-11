// The only file in this folder that imports Orca internals; a rename upstream is fixed here.
import { useEffect, useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useAppStore } from '@/store'
import { activateAndRevealWorktree } from '@/lib/worktree-activation'
import { getShortcutPlatform } from '@/lib/shortcut-platform'
import { hasVisibleOverlay } from '@/lib/visible-overlay'
import { getWorktreeStatusLabel, type WorktreeStatus } from '@/lib/worktree-status'
import { isFloatingWorkspaceId } from '../../../../shared/floating-workspace-worktree'
import { keybindingMatchesAction } from '../../../../shared/keybindings'
import StatusIndicator from '../sidebar/StatusIndicator'
import { useWorktreeActivityStatus } from '../sidebar/use-worktree-activity-status'
import { selectWorktreeAgentActivitySummary } from '../sidebar/worktree-agent-activity-summary'
import { getTabRootStateClasses } from '../tab-bar/drop-indicator'
import type { OpenWorkspaceTabs } from './open-workspace-tabs'

export type WorkspaceTabLabel = { project: string | null; workspace: string }

export const WorkspaceStatusDot = StatusIndicator
export const useWorkspaceStatus: (workspaceId: string) => WorktreeStatus = useWorktreeActivityStatus
export const workspaceStatusLabel: (status: WorktreeStatus) => string = getWorktreeStatusLabel
export const workspaceTabStateClasses: (isActive: boolean) => string = getTabRootStateClasses

export function useWorkspaceStripEnabled(): boolean {
  return useAppStore((s) => s.settings?.workspaceTabStrip === true)
}

export function useSidebarOpen(): boolean {
  return useAppStore((s) => s.sidebarOpen)
}

export function useRightSidebarOpen(): boolean {
  return useAppStore((s) => s.rightSidebarOpen)
}

/** The floating workspace panel has an id but is not a workspace to switch to. */
export function useActiveWorkspaceId(): string | null {
  return useAppStore((s) =>
    s.activeWorktreeId && !isFloatingWorkspaceId(s.activeWorktreeId) ? s.activeWorktreeId : null
  )
}

export function useKnownWorkspaceTabs(tabs: OpenWorkspaceTabs): OpenWorkspaceTabs {
  return useAppStore(
    useShallow((s) => tabs.filter((id) => s.getKnownWorktreeById(id) !== undefined))
  )
}

export function useWorkspaceTabLabel(workspaceId: string): WorkspaceTabLabel | null {
  const workspaceName = useAppStore((s) => s.getKnownWorktreeById(workspaceId)?.displayName)
  const projectName = useAppStore((s) => {
    const repoId = s.getKnownWorktreeById(workspaceId)?.repoId
    return s.repos.find((repo) => repo.id === repoId)?.displayName ?? null
  })
  return useMemo(
    () => (workspaceName === undefined ? null : { project: projectName, workspace: workspaceName }),
    [workspaceName, projectName]
  )
}

/** Workspaces with an agent waiting for permission or input, from Orca's agent-status store. */
export function useWorkspaceIdsNeedingUser(): readonly string[] {
  const epoch = useAppStore((s) => s.agentStatusEpoch)
  const statuses = useAppStore((s) => s.agentStatusByPaneKey)
  // Why keyed on the agent-status inputs: recomputing on every store update would scan all workspaces per keystroke.
  return useMemo(() => {
    const state = useAppStore.getState()
    return state
      .allWorktrees()
      .filter((worktree) => selectWorktreeAgentActivitySummary(state, worktree.id).hasPermission)
      .map((worktree) => worktree.id)
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- epoch and statuses are the invalidation signal, read through getState
  }, [epoch, statuses])
}

export function activateWorkspace(workspaceId: string): void {
  activateAndRevealWorktree(workspaceId)
}

export function openWorkspaceSwitchPalette(): void {
  useAppStore.getState().openModal('worktree-palette')
}

export type WorkspaceStripShortcutHandlers = {
  nextTab: () => void
  previousTab: () => void
  closeTab: () => void
}

export function useWorkspaceStripShortcuts(handlers: WorkspaceStripShortcutHandlers): void {
  const keybindings = useAppStore((s) => s.keybindings)
  const activeModal = useAppStore((s) => s.activeModal)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.defaultPrevented || event.isComposing || activeModal !== 'none') {
        return
      }
      const platform = getShortcutPlatform()
      const matches = (
        action: 'workspaceStrip.nextTab' | 'workspaceStrip.previousTab' | 'workspaceStrip.closeTab'
      ): boolean => keybindingMatchesAction(action, event, platform, keybindings)
      const run = matches('workspaceStrip.nextTab')
        ? handlers.nextTab
        : matches('workspaceStrip.previousTab')
          ? handlers.previousTab
          : matches('workspaceStrip.closeTab')
            ? handlers.closeTab
            : null
      if (run && !hasVisibleOverlay()) {
        run()
        event.preventDefault()
      }
    }
    window.addEventListener('keydown', handleKeyDown, { capture: true })
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true })
  }, [keybindings, activeModal, handlers])
}
