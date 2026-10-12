import { translate } from '@/i18n/i18n'
import {
  useWorkspaceBranch,
  useWorkspaceStatus,
  useWorkspaceTerminalCount,
  workspaceStatusLabel,
  WorkspaceAgentList,
  WorkspaceStatusDot,
  type WorkspaceTabLabel
} from './workspace-strip-orca-bindings'

export function workspaceAgentCountLabel(count: number): string {
  return count === 1
    ? translate('auto.components.workspaceStrip.oneAgent', '1 agent')
    : translate('auto.components.workspaceStrip.agentCount', '{{count}} agents', { count })
}

function terminalCountLabel(count: number): string {
  return count === 1
    ? translate('auto.components.workspaceStrip.oneTerminal', '1 terminal')
    : translate('auto.components.workspaceStrip.terminalCount', '{{count}} terminals', { count })
}

/** What a tab shows on hover: where the workspace lives, what runs in it, and its agents. */
export function WorkspaceStripTabDetails(props: {
  workspaceId: string
  label: WorkspaceTabLabel
  agentCount: number
}): React.JSX.Element {
  const { workspaceId, label, agentCount } = props
  const status = useWorkspaceStatus(workspaceId)
  const terminalCount = useWorkspaceTerminalCount(workspaceId)
  const branch = useWorkspaceBranch(workspaceId)
  // Why: git reports the full ref, and the prefix is noise next to a workspace name.
  const branchName = branch?.replace(/^refs\/heads\//, '') ?? null
  const origin = [label.project, branchName].filter(Boolean).join(' · ')

  return (
    <div data-workspace-strip-details="" className="space-y-2">
      <div className="min-w-0">
        <div className="truncate text-sm font-medium text-foreground">{label.workspace}</div>
        {origin ? <div className="truncate text-muted-foreground">{origin}</div> : null}
      </div>
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <WorkspaceStatusDot status={status} showTooltip={false} />
        <span>
          {[
            workspaceStatusLabel(status),
            workspaceAgentCountLabel(agentCount),
            terminalCountLabel(terminalCount)
          ].join(' · ')}
        </span>
      </div>
      {agentCount > 0 ? <WorkspaceAgentList worktreeId={workspaceId} /> : null}
    </div>
  )
}
