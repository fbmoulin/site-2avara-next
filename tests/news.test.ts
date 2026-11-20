import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test"

// Synthetic feed in the format published by the TJES WordPress site. No production data.
const SAMPLE_RSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
<channel>
  <title>TJES &#8211; Últimas notícias</title>
  <item>
    <title>Mutirão de conciliação &#8220;Justiça Cidadã&#8221; em Cariacica</title>
    <link>https://www.tjes.jus.br/mutirao-de-conciliacao/</link>
    <pubDate>Thu, 13 Nov 2026 15:30:00 +0000</pubDate>
    <category><![CDATA[Institucional]]></category>
    <guid isPermaLink="false">https://www.tjes.jus.br/?p=101</guid>
    <description><![CDATA[<p>Evento fictício &amp; sintético para teste.</p>]]></description>
  </item>
  <item>
    <title>Item com link externo</title>
    <link>https://tjes.jus.br.example.com/golpe/</link>
    <guid isPermaLink="false">https://www.tjes.jus.br/?p=102</guid>
  </item>
  <item>
    <title>Item com domínio parecido</title>
    <link>https://faketjes.jus.br/noticia/</link>
    <guid isPermaLink="false">https://www.tjes.jus.br/?p=103</guid>
  </item>
  <item>
    <title>Item sem https</title>
    <link>http://www.tjes.jus.br/sem-https/</link>
    <guid isPermaLink="false">https://www.tjes.jus.br/?p=104</guid>
  </item>
  <item>
    <title>Plantão judiciário no feriado</title>
    <link>https://www.tjes.jus.br/plantao/?p=105&#038;utm=rss</link>
    <pubDate>data inválida</pubDate>
    <guid isPermaLink="false">https://www.tjes.jus.br/?p=105</guid>
  </item>
</channel>
</rss>`

let existing: { externalId: string; title: string }[] = []
let inserted: Record<string, unknown>[] = []
let updates = 0
let dbFails = false
let lastLimit: number | undefined
let revalidated: string[] = []
let fetchCalls: { url: string; init?: RequestInit }[] = []
let feedResponse: () => Promise<Response> = async () => new Response(SAMPLE_RSS, { status: 200 })

mock.module("next/cache", () => ({
  revalidatePath: (path: string) => {
    revalidated.push(path)
  },
}))
mock.module("../lib/db", () => ({
  db: {
    select: () => ({
      from: () => {
        if (dbFails) return Promise.reject(new Error("SQL details with parameters"))
        const rows = Promise.resolve(existing)
        return Object.assign(rows, {
          where: () => ({
            orderBy: () => ({
              limit: async (value: number) => {
                lastLimit = value
                return []
              },
            }),
          }),
        })
      },
    }),
    insert: () => ({
      values: async (value: Record<string, unknown>) => {
        inserted.push(value)
      },
    }),
    update: () => ({
      set: () => ({
        where: async () => {
          updates++
        },
      }),
    }),
  },
}))

const { extractFromRss, isAllowedNewsLink, scrapeNews, NEWS_FEED_URL, NEWS_USER_AGENT } =
  await import("../lib/news-scraper")
const { GET } = await import("../app/api/news/route")
const { NextRequest } = await import("next/server")

const SECRET = "local-test-only-secret"
const originalFetch = globalThis.fetch
const savedSecret = process.env.CRON_SECRET
const consoleInfo = console.info
const consoleError = console.error
let logs: string[] = []

beforeEach(() => {
  existing = []
  inserted = []
  updates = 0
  dbFails = false
  lastLimit = undefined
  revalidated = []
  fetchCalls = []
  logs = []
  feedResponse = async () => new Response(SAMPLE_RSS, { status: 200 })
  process.env.CRON_SECRET = SECRET
  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    fetchCalls.push({ url: String(input), init })
    return feedResponse()
  }) as typeof fetch
  console.info = (line: string) => void logs.push(line)
  console.error = (line: string) => void logs.push(line)
})
afterEach(() => {
  globalThis.fetch = originalFetch
  console.info = consoleInfo
  console.error = consoleError
  if (savedSecret === undefined) delete process.env.CRON_SECRET
  else process.env.CRON_SECRET = savedSecret
})

function cronRequest(authorization?: string) {
  return new NextRequest("http://localhost/api/news?cron=true", {
    headers: authorization ? { authorization } : {},
  })
}

describe("RSS parsing", () => {
  test("out-of-range numeric entities stay as written instead of throwing", () => {
    const xml = `<rss><channel><item><title>Teste &#99999999; e &#x110000; ok &#233;</title><link>https://www.tjes.jus.br/x/</link><guid>g-1</guid></item></channel></rss>`
    const { items } = extractFromRss(xml)
    expect(items).toHaveLength(1)
    expect(items[0].title).toBe("Teste &#99999999; e &#x110000; ok é")
  })

  test("parses the sample feed and discards links outside https tjes.jus.br", () => {
    const { items, skipped } = extractFromRss(SAMPLE_RSS)
    expect(skipped).toBe(3)
    expect(items).toHaveLength(2)
    expect(items[0]).toEqual({
      externalId: "https://www.tjes.jus.br/?p=101",
      title: "Mutirão de conciliação “Justiça Cidadã” em Cariacica",
      link: "https://www.tjes.jus.br/mutirao-de-conciliacao/",
      description: "Evento fictício & sintético para teste.",
      category: "Institucional",
      publishedAt: new Date("2026-11-13T15:30:00Z"),
    })
    expect(items[1].link).toBe("https://www.tjes.jus.br/plantao/?p=105&utm=rss")
    expect(items[1].publishedAt).toBeNull()
  })

  test.each([
    ["https://www.tjes.jus.br/x", true],
    ["https://tjes.jus.br/x", true],
    ["https://WWW.TJES.JUS.BR/x", true],
    ["http://www.tjes.jus.br/x", false],
    ["https://faketjes.jus.br/x", false],
    ["https://tjes.jus.br.example.com/x", false],
    ["https://user:pass@www.tjes.jus.br/x", false],
    ["javascript:alert(1)//tjes.jus.br", false],
    ["não é url", false],
  ])("link %s allowed = %s", (link, allowed) => {
    expect(isAllowedNewsLink(link)).toBe(allowed)
  })
})

