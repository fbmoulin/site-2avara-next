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
import { updateContactStatus } from "../actions"

type Contact = {
  id: string
  name: string
  phone: string
  email: string
  subject: string
  message: string
  status: string
  createdAt: Date
  answeredAt: Date | null
  answeredBy: string | null
  notes: string | null
}

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  answered: "Respondido",
}

const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  answered: "default",
}

const tabs = [
  { label: "Todos", value: "all" },
  { label: "Pendentes", value: "pending" },
  { label: "Respondidos", value: "answered" },
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

export function ContatosClient({
  contacts,
  currentStatus,
}: {
  contacts: Contact[]
  currentStatus: string
}) {
  const [selected, setSelected] = useState<Contact | null>(null)
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  function openDetail(contact: Contact) {
    setSelected(contact)
    setNotes(contact.notes ?? "")
  }

  async function handleMarkAsAnswered() {
    if (!selected) return
    setSaving(true)
    await updateContactStatus(selected.id, "answered", "admin", notes)
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
                ? "/admin/contatos"
                : `/admin/contatos?status=${tab.value}`
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
            <TableHead>Email</TableHead>
            <TableHead>Assunto</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="py-8 text-center text-muted-foreground"
              >
                Nenhum contato encontrado
              </TableCell>
            </TableRow>
          ) : (
            contacts.map((contact) => (
              <TableRow key={contact.id}>
                <TableCell className="font-medium">{contact.name}</TableCell>
                <TableCell>{contact.email}</TableCell>
                <TableCell>{contact.subject}</TableCell>
                <TableCell>
                  <Badge
                    variant={statusVariants[contact.status] ?? "outline"}
                  >
                    {statusLabels[contact.status] ?? contact.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(contact.createdAt)}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => openDetail(contact)}
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
                <SheetDescription>{selected.email} &middot; {selected.phone}</SheetDescription>
              </SheetHeader>

              <div className="space-y-4 p-4">
                <div>
                  <Label className="text-muted-foreground">Assunto</Label>
                  <p className="mt-1 text-sm text-foreground">{selected.subject}</p>
                </div>

                <div>
                  <Label className="text-muted-foreground">Mensagem</Label>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                    {selected.message}
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
                  <Label className="text-muted-foreground">Data de envio</Label>
                  <p className="mt-1 text-sm text-foreground">
                    {formatDate(selected.createdAt)}
                  </p>
                </div>

                {selected.status === "pending" && (
                  <div className="space-y-3 border-t border-border pt-4">
                    <div>
                      <Label htmlFor="notes">Observações</Label>
                      <Textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Adicione observações sobre a resposta..."
                        className="mt-1"
                      />
                    </div>
                    <Button
                      onClick={handleMarkAsAnswered}
                      disabled={saving}
                      className="w-full"
                    >
                      {saving ? "Salvando..." : "Marcar como Respondido"}
                    </Button>
                  </div>
                )}

                {selected.answeredAt && (
                  <div className="space-y-2 border-t border-border pt-4">
                    <div>
                      <Label className="text-muted-foreground">Respondido em</Label>
                      <p className="mt-1 text-sm text-foreground">
                        {formatDate(selected.answeredAt)}
                      </p>
                    </div>
                    {selected.answeredBy && (
                      <div>
                        <Label className="text-muted-foreground">Respondido por</Label>
                        <p className="mt-1 text-sm text-foreground">
                          {selected.answeredBy}
                        </p>
                      </div>
                    )}
                    {selected.notes && (
                      <div>
                        <Label className="text-muted-foreground">Observações</Label>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                          {selected.notes}
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
