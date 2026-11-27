import { PlayCircle } from "lucide-react"
import { SERVICES } from "@/lib/constants"

const HEARINGS_SERVICE = SERVICES.find((service) => service.tutorialVideo)

/** Highlights the Zoom hearing tutorial on the home page; the same video stays in the services card. */
export function ZoomTutorialHighlight() {
  const video = HEARINGS_SERVICE?.tutorialVideo
  if (!video) return null

  return (
    <section
      id="tutorial-zoom"
      aria-labelledby="tutorial-zoom-heading"
      className="border-y-4 border-amber-500 bg-amber-50 px-4 py-14"
    >
      <div className="mx-auto max-w-3xl">
        <p className="mb-2 flex items-center justify-center gap-2 text-sm font-semibold tracking-wider text-amber-800 uppercase">
          <PlayCircle className="size-5" aria-hidden="true" />
          Vídeo de 2 minutos
        </p>
        <h2
          id="tutorial-zoom-heading"
          className="text-center text-3xl font-bold text-foreground md:text-4xl"
        >
          Vai participar de audiência pelo Zoom?
        </h2>
        <p className="mt-3 text-center text-slate-700">
          Veja como instalar o aplicativo, entrar na sala e se preparar para a audiência.
        </p>

        <figure className="mt-8">
          <video
            controls
            playsInline
            preload="none"
            poster={video.poster}
            aria-labelledby="tutorial-zoom-heading"
            aria-describedby="tutorial-zoom-desc"
            className="aspect-video w-full rounded-xl bg-black shadow-lg ring-1 ring-amber-200"
          >
            <source src={video.src} type="video/mp4" />
            Seu navegador não reproduz vídeos.{" "}
            <a href={video.src} className="underline">
              Baixe o vídeo
            </a>
            .
          </video>
          <figcaption id="tutorial-zoom-desc" className="mt-3 text-center text-sm text-slate-700">
            {video.description}
          </figcaption>
        </figure>

        <p className="mt-6 text-center">
          <a
            href="#servicos"
            className="font-medium text-amber-800 underline underline-offset-4 hover:no-underline"
          >
            Prefere ler? Veja o passo a passo e os links do Zoom em Serviços
          </a>
        </p>
      </div>
    </section>
  )
}
