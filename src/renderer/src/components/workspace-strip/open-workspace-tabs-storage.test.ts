import { describe, expect, it } from 'vitest'
import {
  OPEN_WORKSPACE_TABS_STORAGE_KEY,
  readStoredWorkspaceTabs,
  writeStoredWorkspaceTabs,
  type WorkspaceTabsStorage
} from './open-workspace-tabs-storage'

function memoryStorage(initial: Record<string, string> = {}): WorkspaceTabsStorage & {
  data: Record<string, string>
} {
  const data = { ...initial }
  return {
    data,
    getItem: (key) => data[key] ?? null,
    setItem: (key, value) => {
      data[key] = value
    }
  }
}

const throwingStorage: WorkspaceTabsStorage = {
  getItem: () => {
    throw new Error('storage unavailable')
  },
  setItem: () => {
    throw new Error('quota exceeded')
  }
}

describe('open workspace tabs storage', () => {
  it('round-trips the tab list', () => {
    const storage = memoryStorage()
    writeStoredWorkspaceTabs(['a', 'b'], storage)
    expect(storage.data[OPEN_WORKSPACE_TABS_STORAGE_KEY]).toBe('["a","b"]')
    expect(readStoredWorkspaceTabs(storage)).toEqual(['a', 'b'])
  })

  it('reads no tabs from empty or corrupt storage', () => {
    expect(readStoredWorkspaceTabs(memoryStorage())).toEqual([])
    expect(
      readStoredWorkspaceTabs(memoryStorage({ [OPEN_WORKSPACE_TABS_STORAGE_KEY]: '{oops' }))
    ).toEqual([])
  })

  it('reads no tabs when there is no storage at all', () => {
    expect(readStoredWorkspaceTabs(null)).toEqual([])
    expect(() => writeStoredWorkspaceTabs(['a'], null)).not.toThrow()
  })

  it('never throws when storage itself fails', () => {
    expect(readStoredWorkspaceTabs(throwingStorage)).toEqual([])
    expect(() => writeStoredWorkspaceTabs(['a'], throwingStorage)).not.toThrow()
  })
})
