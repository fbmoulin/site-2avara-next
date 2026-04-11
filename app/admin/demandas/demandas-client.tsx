"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { resolveDemand } from "../actions"

type Demand = {
  id: string
  processNumber: string
  demandType: string
  description: string
  status: string
  priority: string
  createdAt: Date
  resolvedAt: Date | null
  resolvedBy: string | null
  resolutionNotes: string | null
}

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  resolved: "Resolvido",
  in_progress: "Em andamento",
}

const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  resolved: "default",
  in_progress: "secondary",
}

const priorityLabels: Record<string, string> = {
  low: "Baixa",
  normal: "Normal",
  high: "Alta",
  urgent: "Urgente",
}

const priorityVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  low: "secondary",
  normal: "outline",
  high: "default",
  urgent: "destructive",
}

const demandTypeLabels: Record<string, string> = {
  certidao: "Certidão",
  copia: "Cópia",
  informacao: "Informação",
  peticao: "Petição",
  urgencia: "Urgência",
  outro: "Outro",
}

const tabs = [
  { label: "Todos", value: "all" },
  { label: "Pendentes", value: "pending" },
  { label: "Resolvidos", value: "resolved" },
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

export function DemandasClient({
  demands,
  currentStatus,
}: {
  demands: Demand[]
  currentStatus: string
}) {
  const [selected, setSelected] = useState<Demand | null>(null)
  const [resolutionNotes, setResolutionNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  function openDetail(demand: Demand) {
    setSelected(demand)
    setResolutionNotes("")
  }

  async function handleResolve() {
    if (!selected) return
    setSaving(true)
    await resolveDemand(selected.id, "admin", resolutionNotes)
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
                ? "/admin/demandas"
                : `/admin/demandas?status=${tab.value}`
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
            <TableHead>Processo</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Prioridade</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {demands.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="py-8 text-center text-muted-foreground"
              >
                Nenhuma demanda encontrada
              </TableCell>
            </TableRow>
          ) : (
            demands.map((demand) => (
              <TableRow key={demand.id}>
                <TableCell className="font-mono text-xs font-medium">
                  {demand.processNumber}
                </TableCell>
                <TableCell>
                  {demandTypeLabels[demand.demandType] ?? demand.demandType}
                </TableCell>
                <TableCell>
                  <Badge variant={priorityVariants[demand.priority] ?? "outline"}>
                    {priorityLabels[demand.priority] ?? demand.priority}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariants[demand.status] ?? "outline"}>
                    {statusLabels[demand.status] ?? demand.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(demand.createdAt)}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => openDetail(demand)}
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
                <SheetTitle>Demanda</SheetTitle>
                <SheetDescription>
                  Processo: {selected.processNumber}
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-4 p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Tipo</Label>
                    <p className="mt-1 text-sm text-foreground">
                      {demandTypeLabels[selected.demandType] ?? selected.demandType}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Prioridade</Label>
                    <div className="mt-1">
                      <Badge variant={priorityVariants[selected.priority] ?? "outline"}>
                        {priorityLabels[selected.priority] ?? selected.priority}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-muted-foreground">Descrição</Label>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                    {selected.description}
                  </p>
                </div>

                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    <Badge variant={statusVariants[selected.status] ?? "outline"}>
                      {statusLabels[selected.status] ?? selected.status}
                    </Badge>
                  </div>
                </div>

                <div>
                  <Label className="text-muted-foreground">Data de criação</Label>
                  <p className="mt-1 text-sm text-foreground">
                    {formatDate(selected.createdAt)}
                  </p>
                </div>

                {selected.status === "pending" && (
                  <div className="space-y-3 border-t border-border pt-4">
                    <div>
                      <Label htmlFor="resolutionNotes">Notas da resolução</Label>
                      <Textarea
                        id="resolutionNotes"
                        value={resolutionNotes}
                        onChange={(e) => setResolutionNotes(e.target.value)}
                        placeholder="Descreva como a demanda foi resolvida..."
                        className="mt-1"
                      />
                    </div>
                    <Button
                      onClick={handleResolve}
                      disabled={saving}
                      className="w-full"
                    >
                      {saving ? "Salvando..." : "Marcar como Resolvido"}
                    </Button>
                  </div>
                )}

                {selected.resolvedAt && (
                  <div className="space-y-2 border-t border-border pt-4">
                    <div>
                      <Label className="text-muted-foreground">Resolvido em</Label>
                      <p className="mt-1 text-sm text-foreground">
                        {formatDate(selected.resolvedAt)}
                      </p>
                    </div>
                    {selected.resolvedBy && (
                      <div>
                        <Label className="text-muted-foreground">Resolvido por</Label>
                        <p className="mt-1 text-sm text-foreground">
                          {selected.resolvedBy}
                        </p>
                      </div>
                    )}
                    {selected.resolutionNotes && (
                      <div>
                        <Label className="text-muted-foreground">Notas</Label>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                          {selected.resolutionNotes}
                        </p>
                      </div>
                    )}
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