describe("News collection", () => {
  test("requests the feed directly with identifiable headers and no proxy", async () => {
    await scrapeNews()
    expect(fetchCalls).toHaveLength(1)
    expect(fetchCalls[0].url).toBe(NEWS_FEED_URL)
    const headers = fetchCalls[0].init?.headers as Record<string, string>
    expect(headers["User-Agent"]).toBe(NEWS_USER_AGENT)
    expect(headers["User-Agent"]).toContain("2avaraciveldecariacica.org")
    expect(headers.Accept).toBe("application/rss+xml, application/xml;q=0.9, */*;q=0.8")
    expect(fetchCalls.some((call) => call.url.includes("jina.ai"))).toBe(false)
  })

  test("only valid items are inserted; changed titles are updated", async () => {
    existing = [{ externalId: "https://www.tjes.jus.br/?p=105", title: "Título antigo" }]
    const result = await scrapeNews()
    expect(result).toEqual({ fetched: 2, inserted: 1, updated: 1, skipped: 3, errors: [] })
    expect(inserted.map((row) => row.link)).toEqual(["https://www.tjes.jus.br/mutirao-de-conciliacao/"])
    expect(updates).toBe(1)
  })

  test("a blocked feed is reported with status and content type, without a second attempt", async () => {
    feedResponse = async () =>
      new Response("<html>Access denied</html>", {
        status: 403,
        headers: { "content-type": "text/html" },
      })
    const result = await scrapeNews()
    expect(result.failure).toBe("feed")
    expect(result.errors).toEqual(["feed_http_403 content_type=text/html"])
    expect(fetchCalls).toHaveLength(1)
    expect(inserted).toHaveLength(0)
  })

  test("an HTML page with status 200 counts as a feed failure", async () => {
    feedResponse = async () => new Response("<html>challenge</html>", { status: 200 })
    const result = await scrapeNews()
    expect(result.failure).toBe("feed")
    expect(result.errors[0]).toStartWith("feed_without_valid_items")
  })

  test("database errors are reported without SQL text", async () => {
    dbFails = true
    const result = await scrapeNews()
    expect(result.failure).toBe("database")
    expect(result.errors.join(" ")).not.toContain("SQL")
  })
})

describe("GET /api/news?cron=true", () => {
  test.each([
    [undefined],
    ["Bearer wrong"],
    [`Bearer ${SECRET}x`],
    [`Bearer ${SECRET.slice(0, -1)}`],
    [SECRET],
    [`bearer ${SECRET}`],
  ])("authorization %s is rejected with 401 and no collection", async (authorization) => {
    const response = await GET(cronRequest(authorization))
    expect(response.status).toBe(401)
    expect(fetchCalls).toHaveLength(0)
    expect(revalidated).toHaveLength(0)
  })

  test("missing CRON_SECRET fails closed with 503", async () => {
    delete process.env.CRON_SECRET
    const response = await GET(cronRequest("Bearer "))
    expect(response.status).toBe(503)
    expect(fetchCalls).toHaveLength(0)
  })

  test("valid secret collects, logs a JSON summary and revalidates home and /noticias", async () => {
    const response = await GET(cronRequest(`Bearer ${SECRET}`))
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ fetched: 2, inserted: 2, updated: 0 })
    expect(revalidated).toEqual(["/", "/noticias"])
    expect(logs).toHaveLength(1)
    const entry = JSON.parse(logs[0])
    expect(entry).toMatchObject({
      event: "news_scrape",
      fetched: 2,
      inserted: 2,
      updated: 0,
      skipped: 3,
      errors: [],
      revalidated: true,
    })
    expect(logs[0]).not.toContain("Mutirão")
  })

  test("nothing new means no revalidation", async () => {
    existing = [
      {
        externalId: "https://www.tjes.jus.br/?p=101",
        title: "Mutirão de conciliação “Justiça Cidadã” em Cariacica",
      },
      { externalId: "https://www.tjes.jus.br/?p=105", title: "Plantão judiciário no feriado" },
    ]
    const response = await GET(cronRequest(`Bearer ${SECRET}`))
    expect(response.status).toBe(200)
    expect(revalidated).toHaveLength(0)
  })

  test("blocked feed returns 502 and logs the error", async () => {
    feedResponse = async () => new Response("", { status: 403 })
    const response = await GET(cronRequest(`Bearer ${SECRET}`))
    expect(response.status).toBe(502)
    expect(JSON.parse(logs[0])).toMatchObject({ event: "news_scrape", failure: "feed", fetched: 0 })
    expect(revalidated).toHaveLength(0)
  })
})

describe("GET /api/news?limit", () => {
  test.each([
    [null, 10],
    ["5", 5],
    ["1", 1],
    ["50", 50],
    ["0", 10],
    ["51", 10],
    ["-3", 10],
    ["2.5", 10],
    ["abc", 10],
    ["", 10],
    ["1e400", 10],
  ])("limit=%s queries %i items", async (limit, expected) => {
    const url = new URL("http://localhost/api/news")
    if (limit !== null) url.searchParams.set("limit", limit)
    const response = await GET(new NextRequest(url))
    expect(response.status).toBe(200)
    expect(lastLimit).toBe(expected)
  })
})
