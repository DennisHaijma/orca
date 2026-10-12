import { Bot, X } from 'lucide-react'
import { translate } from '@/i18n/i18n'
import { cn } from '@/lib/utils'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger
} from '@/components/ui/context-menu'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { preventMiddleButtonDefault } from '../tab-bar/middle-button-default-guard'
import { workspaceAgentCountLabel, WorkspaceStripTabDetails } from './WorkspaceStripTabDetails'
import {
  useWorkspaceAgentCount,
  useWorkspaceStatus,
  useWorkspaceTabLabel,
  workspaceTabStateClasses,
  WorkspaceStatusDot
} from './workspace-strip-orca-bindings'

export function WorkspaceStripTab(props: {
  workspaceId: string
  isActive: boolean
  canClose: boolean
  /** False inside a project group, where the group label already names the project. */
  showProject: boolean
  onActivate: (workspaceId: string) => void
  onClose: (workspaceId: string) => void
  onCloseOthers: (workspaceId: string) => void
}): React.JSX.Element | null {
  const { workspaceId, isActive, canClose, showProject, onActivate, onClose, onCloseOthers } = props
  const label = useWorkspaceTabLabel(workspaceId)
  const status = useWorkspaceStatus(workspaceId)
  const agentCount = useWorkspaceAgentCount(workspaceId)
  if (!label) {
    return null
  }
  // Why: a project's main workspace carries the project's name, and "docs / docs" reads as a mistake.
  const project = label.project === label.workspace ? null : label.project
  const text = project ? `${project} / ${label.workspace}` : label.workspace
  const closeLabel = translate('auto.components.workspaceStrip.closeTab', 'Close workspace tab')

  return (
    <ContextMenu>
      {/* Why a hover card and not a tooltip: like the sidebar card, the details list agents you can click. */}
      <HoverCard openDelay={350} closeDelay={120}>
        <HoverCardTrigger asChild>
          <ContextMenuTrigger asChild>
            <div
              role="tab"
              tabIndex={0}
              aria-selected={isActive}
              aria-label={text}
              data-workspace-strip-tab={workspaceId}
              className={cn(
                'group/strip-tab flex h-7 min-w-16 max-w-56 shrink cursor-pointer [-webkit-app-region:no-drag] items-center gap-1.5 rounded-md px-2 text-xs outline-none focus-visible:ring-1 focus-visible:ring-ring',
                workspaceTabStateClasses(isActive)
              )}
              onClick={() => onActivate(workspaceId)}
              onMouseDown={preventMiddleButtonDefault}
              onAuxClick={(event) => {
                if (event.button === 1 && canClose) {
                  onClose(workspaceId)
                }
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  onActivate(workspaceId)
                }
              }}
            >
              <WorkspaceStatusDot status={status} showTooltip={false} />
              {/* Why two spans: the project shortens first, so the workspace name stays readable. */}
              {showProject && project ? (
                <span
                  data-workspace-strip-project=""
                  className="min-w-0 shrink-[8] truncate text-muted-foreground"
                >
                  {`${project} /`}
                </span>
              ) : null}
              <span data-workspace-strip-name="" className="min-w-0 shrink truncate">
                {label.workspace}
              </span>
              {agentCount > 0 ? (
                <span
                  data-workspace-strip-agents={agentCount}
                  title={workspaceAgentCountLabel(agentCount)}
                  className="flex shrink-0 items-center gap-0.5 text-[10px] tabular-nums text-muted-foreground"
                >
                  <Bot size={11} />
                  {agentCount}
                </span>
              ) : null}
              {canClose ? (
                <button
                  type="button"
                  data-workspace-strip-close=""
                  aria-label={closeLabel}
                  className="flex size-4 shrink-0 items-center justify-center rounded-sm text-muted-foreground opacity-0 hover:bg-accent hover:text-foreground focus-visible:opacity-100 group-hover/strip-tab:opacity-100"
                  onClick={(event) => {
                    event.stopPropagation()
                    onClose(workspaceId)
                  }}
                >
                  <X size={12} />
                </button>
              ) : null}
            </div>
          </ContextMenuTrigger>
        </HoverCardTrigger>
        <HoverCardContent side="bottom" align="start" sideOffset={6} variant="workspace-details">
          <WorkspaceStripTabDetails
            workspaceId={workspaceId}
            label={label}
            agentCount={agentCount}
          />
        </HoverCardContent>
      </HoverCard>
      <ContextMenuContent>
        <ContextMenuItem disabled={!canClose} onSelect={() => onClose(workspaceId)}>
          {translate('auto.components.workspaceStrip.close', 'Close')}
        </ContextMenuItem>
        <ContextMenuItem disabled={!canClose} onSelect={() => onCloseOthers(workspaceId)}>
          {translate('auto.components.workspaceStrip.closeOthers', 'Close others')}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
