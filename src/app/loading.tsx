export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-md px-5 pt-24" aria-busy="true">
      <div className="grid grid-cols-2 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-[104px] animate-pulse rounded-xl border border-slate-200 bg-white"
          />
        ))}
      </div>
    </div>
  )
}
