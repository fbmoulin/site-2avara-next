import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

function getRedis() {
  return Redis.fromEnv()
}

function createLimiter(requests: number, window: string, prefix: string) {
  return new Ratelimit({
    redis: getRedis(),
    limiter: Ratelimit.slidingWindow(requests, window as Parameters<typeof Ratelimit.slidingWindow>[1]),
    prefix,
  })
}

export const contactRateLimit = {
  get instance() { return createLimiter(3, "15 m", "rl:contact") },
}

export const appointmentRateLimit = {
  get instance() { return createLimiter(5, "15 m", "rl:appointment") },
}

export const demandRateLimit = {
  get instance() { return createLimiter(10, "15 m", "rl:demand") },
}

export async function checkRateLimit(
  limiter: { instance: Ratelimit },
  identifier: string
): Promise<{ success: boolean; remaining: number }> {
  if (!process.env.UPSTASH_REDIS_REST_URL) {
    return { success: true, remaining: 999 }
  }
  const { success, remaining } = await limiter.instance.limit(identifier)
  return { success, remaining }
}
