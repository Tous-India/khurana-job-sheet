'use client'

import { useRouter } from 'next/navigation'
import { setCurrentEngineer } from '@/lib/current-engineer'

type Engineer = { id: string; name: string }

/**
 * One tap selects the engineer and moves straight to the job list. Cards are
 * deliberately large — this is used one-handed, outdoors, often in sunlight.
 */
export function EngineerPicker({ engineers }: { engineers: Engineer[] }) {
  const router = useRouter()

  function select(engineer: Engineer) {
    setCurrentEngineer(engineer)
    router.push('/jobs')
  }

  if (engineers.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
        No engineers yet. Add them under Admin.
      </p>
    )
  }

  return (
    <ul className="grid grid-cols-2 gap-3">
      {engineers.map((e) => (
        <li key={e.id}>
          <button
            type="button"
            onClick={() => select(e)}
            className="tap-target w-full rounded-xl border border-slate-200 bg-white px-4 py-5 text-center shadow-sm transition active:scale-[0.98] hover:border-blue-400 hover:shadow"
          >
            <span
              aria-hidden
              className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-blue-800 text-base font-semibold text-white"
            >
              {e.name
                .split(' ')
                .map((p) => p[0])
                .slice(0, 2)
                .join('')
                .toUpperCase()}
            </span>
            <span className="block text-sm font-medium text-slate-800">
              {e.name}
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}
