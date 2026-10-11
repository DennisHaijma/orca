import { describe, expect, it, vi } from 'vitest'
import { closeStripTab, cycleStripTab, type WorkspaceStripActionDeps } from './workspace-strip-actions'

function deps(overrides: Partial<WorkspaceStripActionDeps> = {}): WorkspaceStripActionDeps {
  return {
    visibleTabs: ['a', 'b', 'c'],
    activeWorkspaceId: 'b',
    activate: vi.fn(),
    close: vi.fn(),
    ...overrides
  }
}

describe('closeStripTab', () => {
  it('closes a background tab without switching workspace', () => {
    const d = deps()
    closeStripTab(d, 'a')
    expect(d.activate).not.toHaveBeenCalled()
    expect(d.close).toHaveBeenCalledWith('a', ['a', 'b', 'c'])
  })

  it('switches to the neighbor before closing the active tab', () => {
    const d = deps()
    closeStripTab(d, 'b')
    expect(d.activate).toHaveBeenCalledWith('c')
    expect(d.close).toHaveBeenCalledWith('b', ['a', 'b', 'c'])
  })

  it('leaves the last tab open', () => {
    const d = deps({ visibleTabs: ['b'] })
    closeStripTab(d, 'b')
    expect(d.activate).not.toHaveBeenCalled()
    expect(d.close).not.toHaveBeenCalled()
  })
})

describe('cycleStripTab', () => {
  it('activates the next and previous tab', () => {
    const d = deps()
    cycleStripTab(d, 'next')
    cycleStripTab(d, 'previous')
    expect(d.activate).toHaveBeenNthCalledWith(1, 'c')
    expect(d.activate).toHaveBeenNthCalledWith(2, 'a')
  })

  it('does nothing with a single tab', () => {
    const d = deps({ visibleTabs: ['b'] })
    cycleStripTab(d, 'next')
    expect(d.activate).not.toHaveBeenCalled()
  })
})
