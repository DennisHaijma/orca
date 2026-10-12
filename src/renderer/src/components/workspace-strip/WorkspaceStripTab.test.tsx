import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { TooltipProvider } from '@/components/ui/tooltip'

type TabBindings = {
  label: { project: string | null; workspace: string } | null
  status: string
  agentCount: number
}

const bindings = vi.hoisted((): TabBindings => ({
  label: { project: 'nix-config', workspace: 'glass' },
  status: 'working',
  agentCount: 0
}))

vi.mock('./workspace-strip-orca-bindings', () => ({
  useWorkspaceTabLabel: () => bindings.label,
  useWorkspaceStatus: () => bindings.status,
  useWorkspaceAgentCount: () => bindings.agentCount,
  workspaceStatusLabel: (status: string) => `status:${status}`,
  workspaceTabStateClasses: (isActive: boolean) => (isActive ? 'is-active' : 'is-inactive'),
  WorkspaceStatusDot: ({ status }: { status: string }) => <span data-status-dot={status} />
}))

vi.mock('./WorkspaceStripTabDetails', () => ({
  workspaceAgentCountLabel: (count: number) => `agents:${count}`,
  WorkspaceStripTabDetails: () => null
}))

import { WorkspaceStripTab } from './WorkspaceStripTab'

function render(props: Partial<React.ComponentProps<typeof WorkspaceStripTab>> = {}): string {
  return renderToStaticMarkup(
    <TooltipProvider>
      <WorkspaceStripTab
        workspaceId="repo::/path"
        isActive={false}
        canClose
        showProject
        onActivate={() => {}}
        onClose={() => {}}
        onCloseOthers={() => {}}
        {...props}
      />
    </TooltipProvider>
  )
}

describe('WorkspaceStripTab', () => {
  it('shows the project and workspace name with the status dot', () => {
    bindings.label = { project: 'nix-config', workspace: 'glass' }
    const html = render()
    expect(html).toMatch(/data-workspace-strip-project=""[^>]*>nix-config \/</)
    expect(html).toMatch(/data-workspace-strip-name=""[^>]*>glass</)
    expect(html).toContain('data-status-dot="working"')
    expect(html).toContain('aria-selected="false"')
    expect(html).toContain('is-inactive')
  })

  it('marks the active tab', () => {
    const html = render({ isActive: true })
    expect(html).toContain('aria-selected="true"')
    expect(html).toContain('is-active')
  })

  it('shows only the workspace name when the project is unknown', () => {
    bindings.label = { project: null, workspace: 'scratch' }
    const html = render()
    expect(html).toMatch(/data-workspace-strip-name=""[^>]*>scratch</)
    expect(html).not.toContain('data-workspace-strip-project')
  })

  it('has a close button only when the tab can be closed', () => {
    bindings.label = { project: 'nix-config', workspace: 'glass' }
    expect(render({ canClose: true })).toContain('data-workspace-strip-close')
    expect(render({ canClose: false })).not.toContain('data-workspace-strip-close')
  })

  it('renders nothing for a workspace that is not known', () => {
    bindings.label = null
    expect(render()).toBe('')
  })

  it('leaves the project out inside a project group but keeps it in the accessible name', () => {
    bindings.label = { project: 'nix-config', workspace: 'glass' }
    const html = render({ showProject: false })
    expect(html).not.toContain('data-workspace-strip-project')
    expect(html).toContain('aria-label="nix-config / glass"')
  })

  it('does not repeat a project name that equals the workspace name', () => {
    bindings.label = { project: 'docs', workspace: 'docs' }
    const html = render()
    expect(html).not.toContain('data-workspace-strip-project')
    expect(html).toContain('aria-label="docs"')
  })

  it('shows how many agents the workspace has, and nothing when it has none', () => {
    bindings.label = { project: 'nix-config', workspace: 'glass' }
    bindings.agentCount = 0
    expect(render()).not.toContain('data-workspace-strip-agents')
    bindings.agentCount = 3
    const html = render()
    expect(html).toContain('data-workspace-strip-agents="3"')
    expect(html).toContain('title="agents:3"')
    bindings.agentCount = 0
  })
})
