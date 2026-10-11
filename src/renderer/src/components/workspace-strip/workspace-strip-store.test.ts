import { describe, expect, it } from 'vitest'
import { OPEN_WORKSPACE_TABS_STORAGE_KEY } from './open-workspace-tabs-storage'
import { createWorkspaceStripStore } from './workspace-strip-store'

function memoryStorage(initial: Record<string, string> = {}) {
  const data = { ...initial }
  return {
    data,
    getItem: (key: string) => data[key] ?? null,
    setItem: (key: string, value: string) => {
      data[key] = value
    }
  }
}

describe('workspace strip store', () => {
  it('starts from the stored tabs', () => {
    const storage = memoryStorage({ [OPEN_WORKSPACE_TABS_STORAGE_KEY]: '["a","b"]' })
    expect(createWorkspaceStripStore(storage).getState().tabs).toEqual(['a', 'b'])
  })

  it('saves the list when a tab opens', () => {
    const storage = memoryStorage()
    const store = createWorkspaceStripStore(storage)
    store.getState().open('a')
    store.getState().open('b')
    expect(store.getState().tabs).toEqual(['a', 'b'])
    expect(storage.data[OPEN_WORKSPACE_TABS_STORAGE_KEY]).toBe('["a","b"]')
  })

  it('does not rewrite storage when nothing changes', () => {
    const storage = memoryStorage({ [OPEN_WORKSPACE_TABS_STORAGE_KEY]: '["a"]' })
    let writes = 0
    const counting = {
      getItem: storage.getItem,
      setItem: (key: string, value: string) => {
        writes += 1
        storage.setItem(key, value)
      }
    }
    const store = createWorkspaceStripStore(counting)
    store.getState().open('a')
    store.getState().close('a', ['a'])
    expect(writes).toBe(0)
  })

  it('closes a tab, closes the others, and drops removed workspaces', () => {
    const storage = memoryStorage({ [OPEN_WORKSPACE_TABS_STORAGE_KEY]: '["a","b","c"]' })
    const store = createWorkspaceStripStore(storage)
    store.getState().close('b', ['a', 'b', 'c'])
    expect(store.getState().tabs).toEqual(['a', 'c'])
    store.getState().dropRemoved(new Set(['a', 'c']), new Set(['a']))
    expect(store.getState().tabs).toEqual(['a'])
    store.getState().open('d')
    store.getState().closeOthers('d')
    expect(store.getState().tabs).toEqual(['d'])
    expect(storage.data[OPEN_WORKSPACE_TABS_STORAGE_KEY]).toBe('["d"]')
  })
})
