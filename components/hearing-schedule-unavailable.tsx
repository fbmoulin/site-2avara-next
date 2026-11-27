import { BALCAO_VIRTUAL_URL, CONTACT_INFO } from "@/lib/constants"

// Shown by /pauta when the schedule cannot be read (R2.9): says where to confirm a hearing.
export function HearingScheduleUnavailable() {
  return (
    <div role="alert" className="rounded-lg border-l-4 border-red-700 bg-red-50 p-4 text-red-900">
      <p className="font-semibold">Não foi possível consultar a pauta agora.</p>
      <p className="mt-2">
        Para confirmar data, horário ou modalidade de uma audiência, use o{" "}
        <a
          href={BALCAO_VIRTUAL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium underline underline-offset-2"
        >
          Balcão Virtual do TJES<span className="sr-only"> (abre em nova aba)</span>
        </a>{" "}
        ou ligue para o gabinete:{" "}
        <a href={CONTACT_INFO.phoneHref} className="font-medium underline underline-offset-2">
          {CONTACT_INFO.phone}
        </a>
        . A intimação também informa o local e a modalidade.
      </p>
    </div>
  )
}
