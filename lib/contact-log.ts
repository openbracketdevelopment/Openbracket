import { randomUUID } from "node:crypto"

export class ContactServiceError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly providerStatus?: number,
  ) {
    super(message)
    this.name = "ContactServiceError"
  }
}

// Only explicit operational metadata belongs here: never form values, IPs,
// credentials, provider response bodies, or arbitrary exception messages.
export function logContact(
  level: "info" | "warn" | "error",
  event: string,
  details: {
    requestId?: string
    status?: number
    durationMs?: number
    code?: string
    providerStatus?: number
    missing?: string[]
  },
) {
  console[level](JSON.stringify({ scope: "contact", event, ...details }))
}
export function errorCode(error: unknown) {
  if (error instanceof ContactServiceError) return error.code
  if (
    error instanceof Error &&
    ["TimeoutError", "AbortError"].includes(error.name)
  )
    return "UPSTREAM_TIMEOUT"
  if (error instanceof TypeError) return "UPSTREAM_NETWORK_ERROR"
  if (error instanceof SyntaxError) return "UPSTREAM_INVALID_JSON"
  return "UNEXPECTED_ERROR"
}
export const contactRequestId = () => randomUUID()
