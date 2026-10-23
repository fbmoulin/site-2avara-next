import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

function getRedis() {
  return Redis.fromEnv()
}

function createLimiter(requests: number, window: string, prefix: string) {
  return new Ratelimit({
    redis: getRedis(),
    limiter: Ratelimit.slidingWindow(
      requests,
      window as Parameters<typeof Ratelimit.slidingWindow>[1]
    ),
    prefix,
  })
}

function lazyLimiter(requests: number, window: string, prefix: string) {
  let cached: Ratelimit | null = null
  return {
    get instance() {
      if (!cached) cached = createLimiter(requests, window, prefix)
      return cached
    },
  }
}

export const contactRateLimit = lazyLimiter(3, "15 m", "rl:contact")
export const appointmentRateLimit = lazyLimiter(5, "15 m", "rl:appointment")
export const demandRateLimit = lazyLimiter(10, "15 m", "rl:demand")
export const chatRateLimit = lazyLimiter(20, "15 m", "rl:chat")

export async function checkRateLimit(
  limiter: { instance: Ratelimit },
  identifier: string
): Promise<{ success: boolean; remaining: number; unavailable?: boolean }> {
  if (!process.env.UPSTASH_REDIS_REST_URL) {
    if (process.env.NODE_ENV === "production") {
      console.error("[rate-limit] Required production protection is not configured")
      return { success: false, remaining: 0, unavailable: true }
    }
    return { success: true, remaining: 999 }
  }
  try {
    const { success, remaining, reason } = await limiter.instance.limit(identifier)
    // The SDK resolves timeouts as success; an unverified quota must still deny access.
    if (reason === "timeout") {
      console.error("[rate-limit] Protection timed out — failing closed")
      return { success: false, remaining: 0, unavailable: true }
    }
    return { success, remaining }
  } catch {
    console.error("[rate-limit] Protection unavailable — failing closed")
    return { success: false, remaining: 0, unavailable: true }
  }
}
