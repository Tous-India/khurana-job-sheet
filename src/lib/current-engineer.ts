'use client'

/**
 * Current-engineer resolution for the demo.
 *
 * The demo deliberately has no login: a login screen is friction in a 90-second
 * pitch (README 5.8). The engineer taps their name once and it persists to
 * localStorage.
 *
 * PRODUCTION TODO: replace the localStorage lookup inside these two functions
 * with a NextAuth session (phone OTP) plus admin/engineer roles. Every caller
 * goes through this module, so nothing outside it should need to change.
 */

const STORAGE_KEY = 'ke.currentEngineer'

export type CurrentEngineer = {
  id: string
  name: string
}

export function getCurrentEngineer(): CurrentEngineer | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    // Guard against a stale or hand-edited value shaped differently.
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      typeof (parsed as CurrentEngineer).id === 'string' &&
      typeof (parsed as CurrentEngineer).name === 'string'
    ) {
      return parsed as CurrentEngineer
    }
    return null
  } catch {
    // Private browsing or disabled storage — treat as "not selected".
    return null
  }
}

export function setCurrentEngineer(engineer: CurrentEngineer): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(engineer))
  } catch {
    // Non-fatal: the selection simply will not survive a reload.
  }
}

export function clearCurrentEngineer(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Non-fatal.
  }
}
