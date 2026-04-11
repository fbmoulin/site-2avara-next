import {
  Mail,
  Calendar,
  FileText,
  Newspaper,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getDashboardStats, getRecentActivity } from "./actions"

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date))
}

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  answered: "Respondido",
  pre_reserved: "Pré-reservado",
  confirmed: "Confirmado",
  cancelled: "Cancelado",
  resolved: "Resolvido",
}

const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  answered: "default",
  pre_reserved: "outline",
  confirmed: "default",
  cancelled: "destructive",
  resolved: "secondary",
}

const typeLabels: Record<string, string> = {
  contato: "Contato",
  agendamento: "Agendamento",
  demanda: "Demanda",
}

const typeVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  contato: "secondary",
  agendamento: "default",
  demanda: "outline",
}

export default async function AdminDashboard() {
  const stats = await getDashboardStats()
  const recentActivity = await getRecentActivity()

  const statCards = [
    {
      label: "Contatos Pendentes",
      value: stats.pendingContacts,
      icon: Mail,
    },
    {
      label: "Agendamentos",
      value: stats.pendingAppointments,
      icon: Calendar,
    },
    {
      label: "Demandas Abertas",
      value: stats.openDemands,
      icon: FileText,
    },
    {
      label: "Artigos",
      value: stats.totalArticles,
      icon: Newspaper,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Visão geral do painel administrativo
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {stat.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent activity */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          Atividade Recente
        </h2>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentActivity.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      Nenhuma atividade recente
                    </TableCell>
                  </TableRow>
                ) : (
                  recentActivity.map((item, i) => (
                    <TableRow key={`${item.type}-${i}`}>
                      <TableCell>
                        <Badge variant={typeVariants[item.type] ?? "outline"}>
                          {typeLabels[item.type] ?? item.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {item.description}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariants[item.status] ?? "outline"}>
                          {statusLabels[item.status] ?? item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(item.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
