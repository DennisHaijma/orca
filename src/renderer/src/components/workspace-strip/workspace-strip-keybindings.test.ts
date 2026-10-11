import { describe, expect, it } from 'vitest'
import {
  getEffectiveKeybindingsForAction,
  getKeybindingDefinition
} from '../../../../shared/keybindings'

const STRIP_ACTIONS = [
  'workspaceStrip.nextTab',
  'workspaceStrip.previousTab',
  'workspaceStrip.closeTab'
] as const

describe('workspace strip shortcuts', () => {
  it('registers the three strip actions as global shortcuts', () => {
    for (const action of STRIP_ACTIONS) {
      const definition = getKeybindingDefinition(action)
      expect(definition?.group).toBe('Global')
      expect(definition?.scope).toBe('global')
    }
  })

  it('ships them unassigned on every platform', () => {
    for (const action of STRIP_ACTIONS) {
      for (const platform of ['darwin', 'linux', 'win32'] as const) {
        expect(getEffectiveKeybindingsForAction(action, platform)).toEqual([])
      }
    }
  })
})
