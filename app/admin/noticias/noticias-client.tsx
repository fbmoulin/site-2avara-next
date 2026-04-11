"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ExternalLink, RefreshCw } from "lucide-react"
import { toggleNewsActive } from "../actions"

type NewsItem = {
  id: string
  externalId: string
  title: string
  link: string
  description: string | null
  category: string | null
  publishedAt: Date | null
  fetchedAt: Date
  isActive: boolean
}

function formatDate(date: Date | null) {
  if (!date) return "-"
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date))
}

export function NoticiasClient({ newsItems }: { newsItems: NewsItem[] }) {
  const router = useRouter()
  const [fetching, setFetching] = useState(false)

  async function handleFetchNews() {
    setFetching(true)
    try {
      const response = await fetch("/api/news", { method: "POST" })
      if (response.ok) {
        router.refresh()
      }
    } finally {
      setFetching(false)
    }
  }

  async function handleToggle(item: NewsItem) {
    await toggleNewsActive(item.id, !item.isActive)
    router.refresh()
  }

  return (
    <>
      {/* Header with fetch button */}
      <div className="flex items-center justify-end">
        <Button
          onClick={handleFetchNews}
          disabled={fetching}
          size="sm"
          variant="outline"
        >
          <RefreshCw className={`size-4 ${fetching ? "animate-spin" : ""}`} />
          {fetching ? "Buscando..." : "Buscar Notícias"}
        </Button>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Título</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Ativo</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {newsItems.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="py-8 text-center text-muted-foreground"
              >
                Nenhuma notícia encontrada
              </TableCell>
            </TableRow>
          ) : (
            newsItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="max-w-[350px] truncate font-medium">
                  {item.title}
                </TableCell>
                <TableCell>{item.category ?? "-"}</TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(item.publishedAt)}
                </TableCell>
                <TableCell>
                  <Badge variant={item.isActive ? "default" : "outline"}>
                    {item.isActive ? "Ativo" : "Inativo"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant={item.isActive ? "destructive" : "default"}
                      size="xs"
                      onClick={() => handleToggle(item)}
                    >
                      {item.isActive ? "Desativar" : "Ativar"}
                    </Button>
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="ghost" size="icon-sm">
                        <ExternalLink className="size-4" />
                      </Button>
                    </a>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </>
  )
}
