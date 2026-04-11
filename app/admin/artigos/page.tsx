import { getArticles } from "../actions"
import { ArtigosClient } from "./artigos-client"

export default async function ArtigosPage() {
  const articles = await getArticles()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Artigos</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie os artigos e publicações do portal
        </p>
      </div>

      <ArtigosClient articles={articles} />
    </div>
  )
}
