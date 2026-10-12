import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

type DetailBindings = { branch: string | null; terminals: number }

const bindings = vi.hoisted((): DetailBindings => ({
  branch: 'refs/heads/feat/glass',
  terminals: 2
}))

vi.mock('./workspace-strip-orca-bindings', () => ({
  useWorkspaceBranch: () => bindings.branch,
  useWorkspaceStatus: () => 'working',
  useWorkspaceTerminalCount: () => bindings.terminals,
  workspaceStatusLabel: (status: string) => `status:${status}`,
  WorkspaceAgentList: ({ worktreeId }: { worktreeId: string }) => (
    <span data-agent-list={worktreeId} />
  ),
  WorkspaceStatusDot: ({ status }: { status: string }) => <span data-status-dot={status} />
}))

import { WorkspaceStripTabDetails } from './WorkspaceStripTabDetails'

function render(agentCount: number, project: string | null = 'nix-config'): string {
  return renderToStaticMarkup(
    <WorkspaceStripTabDetails
      workspaceId="repo::/path"
      label={{ project, workspace: 'glass' }}
      agentCount={agentCount}
    />
  )
}

describe('WorkspaceStripTabDetails', () => {
  it('shows the workspace, its project and branch, and the status with agent and terminal counts', () => {
    bindings.branch = 'refs/heads/feat/glass'
    bindings.terminals = 2
    const html = render(3)
    expect(html).toContain('>glass<')
    expect(html).toContain('nix-config · feat/glass')
    expect(html).toContain('status:working · 3 agents · 2 terminals')
    expect(html).toContain('data-agent-list="repo::/path"')
  })

  it('uses the singular for one agent and one terminal', () => {
    bindings.terminals = 1
    expect(render(1)).toContain('1 agent · 1 terminal<')
  })

  it('leaves the agent list out when the workspace has no agents', () => {
    const html = render(0)
    expect(html).toContain('0 agents')
    expect(html).not.toContain('data-agent-list')
  })

  it('shows only what is known about where the workspace lives', () => {
    bindings.branch = null
    expect(render(0, null)).not.toContain(' · </div>')
    expect(render(0, 'nix-config')).toContain('>nix-config<')
  })
})
