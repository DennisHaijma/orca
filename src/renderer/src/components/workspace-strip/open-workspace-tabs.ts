/** Ordered workspace ids that have a tab in the strip, leftmost first. */
export type OpenWorkspaceTabs = readonly string[]

/** Tabs of one project, shown together; `projectId` is null for workspaces whose project is unknown. */
export type WorkspaceTabGroup = { projectId: string | null; tabs: OpenWorkspaceTabs }

/**
 * Groups follow `projectOrder`, tabs inside a group keep their open order.
 * Why a view and not the stored order: reordering projects must not rewrite what was saved.
 */
export function groupWorkspaceTabsByProject(
  tabs: OpenWorkspaceTabs,
  projectIds: readonly (string | null)[],
  projectOrder: readonly string[]
): WorkspaceTabGroup[] {
  const byProject = new Map<string | null, string[]>()
  tabs.forEach((workspaceId, index) => {
    const projectId = projectIds[index] ?? null
    const group = byProject.get(projectId)
    if (group) {
      group.push(workspaceId)
    } else {
      byProject.set(projectId, [workspaceId])
    }
  })
  const rank = (projectId: string | null): number => {
    const index = projectId === null ? -1 : projectOrder.indexOf(projectId)
    return index === -1 ? projectOrder.length : index
  }
  // Why sort is enough: it is stable, so projects missing from the order keep their open order at the end.
  return [...byProject.entries()]
    .sort(([a], [b]) => rank(a) - rank(b))
    .map(([projectId, groupTabs]) => ({ projectId, tabs: groupTabs }))
}

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

/** Why only new ones: a tab the user closed must not reopen while the same agent is still waiting. */
export function workspacesNewlyNeedingUser(
  previous: ReadonlySet<string>,
  current: readonly string[]
): string[] {
  return current.filter((id) => !previous.has(id))
}
