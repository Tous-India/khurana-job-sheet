export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-md px-4 pt-24 text-center" aria-busy="true">
      <div className="mx-auto h-11 w-11 animate-spin rounded-full border-2 border-slate-200 border-t-blue-700" />
      <p className="mt-4 text-sm text-slate-500">Opening job sheet…</p>
    </div>
  )
}
