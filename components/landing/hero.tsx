export function Hero() {
  return (
    <section
      id="inicio"
      className="relative flex min-h-[600px] items-center justify-center bg-slate-900"
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/60 to-slate-900" />

      {/* Subtle pattern */}
      <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_1px_1px,_white_1px,_transparent_0)] bg-[size:40px_40px]" />

      <div className="relative z-10 mx-auto max-w-4xl px-4 py-20 text-center md:px-6">
        <p className="mb-6 text-sm font-semibold tracking-[0.2em] text-amber-400 uppercase">
          2ª Vara Cível &mdash; Comarca de Cariacica - ES
        </p>

        <h1 className="mb-8 text-4xl font-bold leading-tight tracking-tight text-white md:text-6xl">
          Excelência e Celeridade na Prestação Jurisdicional
        </h1>

        <p className="mx-auto mb-10 max-w-2xl text-lg text-slate-300">
          Comprometidos com a humanização da Justiça e o uso de tecnologia para
          uma prestação jurisdicional mais eficiente e acessível.
        </p>

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href="#servicos"
            className="inline-flex h-12 items-center justify-center rounded-lg bg-amber-500 px-8 text-base font-semibold text-foreground transition-colors hover:bg-amber-400"
          >
            Nossos Serviços
          </a>
          <a
            href="#contato"
            className="inline-flex h-12 items-center justify-center rounded-lg border border-white px-8 text-base font-semibold text-white transition-colors hover:bg-background/10"
          >
            Fale Conosco
          </a>
        </div>
      </div>
    </section>
  )
}
