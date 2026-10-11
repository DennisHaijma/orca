import { parseStoredWorkspaceTabs, type OpenWorkspaceTabs } from './open-workspace-tabs'

export const OPEN_WORKSPACE_TABS_STORAGE_KEY = 'orca.workspaceStrip.openTabs'

export type WorkspaceTabsStorage = Pick<Storage, 'getItem' | 'setItem'>

/** Why null: tests and non-browser hosts have no localStorage, and reading the global can throw. */
export function getBrowserWorkspaceTabsStorage(): WorkspaceTabsStorage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}

export function readStoredWorkspaceTabs(storage: WorkspaceTabsStorage | null): OpenWorkspaceTabs {
  if (!storage) {
    return []
  }
  try {
    return parseStoredWorkspaceTabs(storage.getItem(OPEN_WORKSPACE_TABS_STORAGE_KEY))
  } catch {
    return []
  }
}

export function writeStoredWorkspaceTabs(
  tabs: OpenWorkspaceTabs,
  storage: WorkspaceTabsStorage | null
): void {
  try {
    storage?.setItem(OPEN_WORKSPACE_TABS_STORAGE_KEY, JSON.stringify(tabs))
  } catch {
    // Why: a full or blocked storage only costs restoring tabs on the next launch.
  }
}
