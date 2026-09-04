export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-md space-y-3 px-4 pt-20" aria-busy="true">
      <div className="h-[56px] animate-pulse rounded-xl bg-slate-200" />
      <div className="h-[52px] animate-pulse rounded-xl bg-slate-100" />
      <div className="h-[140px] animate-pulse rounded-xl border border-slate-200 bg-white" />
    </div>
  )
}
