import { Scale } from "lucide-react"
import { CONTACT_INFO } from "@/lib/constants"

export function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Branding */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Scale className="size-7 text-amber-400" />
              <span className="text-sm font-bold text-white">
                Poder Judiciário do Estado do Espírito Santo
              </span>
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
            <p className="text-sm">{CONTACT_INFO.phone}</p>
            <p className="text-sm">{CONTACT_INFO.email}</p>
          </div>

          {/* Links */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              Institucional
            </h3>
            <a
              href="#"
              className="text-sm transition-colors hover:text-white"
            >
              Política de Privacidade
            </a>
            <a
              href="#"
              className="text-sm transition-colors hover:text-white"
            >
              Termos de Uso
            </a>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-800 pt-6 text-center text-xs">
          <p>
            &copy; 2026 2ª Vara Cível de Cariacica. Todos os direitos
            reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
