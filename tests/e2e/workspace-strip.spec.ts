import path from 'node:path'
import type { Page } from '@stablyai/playwright-test'
import { test, expect } from './helpers/orca-app'
import {
  ensureTerminalVisible,
  getActiveWorktreeId,
  getAllWorktreeIds,
  switchToWorktree,
  waitForActiveWorktree,
  waitForSessionReady
} from './helpers/store'

// Why: opt-in screenshots for the fork's FEATURE.md and pull-request proof; never written by default.
const SCREENSHOT_DIR = process.env.ORCA_WORKSPACE_STRIP_SCREENSHOT_DIR

// Why clipped: only the two tab rows are evidence; the terminal below can show a developer's shell output.
async function screenshotTabRows(page: Page, name: string): Promise<void> {
  if (!SCREENSHOT_DIR) {
    return
  }
  const width = await page.evaluate(() => window.innerWidth)
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, name),
    clip: { x: 0, y: 0, width, height: 76 }
  })
}

test.describe('Workspace tab strip', () => {
  test('is off by default and shows open workspaces as tabs once enabled', async ({ orcaPage }) => {
    await waitForSessionReady(orcaPage)
    const firstWorktreeId = await waitForActiveWorktree(orcaPage)
    await ensureTerminalVisible(orcaPage)

    const strip = orcaPage.getByRole('tablist', { name: 'Workspace tabs' })
    await expect(strip).toHaveCount(0)

    await orcaPage.evaluate(() => {
      const store = window.__store
      if (!store) {
        throw new Error('window.__store is not available - was the app built with --mode e2e?')
      }
      void store.getState().updateSettings({ workspaceTabStrip: true })
    })

    await expect(strip).toBeVisible()
    const tabs = strip.getByRole('tab')
    await expect(tabs).toHaveCount(1)
    await expect(tabs.first()).toHaveAttribute('aria-selected', 'true')

    // The strip is the top row; the existing tab row sits below it.
    const stripBox = await strip.boundingBox()
    const tabRowBox = await orcaPage.locator('[data-tab-group-strip-id]').first().boundingBox()
    expect(stripBox?.y).toBe(0)
    expect(tabRowBox?.y ?? 0).toBeGreaterThanOrEqual((stripBox?.y ?? 0) + (stripBox?.height ?? 0) - 1)

    const otherWorktreeId = (await getAllWorktreeIds(orcaPage)).find(
      (id) => id !== firstWorktreeId
    )
    test.skip(!otherWorktreeId, 'the seeded repo has a single workspace')
    await switchToWorktree(orcaPage, otherWorktreeId!)

    await expect(tabs).toHaveCount(2)
    await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true')
    await screenshotTabRows(orcaPage, 'strip-sidebar-open.png')

    // Clicking a tab switches workspace.
    await tabs.first().click()
    await expect(tabs.first()).toHaveAttribute('aria-selected', 'true')
    await expect.poll(() => getActiveWorktreeId(orcaPage)).toBe(firstWorktreeId)

    // With the sidebar closed, tabs stay clear of the floating titlebar controls and remain clickable.
    await orcaPage.evaluate(() => window.__store?.getState().setSidebarOpen(false))
    // Why read from the strip: the reserved width is a CSS variable set on the app root, inherited here.
    const reservedWidth = (): Promise<number> =>
      strip.evaluate((element) =>
        Number.parseFloat(
          getComputedStyle(element).getPropertyValue('--collapsed-sidebar-header-width')
        )
      )
    await expect
      .poll(async () => {
        const reserved = await reservedWidth()
        const firstTabBox = await tabs.first().boundingBox()
        return firstTabBox !== null && reserved > 0 && firstTabBox.x >= reserved
      })
      .toBe(true)
    // The row below no longer reserves that space, so its first tab starts at the left edge.
    const lowerRowTabs = orcaPage.locator('[data-tab-group-strip-id] > div > div.flex-1').first()
    expect((await lowerRowTabs.boundingBox())?.x ?? Infinity).toBeLessThan(await reservedWidth())
    await screenshotTabRows(orcaPage, 'strip-sidebar-closed.png')
    await tabs.nth(1).click()
    await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true')

    // Closing the active tab moves to its neighbor and keeps the workspace itself.
    await tabs.nth(1).hover()
    await tabs.nth(1).getByRole('button', { name: 'Close workspace tab' }).click()
    await expect(tabs).toHaveCount(1)
    await expect(tabs.first()).toHaveAttribute('aria-selected', 'true')
    await expect.poll(() => getActiveWorktreeId(orcaPage)).toBe(firstWorktreeId)
    expect(await getAllWorktreeIds(orcaPage)).toContain(otherWorktreeId)

    // The last tab cannot be closed.
    await tabs.first().hover()
    await expect(tabs.first().getByRole('button', { name: 'Close workspace tab' })).toHaveCount(0)
  })
})
