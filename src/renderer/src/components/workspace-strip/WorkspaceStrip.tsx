import { Fragment, useEffect, useRef } from 'react'
import { Plus } from 'lucide-react'
import { translate } from '@/i18n/i18n'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { OpenWorkspaceTabs } from './open-workspace-tabs'
import { useOpenWorkspaceTabs } from './use-open-workspace-tabs'
import {
  openWorkspaceSwitchPalette,
  useProjectCaption,
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
        className="scrollbar-none flex h-full min-w-0 items-center gap-1.5 overflow-x-auto px-1.5"
      >
        {tabGroups.map((group) =>
          group.projectId === null ? (
            <Fragment key="no-project">{group.tabs.map((id) => renderTab(id, true))}</Fragment>
          ) : (
            <WorkspaceStripGroup
              key={group.projectId}
              projectId={group.projectId}
              tabs={group.tabs}
            >
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

/** One project's tabs inside a shared outline, so the row reads as projects first and workspaces second. */
function WorkspaceStripGroup(props: {
  projectId: string
  tabs: OpenWorkspaceTabs
  children: React.ReactNode
}): React.JSX.Element {
  const caption = useProjectCaption(props.projectId, props.tabs)
  return (
    <div
      role="presentation"
      data-workspace-strip-group={props.projectId}
      className="flex h-7 min-w-0 shrink items-center gap-0.5 rounded-lg border border-border bg-foreground/[0.03] px-0.5"
    >
      {/* Why hidden from assistive tech: each tab's own name already includes the project. */}
      {caption ? (
        <span
          aria-hidden="true"
          data-workspace-strip-caption=""
          className="max-w-32 shrink-[4] truncate px-1.5 text-[10px] font-medium tracking-wider text-muted-foreground/70 uppercase"
        >
          {caption}
        </span>
      ) : null}
      {props.children}
    </div>
  )
}
