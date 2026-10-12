import { Fragment, useEffect, useRef } from 'react'
import { Folder, Plus } from 'lucide-react'
import { translate } from '@/i18n/i18n'
import { cn } from '@/lib/utils'
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
const GROUPED_STRIP_HEIGHT = { height: 52, minHeight: 52 } as const

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
  const renderTab = (workspaceId: string, showProject: boolean): React.JSX.Element => (
    <WorkspaceStripTab
      key={workspaceId}
      workspaceId={workspaceId}
      isActive={workspaceId === activeWorkspaceId}
      canClose={canClose}
      showProject={showProject}
      onActivate={activateTab}
      onClose={closeTab}
      onCloseOthers={closeOtherTabs}
    />
  )
  const grouped = tabGroups.some((group) => group.projectId !== null)
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
      // Why inline: the project headers need a second line, and the shared titlebar class fixes the height.
      style={grouped ? GROUPED_STRIP_HEIGHT : undefined}
      role="tablist"
      aria-label={translate('auto.components.workspaceStrip.label', 'Workspace tabs')}
    >
      {/* Why: with the sidebar closed, the floating titlebar controls sit over this row's left edge. */}
      {sidebarOpen ? null : (
        <div className="shrink-0" style={{ width: 'var(--collapsed-sidebar-header-width)' }} />
      )}
      <div
        ref={scrollerRef}
        className="scrollbar-none flex h-full min-w-0 items-center gap-4 overflow-x-auto px-1.5"
      >
        {tabGroups.map((group) =>
          group.projectId === null ? (
            <Fragment key="no-project">{group.tabs.map((id) => renderTab(id, true))}</Fragment>
          ) : (
            <WorkspaceStripGroup key={group.projectId} projectId={group.projectId}>
              {group.tabs.map((id) => renderTab(id, false))}
            </WorkspaceStripGroup>
          )
        )}
      </div>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            data-workspace-strip-add=""
            // Why the top margin: beside project headings the button belongs on the tab line, not between the two lines.
            className={cn('titlebar-icon-button ml-1', grouped && 'mt-[18px]')}
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

/** One project the way the sidebar shows it: folder and name as a heading, its workspaces beneath. */
function WorkspaceStripGroup(props: {
  projectId: string
  children: React.ReactNode
}): React.JSX.Element {
  const name = useProjectName(props.projectId)
  return (
    <div
      role="presentation"
      data-workspace-strip-group={props.projectId}
      className="flex min-w-0 shrink flex-col gap-0.5"
    >
      {/* Why hidden from assistive tech: each tab's own name already includes the project. */}
      <div
        aria-hidden="true"
        data-workspace-strip-caption=""
        className="flex h-4 min-w-0 items-center gap-1.5 px-2 text-[11px] font-semibold text-foreground"
      >
        <Folder size={11} className="shrink-0 text-muted-foreground" />
        <span className="min-w-0 truncate">{name}</span>
      </div>
      <div className="flex min-w-0 items-center gap-0.5">{props.children}</div>
    </div>
  )
}
