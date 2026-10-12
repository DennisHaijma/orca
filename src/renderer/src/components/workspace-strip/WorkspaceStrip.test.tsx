import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { TooltipProvider } from '@/components/ui/tooltip'

type StripState = {
  enabled: boolean
  visibleTabs: string[]
  tabGroups: { projectId: string | null; tabs: string[] }[] | null
  activeWorkspaceId: string | null
}

const state = vi.hoisted((): StripState => ({
  enabled: true,
  visibleTabs: ['a', 'b'],
  tabGroups: null,
  activeWorkspaceId: 'b'
}))

vi.mock('./workspace-strip-orca-bindings', () => ({
  useWorkspaceStripEnabled: () => state.enabled,
  useSidebarOpen: () => true,
  useRightSidebarOpen: () => true,
  useProjectCaption: (projectId: string | null) =>
    projectId === 'named-by-tab' ? null : `name:${projectId}`,
  openWorkspaceSwitchPalette: () => {}
}))

vi.mock('./use-open-workspace-tabs', () => ({
  useOpenWorkspaceTabs: () => ({
    visibleTabs: state.visibleTabs,
    tabGroups: state.tabGroups ?? [{ projectId: null, tabs: state.visibleTabs }],
    activeWorkspaceId: state.activeWorkspaceId,
    activateTab: () => {},
    closeTab: () => {},
    closeOtherTabs: () => {}
  })
}))

vi.mock('./WorkspaceStripTab', () => ({
  WorkspaceStripTab: (props: {
    workspaceId: string
    isActive: boolean
    canClose: boolean
    showProject: boolean
  }) => (
    <span
      data-show-project={String(props.showProject)}
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

  it('puts each project in its own outlined group, captioned once, with its tabs inside', () => {
    state.visibleTabs = ['a', 'b', 'c']
    state.tabGroups = [
      { projectId: 'p1', tabs: ['a', 'b'] },
      { projectId: 'p2', tabs: ['c'] }
    ]
    state.activeWorkspaceId = 'a'
    const html = render()
    expect(html.match(/data-workspace-strip-group=/g)).toHaveLength(2)
    expect(html.match(/data-workspace-strip-caption=/g)).toHaveLength(2)
    expect(html.indexOf('name:p1')).toBeLessThan(html.indexOf('data-tab="a"'))
    expect(html.indexOf('data-tab="b"')).toBeLessThan(html.indexOf('name:p2'))
    expect(html).toContain('data-show-project="false" data-tab="c"')
    state.tabGroups = null
  })

  it('leaves the caption out when a tab already carries the project name', () => {
    state.visibleTabs = ['a']
    state.tabGroups = [{ projectId: 'named-by-tab', tabs: ['a'] }]
    state.activeWorkspaceId = 'a'
    const html = render()
    expect(html).toContain('data-workspace-strip-group="named-by-tab"')
    expect(html).not.toContain('data-workspace-strip-caption')
    state.tabGroups = null
  })

  it('leaves the project name on the tabs when they are not grouped', () => {
    state.visibleTabs = ['a']
    state.activeWorkspaceId = 'a'
    const html = render()
    expect(html).not.toContain('data-workspace-strip-group')
    expect(html).toContain('data-show-project="true" data-tab="a"')
  })
})
