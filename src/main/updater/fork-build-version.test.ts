import { describe, expect, it } from 'vitest'
import { isForkBuildVersion } from './fork-build-version'

describe('isForkBuildVersion', () => {
  it('recognises a fork build', () => {
    expect(isForkBuildVersion('1.4.224-fork.1')).toBe(true)
    expect(isForkBuildVersion('1.4.224-fork.12')).toBe(true)
  })

  it('leaves official and local builds alone', () => {
    expect(isForkBuildVersion('1.4.224')).toBe(false)
    expect(isForkBuildVersion('1.4.224-rc.2')).toBe(false)
    expect(isForkBuildVersion('1.4.224-local.1790000000000.abcdef123456')).toBe(false)
    expect(isForkBuildVersion('1.4.224-fork')).toBe(false)
    expect(isForkBuildVersion('1.4.224-rc.1.fork.1')).toBe(false)
  })
})
