'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  clearCurrentEngineer,
  getCurrentEngineer,
  type CurrentEngineer,
} from '@/lib/current-engineer'

/**
 * Shows who is filling sheets, and lets them switch. Reads localStorage in an
 * effect rather than during render, since the server has no access to it and a
 * direct read would produce a hydration mismatch.
 */
export function EngineerBadge() {
  const router = useRouter()
  const [engineer, setEngineer] = useState<CurrentEngineer | null>(null)

  useEffect(() => {
    const current = getCurrentEngineer()
    if (!current) {
      // Landed here without picking anyone — send them back to choose.
      router.replace('/')
      return
    }
    setEngineer(current)
  }, [router])

  function switchEngineer() {
    clearCurrentEngineer()
    router.push('/')
  }

  if (!engineer) return null

  return (
    <button
      type="button"
      onClick={switchEngineer}
      className="flex items-center gap-2 rounded-full border border-slate-200 py-1 pl-1 pr-3 text-left transition hover:border-blue-400"
      title="Switch engineer"
    >
      <span
        aria-hidden
        className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-800 text-[11px] font-semibold text-white"
      >
        {engineer.name
          .split(' ')
          .map((p) => p[0])
          .slice(0, 2)
          .join('')
          .toUpperCase()}
      </span>
      <span className="text-xs font-medium text-slate-700">{engineer.name}</span>
    </button>
  )
}
