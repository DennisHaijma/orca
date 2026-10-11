import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { TooltipProvider } from '@/components/ui/tooltip'

type StripState = {
  enabled: boolean
  visibleTabs: string[]
  activeWorkspaceId: string | null
}

const state = vi.hoisted(
  (): StripState => ({
    enabled: true,
    visibleTabs: ['a', 'b'],
    activeWorkspaceId: 'b'
  })
)

vi.mock('./workspace-strip-orca-bindings', () => ({
  useWorkspaceStripEnabled: () => state.enabled,
  useSidebarOpen: () => true,
  useRightSidebarOpen: () => true,
  openWorkspaceSwitchPalette: () => {}
}))

vi.mock('./use-open-workspace-tabs', () => ({
  useOpenWorkspaceTabs: () => ({
    visibleTabs: state.visibleTabs,
    activeWorkspaceId: state.activeWorkspaceId,
    activateTab: () => {},
    closeTab: () => {},
    closeOtherTabs: () => {}
  })
}))

vi.mock('./WorkspaceStripTab', () => ({
  WorkspaceStripTab: (props: { workspaceId: string; isActive: boolean; canClose: boolean }) => (
    <span
      data-tab={props.workspaceId}
      data-active={String(props.isActive)}
      data-can-close={String(props.canClose)}
    />
  )
}))

import { WorkspaceStrip } from './WorkspaceStrip'

function render(): string {
  return renderToStaticMarkup(
    <TooltipProvider>
      <WorkspaceStrip />
    </TooltipProvider>
  )
}

describe('WorkspaceStrip', () => {
  it('renders nothing while the setting is off', () => {
    state.enabled = false
    expect(render()).toBe('')
    state.enabled = true
  })

  it('renders one tab per open workspace and marks the active one', () => {
    state.visibleTabs = ['a', 'b']
    state.activeWorkspaceId = 'b'
    const html = render()
    expect(html).toContain('role="tablist"')
    expect(html).toContain('data-tab="a" data-active="false" data-can-close="true"')
    expect(html).toContain('data-tab="b" data-active="true" data-can-close="true"')
    expect(html).toContain('data-workspace-strip-add')
  })

  it('does not let the only tab be closed', () => {
    state.visibleTabs = ['a']
    state.activeWorkspaceId = 'a'
    expect(render()).toContain('data-tab="a" data-active="true" data-can-close="false"')
  })
})
