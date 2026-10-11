import { useStore } from 'zustand'
import { createStore, type StoreApi } from 'zustand/vanilla'
import {
  closeOtherWorkspaceTabs,
  closeWorkspaceTab,
  dropRemovedWorkspaceTabs,
  openWorkspaceTab,
  type OpenWorkspaceTabs
} from './open-workspace-tabs'
import {
  getBrowserWorkspaceTabsStorage,
  readStoredWorkspaceTabs,
  writeStoredWorkspaceTabs,
  type WorkspaceTabsStorage
} from './open-workspace-tabs-storage'

export type WorkspaceStripState = {
  tabs: OpenWorkspaceTabs
  open: (workspaceId: string) => void
  close: (workspaceId: string, visibleTabs: OpenWorkspaceTabs) => void
  closeOthers: (workspaceId: string) => void
  dropRemoved: (previouslyKnown: ReadonlySet<string>, known: ReadonlySet<string>) => void
}

/** Why its own store: the strip's tab list is not part of Orca's app state, so it adds nothing to it. */
export function createWorkspaceStripStore(
  storage: WorkspaceTabsStorage | null
): StoreApi<WorkspaceStripState> {
  return createStore<WorkspaceStripState>((set, get) => {
    const replaceTabs = (next: OpenWorkspaceTabs): void => {
      if (next === get().tabs) {
        return
      }
      set({ tabs: next })
      writeStoredWorkspaceTabs(next, storage)
    }
    return {
      tabs: readStoredWorkspaceTabs(storage),
      open: (workspaceId) => replaceTabs(openWorkspaceTab(get().tabs, workspaceId)),
      close: (workspaceId, visibleTabs) =>
        replaceTabs(closeWorkspaceTab(get().tabs, workspaceId, visibleTabs)),
      closeOthers: (workspaceId) => replaceTabs(closeOtherWorkspaceTabs(get().tabs, workspaceId)),
      dropRemoved: (previouslyKnown, known) =>
        replaceTabs(dropRemovedWorkspaceTabs(get().tabs, previouslyKnown, known))
    }
  })
}

export const workspaceStripStore = createWorkspaceStripStore(getBrowserWorkspaceTabsStorage())

export function useWorkspaceStripStore<T>(selector: (state: WorkspaceStripState) => T): T {
  return useStore(workspaceStripStore, selector)
}
