// /noticias reads the database; the skeleton shows at once while the page loads (R3.4).
export default function NewsLoading() {
  return (
    <div role="status" className="mx-auto max-w-7xl px-4 py-12 md:px-6">
      <span className="sr-only">Carregando notícias…</span>
      <div
        aria-hidden="true"
        className="mb-8 h-9 w-64 animate-pulse rounded bg-muted motion-reduce:animate-none"
      />
      <div aria-hidden="true" className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div
            key={index}
            className="h-48 animate-pulse rounded-xl bg-muted motion-reduce:animate-none"
          />
        ))}
      </div>
    </div>
  )
}
