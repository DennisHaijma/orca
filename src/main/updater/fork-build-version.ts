const FORK_BUILD_VERSION = /^\d+\.\d+\.\d+-fork\.\d+$/

/**
 * Whether a version names a fork build, e.g. `1.4.224-fork.1`.
 *
 * Why: a fork build is installed and replaced by its own packaging and is not signed with the
 * release identity, so the official feed can only offer it an update it must not take. Callers
 * treat it like an unpackaged build and skip every self-update path.
 */
export function isForkBuildVersion(version: string): boolean {
  return FORK_BUILD_VERSION.test(version)
}
