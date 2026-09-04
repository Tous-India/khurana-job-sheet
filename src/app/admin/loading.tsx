export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-20" aria-busy="true">
      <div className="h-[120px] animate-pulse rounded-xl border border-slate-200 bg-white" />
      <div className="mt-4 h-[240px] animate-pulse rounded-xl border border-slate-200 bg-white" />
    </div>
  )
}
