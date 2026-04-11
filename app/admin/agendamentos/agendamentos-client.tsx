"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Eye } from "lucide-react"
import { confirmAppointment, rejectAppointment } from "../actions"

type Appointment = {
  id: string
  type: string
  withWhom: string
  name: string
  oabNumber: string | null
  processNumber: string
  reason: string
  status: string
  preferredDate: Date | null
  confirmedDate: Date | null
  zoomLink: string | null
  createdAt: Date
  confirmedAt: Date | null
  confirmedBy: string | null
  notes: string | null
}

const statusLabels: Record<string, string> = {
  pre_reserved: "Pré-reservado",
  confirmed: "Confirmado",
  cancelled: "Cancelado",
}

const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pre_reserved: "outline",
  confirmed: "default",
  cancelled: "destructive",
}

const typeLabels: Record<string, string> = {
  presencial: "Presencial",
  virtual: "Virtual",
}

const withWhomLabels: Record<string, string> = {
  juiz: "Juiz",
  assessor: "Assessor",
  diretor: "Diretor de Secretaria",
}

const tabs = [
  { label: "Todos", value: "all" },
  { label: "Pré-reservados", value: "pre_reserved" },
  { label: "Confirmados", value: "confirmed" },
  { label: "Cancelados", value: "cancelled" },
]

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date))
}

export function AgendamentosClient({
  appointments,
  currentStatus,
}: {
  appointments: Appointment[]
  currentStatus: string
}) {
  const [selected, setSelected] = useState<Appointment | null>(null)
  const [confirmedDate, setConfirmedDate] = useState("")
  const [zoomLink, setZoomLink] = useState("")
  const [rejectNotes, setRejectNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const [mode, setMode] = useState<"view" | "confirm" | "reject">("view")
  const router = useRouter()

  function openDetail(appointment: Appointment) {
    setSelected(appointment)
    setConfirmedDate("")
    setZoomLink("")
    setRejectNotes("")
    setMode("view")
  }

  async function handleConfirm() {
    if (!selected || !confirmedDate) return
    setSaving(true)
    await confirmAppointment(selected.id, confirmedDate, zoomLink, "admin")
    setSaving(false)
    setSelected(null)
    router.refresh()
  }

  async function handleReject() {
    if (!selected) return
    setSaving(true)
    await rejectAppointment(selected.id, rejectNotes)
    setSaving(false)
    setSelected(null)
    router.refresh()
  }

  return (
    <>
      {/* Status filter tabs */}
      <div className="flex gap-2">
        {tabs.map((tab) => (
          <Link
            key={tab.value}
            href={
              tab.value === "all"
                ? "/admin/agendamentos"
                : `/admin/agendamentos?status=${tab.value}`
            }
          >
            <Button
              variant={currentStatus === tab.value ? "default" : "outline"}
              size="sm"
            >
              {tab.label}
            </Button>
          </Link>
        ))}
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Com Quem</TableHead>
            <TableHead>Processo</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {appointments.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="py-8 text-center text-muted-foreground"
              >
                Nenhum agendamento encontrado
              </TableCell>
            </TableRow>
          ) : (
            appointments.map((apt) => (
              <TableRow key={apt.id}>
                <TableCell className="font-medium">{apt.name}</TableCell>
                <TableCell>{typeLabels[apt.type] ?? apt.type}</TableCell>
                <TableCell>{withWhomLabels[apt.withWhom] ?? apt.withWhom}</TableCell>
                <TableCell className="font-mono text-xs">{apt.processNumber}</TableCell>
                <TableCell>
                  <Badge variant={statusVariants[apt.status] ?? "outline"}>
                    {statusLabels[apt.status] ?? apt.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(apt.createdAt)}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => openDetail(apt)}
                  >
                    <Eye className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Detail Sheet */}
      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent side="right" className="sm:max-w-lg overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.name}</SheetTitle>
                <SheetDescription>
                  {typeLabels[selected.type] ?? selected.type} &middot;{" "}
                  {withWhomLabels[selected.withWhom] ?? selected.withWhom}
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-4 p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Processo</Label>
                    <p className="mt-1 font-mono text-sm text-foreground">
                      {selected.processNumber}
                    </p>
                  </div>
                  {selected.oabNumber && (
                    <div>
                      <Label className="text-muted-foreground">OAB</Label>
                      <p className="mt-1 text-sm text-foreground">
                        {selected.oabNumber}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-muted-foreground">Motivo</Label>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                    {selected.reason}
                  </p>
                </div>

                {selected.preferredDate && (
                  <div>
                    <Label className="text-muted-foreground">Data preferencial</Label>
                    <p className="mt-1 text-sm text-foreground">
                      {formatDate(selected.preferredDate)}
                    </p>
                  </div>
                )}

                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    <Badge variant={statusVariants[selected.status] ?? "outline"}>
                      {statusLabels[selected.status] ?? selected.status}
                    </Badge>
                  </div>
                </div>

                {selected.confirmedDate && (
                  <div>
                    <Label className="text-muted-foreground">Data confirmada</Label>
                    <p className="mt-1 text-sm text-foreground">
                      {formatDate(selected.confirmedDate)}
                    </p>
                  </div>
                )}

                {selected.zoomLink && (
                  <div>
                    <Label className="text-muted-foreground">Link Zoom</Label>
                    <a
                      href={selected.zoomLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 block text-sm text-primary underline"
                    >
                      {selected.zoomLink}
                    </a>
                  </div>
                )}

                {/* Actions for pre_reserved appointments */}
                {selected.status === "pre_reserved" && mode === "view" && (
                  <div className="flex gap-2 border-t border-border pt-4">
                    <Button onClick={() => setMode("confirm")} className="flex-1">
                      Confirmar
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => setMode("reject")}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                  </div>
                )}

                {selected.status === "pre_reserved" && mode === "confirm" && (
                  <div className="space-y-3 border-t border-border pt-4">
                    <div>
                      <Label htmlFor="confirmedDate">Data e hora confirmada</Label>
                      <Input
                        id="confirmedDate"
                        type="datetime-local"
                        value={confirmedDate}
                        onChange={(e) => setConfirmedDate(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="zoomLink">Link Zoom (opcional)</Label>
                      <Input
                        id="zoomLink"
                        type="url"
                        value={zoomLink}
                        onChange={(e) => setZoomLink(e.target.value)}
                        placeholder="https://zoom.us/j/..."
                        className="mt-1"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleConfirm}
                        disabled={saving || !confirmedDate}
                        className="flex-1"
                      >
                        {saving ? "Salvando..." : "Confirmar Agendamento"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setMode("view")}
                      >
                        Voltar
                      </Button>
                    </div>
                  </div>
                )}

                {selected.status === "pre_reserved" && mode === "reject" && (
                  <div className="space-y-3 border-t border-border pt-4">
                    <div>
                      <Label htmlFor="rejectNotes">Motivo do cancelamento</Label>
                      <Textarea
                        id="rejectNotes"
                        value={rejectNotes}
                        onChange={(e) => setRejectNotes(e.target.value)}
                        placeholder="Informe o motivo do cancelamento..."
                        className="mt-1"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="destructive"
                        onClick={handleReject}
                        disabled={saving}
                        className="flex-1"
                      >
                        {saving ? "Salvando..." : "Confirmar Cancelamento"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setMode("view")}
                      >
                        Voltar
                      </Button>
                    </div>
                  </div>
                )}

                {selected.notes && (
                  <div className="border-t border-border pt-4">
                    <Label className="text-muted-foreground">Observações</Label>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                      {selected.notes}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
