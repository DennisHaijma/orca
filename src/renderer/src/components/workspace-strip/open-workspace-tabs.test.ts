import { describe, expect, it } from 'vitest'
import {
  adjacentWorkspaceTab,
  closeOtherWorkspaceTabs,
  closeWorkspaceTab,
  dropRemovedWorkspaceTabs,
  groupWorkspaceTabsByProject,
  neighborAfterClose,
  openWorkspaceTab,
  parseStoredWorkspaceTabs,
  workspacesNewlyNeedingUser
} from './open-workspace-tabs'

describe('openWorkspaceTab', () => {
  it('adds a new tab at the right', () => {
    expect(openWorkspaceTab(['a', 'b'], 'c')).toEqual(['a', 'b', 'c'])
  })

  it('keeps the list unchanged when the tab is already open', () => {
    const tabs = ['a', 'b']
    expect(openWorkspaceTab(tabs, 'a')).toBe(tabs)
  })
})

describe('closeWorkspaceTab', () => {
  it('removes the tab', () => {
    expect(closeWorkspaceTab(['a', 'b', 'c'], 'b', ['a', 'b', 'c'])).toEqual(['a', 'c'])
  })

  it('keeps the last visible tab', () => {
    const tabs = ['a', 'hidden']
    expect(closeWorkspaceTab(tabs, 'a', ['a'])).toBe(tabs)
  })

  it('removes a hidden tab even when one visible tab remains', () => {
    expect(closeWorkspaceTab(['a', 'hidden'], 'hidden', ['a'])).toEqual(['a'])
  })

  it('ignores a tab that is not open', () => {
    const tabs = ['a', 'b']
    expect(closeWorkspaceTab(tabs, 'x', ['a', 'b'])).toBe(tabs)
  })
})

describe('closeOtherWorkspaceTabs', () => {
  it('keeps only the given tab', () => {
    expect(closeOtherWorkspaceTabs(['a', 'b', 'c'], 'b')).toEqual(['b'])
  })

  it('leaves the list alone when the tab is not open', () => {
    const tabs = ['a', 'b']
    expect(closeOtherWorkspaceTabs(tabs, 'x')).toBe(tabs)
  })
})

describe('neighborAfterClose', () => {
  it('picks the tab to the right', () => {
    expect(neighborAfterClose(['a', 'b', 'c'], 'b')).toBe('c')
  })

  it('picks the tab to the left when closing the rightmost', () => {
    expect(neighborAfterClose(['a', 'b', 'c'], 'c')).toBe('b')
  })

  it('has no neighbor for the only tab or an unknown tab', () => {
    expect(neighborAfterClose(['a'], 'a')).toBeNull()
    expect(neighborAfterClose(['a', 'b'], 'x')).toBeNull()
  })
})

describe('adjacentWorkspaceTab', () => {
  it('moves to the next and previous tab', () => {
    expect(adjacentWorkspaceTab(['a', 'b', 'c'], 'b', 'next')).toBe('c')
    expect(adjacentWorkspaceTab(['a', 'b', 'c'], 'b', 'previous')).toBe('a')
  })

  it('wraps around at either end', () => {
    expect(adjacentWorkspaceTab(['a', 'b', 'c'], 'c', 'next')).toBe('a')
    expect(adjacentWorkspaceTab(['a', 'b', 'c'], 'a', 'previous')).toBe('c')
  })

  it('starts from the first tab when the active workspace has no tab', () => {
    expect(adjacentWorkspaceTab(['a', 'b'], 'x', 'next')).toBe('a')
    expect(adjacentWorkspaceTab(['a', 'b'], null, 'previous')).toBe('a')
  })

  it('has nowhere to go with one tab or none', () => {
    expect(adjacentWorkspaceTab(['a'], 'a', 'next')).toBeNull()
    expect(adjacentWorkspaceTab([], null, 'next')).toBeNull()
  })
})

describe('dropRemovedWorkspaceTabs', () => {
  it('drops a tab whose workspace was known and is now gone', () => {
    expect(dropRemovedWorkspaceTabs(['a', 'b'], new Set(['a', 'b']), new Set(['a']))).toEqual(['a'])
  })

  it('keeps a tab whose workspace has not been seen yet', () => {
    const tabs = ['a', 'late']
    expect(dropRemovedWorkspaceTabs(tabs, new Set(['a']), new Set(['a']))).toBe(tabs)
  })
})

describe('parseStoredWorkspaceTabs', () => {
  it('reads a stored list', () => {
    expect(parseStoredWorkspaceTabs('["a","b"]')).toEqual(['a', 'b'])
  })

  it('drops duplicates and non-string entries', () => {
    expect(parseStoredWorkspaceTabs('["a",1,null,"a","b",""]')).toEqual(['a', 'b'])
  })

  it('treats missing, malformed or foreign data as no tabs', () => {
    expect(parseStoredWorkspaceTabs(null)).toEqual([])
    expect(parseStoredWorkspaceTabs('not json')).toEqual([])
    expect(parseStoredWorkspaceTabs('{"a":1}')).toEqual([])
  })
})

describe('workspacesNewlyNeedingUser', () => {
  it('reports only workspaces that started needing the user', () => {
    expect(workspacesNewlyNeedingUser(new Set(['a']), ['a', 'b'])).toEqual(['b'])
  })

  it('reports nothing when the set is unchanged or shrinks', () => {
    expect(workspacesNewlyNeedingUser(new Set(['a', 'b']), ['a'])).toEqual([])
  })
})

describe('groupWorkspaceTabsByProject', () => {
  it('puts tabs of one project together and keeps their open order', () => {
    expect(
      groupWorkspaceTabsByProject(['d1', 'x1', 'd2', 'd3'], ['d', 'x', 'd', 'd'], ['d', 'x'])
    ).toEqual([
      { projectId: 'd', tabs: ['d1', 'd2', 'd3'] },
      { projectId: 'x', tabs: ['x1'] }
    ])
  })

  it('orders the groups by the project order, not by which was opened first', () => {
    const groups = groupWorkspaceTabsByProject(['x1', 'd1'], ['x', 'd'], ['d', 'x'])
    expect(groups.map((group) => group.projectId)).toEqual(['d', 'x'])
  })

  it('puts tabs without a known project last, in one group', () => {
    expect(groupWorkspaceTabsByProject(['u1', 'd1', 'u2'], [null, 'd', null], ['d'])).toEqual([
      { projectId: 'd', tabs: ['d1'] },
      { projectId: null, tabs: ['u1', 'u2'] }
    ])
  })

  it('keeps projects missing from the order in the order they were opened', () => {
    const groups = groupWorkspaceTabsByProject(['b1', 'a1', 'd1'], ['b', 'a', 'd'], ['d'])
    expect(groups.map((group) => group.projectId)).toEqual(['d', 'b', 'a'])
  })

  it('returns no groups when there are no tabs', () => {
    expect(groupWorkspaceTabsByProject([], [], ['d'])).toEqual([])
  })
})
