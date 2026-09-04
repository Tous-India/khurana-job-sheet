export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-md px-4 pt-20" aria-busy="true">
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-[86px] animate-pulse rounded-xl border border-slate-200 bg-white"
          />
        ))}
      </div>
      <p className="mt-4 text-center text-xs text-slate-400">Loading job sheets…</p>
    </div>
  )
}
