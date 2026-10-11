/** Ordered workspace ids that have a tab in the strip, leftmost first. */
export type OpenWorkspaceTabs = readonly string[]

export function openWorkspaceTab(tabs: OpenWorkspaceTabs, workspaceId: string): OpenWorkspaceTabs {
  return tabs.includes(workspaceId) ? tabs : [...tabs, workspaceId]
}

/** `visibleTabs` are the tabs whose workspace currently exists; the last of those cannot be closed. */
export function closeWorkspaceTab(
  tabs: OpenWorkspaceTabs,
  workspaceId: string,
  visibleTabs: OpenWorkspaceTabs
): OpenWorkspaceTabs {
  if (!tabs.includes(workspaceId)) {
    return tabs
  }
  if (visibleTabs.length === 1 && visibleTabs[0] === workspaceId) {
    return tabs
  }
  return tabs.filter((id) => id !== workspaceId)
}

export function closeOtherWorkspaceTabs(
  tabs: OpenWorkspaceTabs,
  workspaceId: string
): OpenWorkspaceTabs {
  return tabs.includes(workspaceId) ? [workspaceId] : tabs
}

/** The tab to activate when `workspaceId` closes: its right neighbor, else its left one. */
export function neighborAfterClose(tabs: OpenWorkspaceTabs, workspaceId: string): string | null {
  const index = tabs.indexOf(workspaceId)
  if (index === -1) {
    return null
  }
  return tabs[index + 1] ?? tabs[index - 1] ?? null
}

export function adjacentWorkspaceTab(
  tabs: OpenWorkspaceTabs,
  activeWorkspaceId: string | null,
  direction: 'next' | 'previous'
): string | null {
  const index = activeWorkspaceId === null ? -1 : tabs.indexOf(activeWorkspaceId)
  if (index === -1) {
    return tabs[0] ?? null
  }
  if (tabs.length < 2) {
    return null
  }
  const step = direction === 'next' ? 1 : -1
  return tabs[(index + step + tabs.length) % tabs.length]
}

/** Why seen-then-gone: remote workspaces load late, so "unknown" alone must not cost a tab. */
export function dropRemovedWorkspaceTabs(
  tabs: OpenWorkspaceTabs,
  previouslyKnown: ReadonlySet<string>,
  known: ReadonlySet<string>
): OpenWorkspaceTabs {
  const kept = tabs.filter((id) => !previouslyKnown.has(id) || known.has(id))
  return kept.length === tabs.length ? tabs : kept
}

export function parseStoredWorkspaceTabs(raw: string | null): OpenWorkspaceTabs {
  if (!raw) {
    return []
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return []
  }
  if (!Array.isArray(parsed)) {
    return []
  }
  const ids = parsed.filter((id): id is string => typeof id === 'string' && id.length > 0)
  return [...new Set(ids)]
}
