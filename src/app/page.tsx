import { listActiveEngineers } from '@/lib/db'
import { withDbErrors } from '@/lib/db-error'
import { EngineerPicker } from '@/components/engineer-picker'

// Engineer selection is the app entry point (README 5.8): one tap, no login.
// Rendered per request so admin changes to the engineer list appear immediately.
export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const engineers = await withDbErrors(() => listActiveEngineers())

  return (
    <main className="flex-1 px-5 py-10 max-w-md mx-auto w-full">
      <header className="mb-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          KHURANA <span className="font-normal">ELECTRONICS</span>
        </h1>
        <p className="mt-1 text-sm text-slate-500">Job Sheet Portal</p>
      </header>

      <h2 className="mb-3 text-sm font-medium text-slate-700">
        Who is filling this sheet?
      </h2>

      <EngineerPicker engineers={engineers} />

      <p className="mt-8 text-center text-xs text-slate-400">
        1456-HBC, Sec-14, Behind Gandhi Park, Sonipat-131001
        <br />
        0130-4018060 &middot; 9053000270
      </p>
    </main>
  )
}
