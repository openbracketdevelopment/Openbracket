import { createHash } from "node:crypto"
const local = new Map<string, { count: number; reset: number }>()
export async function allowContact(request: Request) {
  // Use only a header overwritten by the trusted hosting proxy. Never trust arbitrary forwarded headers.
  const header = process.env.CONTACT_IP_HEADER
  const ip = header
    ? request.headers.get(header)?.split(",")[0]?.trim()
    : "local"
  if (process.env.NODE_ENV === "production" && (!header || !ip))
    throw new Error("Trusted proxy IP configuration required")
  const key = `contact:${createHash("sha256")
    .update(ip || "local")
    .digest("hex")}:${Math.floor(Date.now() / 600000)}`
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (url && token) {
    const response = await fetch(`${url}/eval`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        "local n = redis.call('INCR', KEYS[1]); if n == 1 then redis.call('EXPIRE', KEYS[1], 600) end; return n",
        1,
        key,
      ]),
      signal: AbortSignal.timeout(3000),
    })
    if (!response.ok) throw new Error("Rate limiter unavailable")
    const data: unknown = await response.json()
    if (
      typeof data !== "object" ||
      data === null ||
      !("result" in data) ||
      typeof data.result !== "number"
    )
      throw new Error("Invalid rate limiter response")
    return data.result <= 5
  }
  if (process.env.NODE_ENV === "production")
    throw new Error("Distributed rate limiter required")
  for (const [key, value] of local)
    if (value.reset < Date.now()) local.delete(key)
  const entry = local.get(key) || { count: 0, reset: Date.now() + 600000 }
  entry.count++
  local.set(key, entry)
  return entry.count <= 5
}
