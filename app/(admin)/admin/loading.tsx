// Panel pages read the database on every request (R3.4).
export default function AdminLoading() {
  return (
    <div role="status" className="space-y-4 py-8">
      <span className="sr-only">Carregando…</span>
      <div
        aria-hidden="true"
        className="h-8 w-56 animate-pulse rounded bg-muted motion-reduce:animate-none"
      />
      <div
        aria-hidden="true"
        className="h-40 animate-pulse rounded-xl bg-muted motion-reduce:animate-none"
      />
    </div>
  )
}
