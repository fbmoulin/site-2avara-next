import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { db } from "@/lib/db"
import { articles } from "@/lib/db/schema"
import { desc, eq } from "drizzle-orm"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"

export const revalidate = 60

export const metadata = {
  title: "Artigos - 2ª Vara Cível de Cariacica",
}

export default async function ArtigosPage() {
  const items = await db
    .select()
    .from(articles)
    .where(eq(articles.isPublished, true))
    .orderBy(desc(articles.publishedAt))

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Voltar ao início
      </Link>

      <h1 className="mb-8 text-3xl font-bold tracking-tight">Artigos</h1>

      {items.length === 0 ? (
        <p className="text-muted-foreground">
          Nenhum artigo publicado ainda.
        </p>
      ) : (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Link key={item.id} href={`/artigos/${item.slug}`}>
              <Card className="h-full transition-shadow hover:shadow-lg">
                <CardHeader>
                  <span className="w-fit rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-500">
                    {item.category}
                  </span>
                  <CardTitle className="font-semibold">{item.title}</CardTitle>
                </CardHeader>

                <CardContent className="flex-1">
                  {item.excerpt && (
                    <CardDescription className="line-clamp-2">
                      {item.excerpt}
                    </CardDescription>
                  )}
                </CardContent>

                <CardFooter className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {item.author}
                  </span>
                  {item.publishedAt && (
                    <time className="text-xs text-muted-foreground">
                      {new Date(item.publishedAt).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </time>
                  )}
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
