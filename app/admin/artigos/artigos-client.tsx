"use client"

import { useState } from "react"
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
import { Plus, Pencil } from "lucide-react"
import {
  createArticle,
  updateArticle,
  toggleArticlePublish,
} from "../actions"

type Article = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string
  author: string
  category: string
  imageUrl: string | null
  isPublished: boolean
  isFeatured: boolean
  publishedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date))
}

const emptyForm = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  author: "2ª Vara Cível de Cariacica",
  category: "Artigo Jurídico",
  imageUrl: "",
}

export function ArtigosClient({ articles }: { articles: Article[] }) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<Article | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setSheetOpen(true)
  }

  function openEdit(article: Article) {
    setEditing(article)
    setForm({
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt ?? "",
      content: article.content,
      author: article.author,
      category: article.category,
      imageUrl: article.imageUrl ?? "",
    })
    setSheetOpen(true)
  }

  function handleTitleChange(title: string) {
    setForm((prev) => ({
      ...prev,
      title,
      slug: editing ? prev.slug : slugify(title),
    }))
  }

  async function handleSubmit() {
    if (!form.title || !form.content) return
    setSaving(true)

    if (editing) {
      await updateArticle(editing.id, {
        title: form.title,
        slug: form.slug,
        excerpt: form.excerpt || undefined,
        content: form.content,
        author: form.author,
        category: form.category,
        imageUrl: form.imageUrl || undefined,
      })
    } else {
      await createArticle({
        title: form.title,
        slug: form.slug || slugify(form.title),
        excerpt: form.excerpt,
        content: form.content,
        author: form.author,
        category: form.category,
        imageUrl: form.imageUrl || undefined,
      })
    }

    setSaving(false)
    setSheetOpen(false)
    router.refresh()
  }

  async function handleTogglePublish(article: Article) {
    await toggleArticlePublish(article.id, !article.isPublished)
    router.refresh()
  }

  return (
    <>
      {/* Header with create button */}
      <div className="flex items-center justify-end">
        <Button onClick={openCreate} size="sm">
          <Plus className="size-4" />
          Novo Artigo
        </Button>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Título</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {articles.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="py-8 text-center text-muted-foreground"
              >
                Nenhum artigo encontrado
              </TableCell>
            </TableRow>
          ) : (
            articles.map((article) => (
              <TableRow key={article.id}>
                <TableCell className="max-w-[300px] truncate font-medium">
                  {article.title}
                </TableCell>
                <TableCell>{article.category}</TableCell>
                <TableCell>
                  <Badge
                    variant={article.isPublished ? "default" : "outline"}
                  >
                    {article.isPublished ? "Publicado" : "Rascunho"}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(article.createdAt)}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => openEdit(article)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant={article.isPublished ? "destructive" : "default"}
                      size="xs"
                      onClick={() => handleTogglePublish(article)}
                    >
                      {article.isPublished ? "Despublicar" : "Publicar"}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Create/Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {editing ? "Editar Artigo" : "Novo Artigo"}
            </SheetTitle>
            <SheetDescription>
              {editing
                ? "Atualize os dados do artigo"
                : "Preencha os campos para criar um novo artigo"}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 p-4">
            <div>
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Título do artigo"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={form.slug}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, slug: e.target.value }))
                }
                placeholder="titulo-do-artigo"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="excerpt">Resumo</Label>
              <Textarea
                id="excerpt"
                value={form.excerpt}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, excerpt: e.target.value }))
                }
                placeholder="Breve resumo do artigo..."
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="content">Conteúdo</Label>
              <Textarea
                id="content"
                value={form.content}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, content: e.target.value }))
                }
                placeholder="Conteúdo completo do artigo..."
                className="mt-1 min-h-40"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="author">Autor</Label>
                <Input
                  id="author"
                  value={form.author}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, author: e.target.value }))
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="category">Categoria</Label>
                <Input
                  id="category"
                  value={form.category}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, category: e.target.value }))
                  }
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="imageUrl">URL da Imagem (opcional)</Label>
              <Input
                id="imageUrl"
                type="url"
                value={form.imageUrl}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, imageUrl: e.target.value }))
                }
                placeholder="https://..."
                className="mt-1"
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={saving || !form.title || !form.content}
              className="w-full"
            >
              {saving
                ? "Salvando..."
                : editing
                  ? "Salvar Alterações"
                  : "Criar Artigo"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
