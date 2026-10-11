import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { TooltipProvider } from '@/components/ui/tooltip'

type TabBindings = {
  label: { project: string | null; workspace: string } | null
  status: string
}

const bindings = vi.hoisted(
  (): TabBindings => ({
    label: { project: 'nix-config', workspace: 'glass' },
    status: 'working'
  })
)

vi.mock('./workspace-strip-orca-bindings', () => ({
  useWorkspaceTabLabel: () => bindings.label,
  useWorkspaceStatus: () => bindings.status,
  workspaceStatusLabel: (status: string) => `status:${status}`,
  workspaceTabStateClasses: (isActive: boolean) => (isActive ? 'is-active' : 'is-inactive'),
  WorkspaceStatusDot: ({ status }: { status: string }) => <span data-status-dot={status} />
}))

import { WorkspaceStripTab } from './WorkspaceStripTab'

function render(props: Partial<React.ComponentProps<typeof WorkspaceStripTab>> = {}): string {
  return renderToStaticMarkup(
    <TooltipProvider>
      <WorkspaceStripTab
        workspaceId="repo::/path"
        isActive={false}
        canClose
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
    expect(html).toContain('nix-config / glass')
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
    expect(html).toContain('>scratch<')
    expect(html).not.toContain(' / ')
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
})
