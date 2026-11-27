import { Scale } from "lucide-react"
import { CONTACT_INFO } from "@/lib/constants"

// R2.9: every text at least 4.5:1 on slate-950 (slate-300 ≈ 12:1, amber-400 ≈ 10:1) and a hidden
// h2 so the footer h3s sit under a heading of their own level.
export function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-300">
      <h2 className="sr-only">Informações do portal</h2>
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <div className="grid gap-8 md:grid-cols-2">
          {/* Branding */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Scale aria-hidden="true" className="size-7 text-amber-400" />
              <h3 className="text-sm font-bold text-white">
                Poder Judiciário do Estado do Espírito Santo
              </h3>
            </div>
            <p className="text-sm leading-relaxed">
              Comprometidos com a excelência na prestação jurisdicional e com a
              humanização da Justiça.
            </p>
          </div>

          {/* Contact info */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              Contato
            </h3>
            <p className="text-sm">{CONTACT_INFO.address}</p>
            <p className="text-sm">
              <a
                href={CONTACT_INFO.phoneHref}
                className="underline-offset-2 hover:text-white hover:underline"
              >
                {CONTACT_INFO.phone}
              </a>
            </p>
            <p className="text-sm">
              <a
                href={`mailto:${CONTACT_INFO.email}`}
                className="break-all underline-offset-2 hover:text-white hover:underline"
              >
                {CONTACT_INFO.email}
              </a>
            </p>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-800 pt-6 text-center text-xs">
          <p>
            &copy; 2026 2ª Vara Cível de Cariacica. Todos os direitos
            reservados.
          </p>
          <p className="mt-2 text-slate-300">
            Desenvolvido e publicado por Felipe Moulin — Instagram:{" "}
            <a
              href="https://www.instagram.com/felipemoulinjus/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400 underline-offset-2 transition-colors hover:text-amber-300 hover:underline"
            >
              @felipemoulinjus
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
