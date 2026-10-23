import { strict as assert } from "node:assert"
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"
import { checkRateLimit } from "../../lib/rate-limit"

// Exercise the installed SDK and its real HTTP transport in an isolated process.
// No credentials, external Redis, or mocked Ratelimit response are involved.
let release!: () => void
const delayed = new Promise<void>((resolve) => {
  release = resolve
})
let requests = 0
const server = Bun.serve({
  hostname: "127.0.0.1",
  port: 0,
  async fetch() {
    requests++
    await delayed
    return Response.json({ result: [2, 3] })
  },
})
const redis = new Redis({ url: server.url.origin, token: "local-fixture", retry: false })
const instance = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "15 m"),
  timeout: 30,
  ephemeralCache: false,
})
process.env.UPSTASH_REDIS_REST_URL = server.url.origin
try {
  const result = await instance.limit("raw-sdk")
  assert.equal(result.success, true)
  assert.equal(result.reason, "timeout")
  assert.ok(requests > 0, "The SDK must actually attempt the Redis HTTP request")
  const protectedResult = await checkRateLimit({ instance }, "application")
  console.log(
    JSON.stringify({
      sdk: { success: result.success, reason: result.reason },
      application: protectedResult,
    }),
  )
  assert.deepEqual(protectedResult, { success: false, remaining: 0, unavailable: true })
} finally {
  release()
  await server.stop()
}
