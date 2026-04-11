import { getNewsItems } from "../actions"
import { NoticiasClient } from "./noticias-client"

export default async function NoticiasPage() {
  const newsItems = await getNewsItems()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Notícias</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie as notícias exibidas no portal
        </p>
      </div>

      <NoticiasClient newsItems={newsItems} />
    </div>
  )
}
