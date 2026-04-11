import Image from "next/image"
import { User, Users, Target, Lightbulb } from "lucide-react"
import { JUDGE_INFO } from "@/lib/constants"
import { ScrollReveal } from "@/components/motion/scroll-reveal"
import { StaggerContainer, StaggerItem } from "@/components/motion/stagger-container"

const TEAM = [
  { name: "Andreza", role: "Assessora" },
  { name: "Scarllety", role: "Assessora" },
  { name: "Ana Clara", role: "Estagiária" },
  { name: "Isla", role: "Estagiária" },
]

export function Judge() {
  return (
    <section id="magistrado" className="bg-background py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        {/* Judge profile */}
        <div className="grid items-center gap-12 md:grid-cols-2">
          {/* Image */}
          <ScrollReveal variant="fade-up" delay={0.1}>
          <div className="relative mx-auto aspect-[3/4] w-full max-w-md overflow-hidden rounded-2xl bg-muted">
            <Image
              src="/images/forum_1764897995940.jpg"
              alt={`Foto do ${JUDGE_INFO.name}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          </div>
          </ScrollReveal>

          {/* Text */}
          <ScrollReveal variant="fade-up" delay={0.2}>
            <p className="mb-2 text-sm font-semibold tracking-wider text-amber-500 uppercase">
              Magistrado
            </p>
            <h2 className="mb-2 text-3xl font-bold text-foreground md:text-4xl">
              {JUDGE_INFO.name}
            </h2>
            <p className="mb-6 text-lg font-medium text-amber-600">
              {JUDGE_INFO.role}
            </p>
            <p className="text-base leading-relaxed text-muted-foreground">
              {JUDGE_INFO.bio}
            </p>
          </ScrollReveal>
        </div>

        {/* Mission and Vision cards */}
        <StaggerContainer direction="up" className="mt-16 grid gap-6 md:grid-cols-2">
          <StaggerItem><div className="rounded-xl border border-border bg-muted p-8">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-amber-100">
                <Target className="size-5 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Missão</h3>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Prestar jurisdição com celeridade, qualidade e humanização,
              utilizando ferramentas tecnológicas e de inteligência artificial
              para garantir o acesso efetivo à justiça e a resolução adequada
              dos conflitos.
            </p>
          </div></StaggerItem>

          <StaggerItem><div className="rounded-xl border border-border bg-muted p-8">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-amber-100">
                <Lightbulb className="size-5 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Visão</h3>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Ser referência na modernização do Poder Judiciário, promovendo uma
              Justiça mais ágil, transparente e acessível por meio da inovação e
              do compromisso com a excelência.
            </p>
          </div></StaggerItem>
        </StaggerContainer>

        {/* Team */}
        <div className="mt-16">
          <ScrollReveal variant="fade-up">
            <h3 className="mb-8 flex items-center justify-center gap-3 text-center text-2xl font-bold text-foreground">
              <Users className="size-7 text-amber-500" />
              Equipe do Gabinete
            </h3>
          </ScrollReveal>
          <StaggerContainer direction="left" className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {TEAM.map((person) => (
              <StaggerItem key={person.name} direction="left">
                <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-background p-6 text-center">
                  <div className="flex size-16 items-center justify-center rounded-full bg-muted">
                    <User className="size-8 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{person.name}</p>
                    <p className="text-sm text-amber-600">{person.role}</p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </div>
    </section>
  )
}
