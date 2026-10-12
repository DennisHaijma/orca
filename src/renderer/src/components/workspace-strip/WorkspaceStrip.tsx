import { Fragment, useEffect, useRef } from 'react'
import { Plus } from 'lucide-react'
import { translate } from '@/i18n/i18n'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useOpenWorkspaceTabs } from './use-open-workspace-tabs'
import {
  openWorkspaceSwitchPalette,
  useProjectName,
  useRightSidebarOpen,
  useSidebarOpen,
  useWorkspaceStripEnabled
} from './workspace-strip-orca-bindings'
import { WorkspaceStripTab } from './WorkspaceStripTab'

const NO_DRAG_REGION = { WebkitAppRegion: 'no-drag' } as const

/** Optional row of workspace tabs above the workspace view; renders nothing unless the setting is on. */
export function WorkspaceStrip(): React.JSX.Element | null {
  return useWorkspaceStripEnabled() ? <EnabledWorkspaceStrip /> : null
}

function EnabledWorkspaceStrip(): React.JSX.Element {
  const { visibleTabs, tabGroups, activeWorkspaceId, activateTab, closeTab, closeOtherTabs } =
    useOpenWorkspaceTabs()
  const sidebarOpen = useSidebarOpen()
  const rightSidebarOpen = useRightSidebarOpen()
  const scrollerRef = useRef<HTMLDivElement | null>(null)
  const canClose = visibleTabs.length > 1
  const addLabel = translate('auto.components.workspaceStrip.switchWorkspace', 'Switch workspace')

  useEffect(() => {
    if (activeWorkspaceId === null) {
      return
    }
    const tab = scrollerRef.current?.querySelector(
      `[data-workspace-strip-tab="${CSS.escape(activeWorkspaceId)}"]`
    )
    tab?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [activeWorkspaceId, visibleTabs])

  return (
    <div
      className="titlebar"
      role="tablist"
      aria-label={translate('auto.components.workspaceStrip.label', 'Workspace tabs')}
    >
      {/* Why: with the sidebar closed, the floating titlebar controls sit over this row's left edge. */}
      {sidebarOpen ? null : (
        <div className="shrink-0" style={{ width: 'var(--collapsed-sidebar-header-width)' }} />
      )}
      <div
        ref={scrollerRef}
        className="scrollbar-none flex h-full min-w-0 items-center gap-1 overflow-x-auto px-1"
      >
        {tabGroups.map((group, index) => (
          <Fragment key={group.projectId ?? 'no-project'}>
            {index > 0 ? (
              <div data-workspace-strip-divider="" className="mx-1 h-4 w-px shrink-0 bg-border" />
            ) : null}
            <WorkspaceStripGroupLabel projectId={group.projectId} />
            {group.tabs.map((workspaceId) => (
              <WorkspaceStripTab
                key={workspaceId}
                workspaceId={workspaceId}
                isActive={workspaceId === activeWorkspaceId}
                canClose={canClose}
                showProject={group.projectId === null}
                onActivate={activateTab}
                onClose={closeTab}
                onCloseOthers={closeOtherTabs}
              />
            ))}
          </Fragment>
        ))}
      </div>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            data-workspace-strip-add=""
            className="titlebar-icon-button ml-1"
            aria-label={addLabel}
            onClick={openWorkspaceSwitchPalette}
          >
            <Plus size={14} />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={6}>
          {addLabel}
        </TooltipContent>
      </Tooltip>
      <div className="min-w-0 flex-1" />
      {/* Why: on Windows and Linux the window buttons overlay this corner when the right sidebar is closed. */}
      {rightSidebarOpen ? null : (
        <div
          className="shrink-0"
          style={{ width: 'var(--window-controls-width, 0px)', ...NO_DRAG_REGION }}
        />
      )}
    </div>
  )
}

/** Names a project once, ahead of its tabs; hidden from assistive tech because each tab already carries it. */
function WorkspaceStripGroupLabel(props: { projectId: string | null }): React.JSX.Element | null {
  const name = useProjectName(props.projectId)
  if (!name) {
    return null
  }
  return (
    <span
      aria-hidden="true"
      data-workspace-strip-group={props.projectId ?? ''}
      className="max-w-40 shrink-[4] truncate pl-1 text-xs font-medium text-muted-foreground"
    >
      {name}
    </span>
  )
}
