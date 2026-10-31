import { createHash } from "node:crypto"
import { ContactServiceError } from "./contact-log"
import type { contactSchema } from "./contact"
import type { z } from "zod"

// Content identity also catches retries with a new client UUID. No personal data is stored.
export function inquiryKey(data: z.infer<typeof contactSchema>) {
  const { submissionId: _id, website: _trap, ...content } = data
  void _id
  void _trap
  return createHash("sha256").update(JSON.stringify(content)).digest("hex")
}
const local = new Map<string, { at: number; state: string; lease?: number }>()
export async function submission(
  key: string,
  action: "claim" | "accepted" | "release",
) {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  const now = Date.now()
  if (!url || !token) {
    if (process.env.NODE_ENV === "production")
      throw new ContactServiceError(
        "DUPLICATE_STORAGE_CONFIGURATION",
        "Shared storage required",
      )
    for (const [id, value] of local)
      if (now - value.at > 86400000) local.delete(id)
    let record = local.get(key)
    if (!record || now - record.at > 86400000) {
      record = { at: now, state: "idle" }
      local.set(key, record)
    }
    if (record.state === "pending" && now > (record.lease || 0))
      record.state = "idle"
    const state = record.state
    if (action === "claim" && state === "idle") record.lease = now + 60000
    record.state =
      action === "claim"
        ? state === "idle"
          ? "pending"
          : state
        : action === "accepted"
          ? "accepted"
          : "idle"
    return { state, at: record.at }
  }
  const script = `local at = redis.call('HGET', KEYS[1], 'at'); if not at then at = ARGV[2]; redis.call('HSET', KEYS[1], 'at', at); redis.call('EXPIRE', KEYS[1], 86400) end; local state = redis.call('HGET', KEYS[1], 'state') or 'idle'; if state == 'pending' and tonumber(redis.call('HGET', KEYS[1], 'lease') or '0') < tonumber(ARGV[2]) then state = 'idle' end; if ARGV[1] == 'claim' then if state == 'idle' then redis.call('HSET', KEYS[1], 'state', 'pending', 'lease', tonumber(ARGV[2]) + 60000) end elseif ARGV[1] == 'accepted' then redis.call('HSET', KEYS[1], 'state', 'accepted') else redis.call('HSET', KEYS[1], 'state', 'idle') end; return {state, at}`
  const response = await fetch(url.replace(/\/+$/, ""), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([
      "EVAL",
      script,
      1,
      `inquiry:${key}`,
      action,
      String(now),
    ]),
    signal: AbortSignal.timeout(3000),
    cache: "no-store",
  })
  if (!response.ok)
    throw new ContactServiceError(
      "DUPLICATE_STORAGE_FAILED",
      "Submission storage unavailable",
      response.status,
    )
  const body: unknown = await response.json()
  if (
    !body ||
    typeof body !== "object" ||
    !("result" in body) ||
    !Array.isArray(body.result) ||
    typeof body.result[0] !== "string" ||
    !Number.isFinite(Number(body.result[1]))
  )
    throw new ContactServiceError(
      "DUPLICATE_STORAGE_FAILED",
      "Invalid submission state",
    )
  return { state: body.result[0] as string, at: Number(body.result[1]) }
}
