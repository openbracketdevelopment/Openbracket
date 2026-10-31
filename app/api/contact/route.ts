import {
  contactRequestId,
  logContact,
  errorCode,
  ContactServiceError,
} from "../../../lib/contact-log"
import { contactSchema } from "../../../lib/contact"
import { sendInquiry } from "../../../lib/email"
import { allowContact } from "../../../lib/rate-limit"
import { site } from "../../../data/site"
export const runtime = "nodejs"
export async function POST(request: Request) {
  const requestId = contactRequestId()
  const started = performance.now()
  function respond(
    body: Record<string, unknown>,
    status = 200,
    headers: Record<string, string> = {},
  ) {
    logContact(
      status >= 500 ? "error" : status >= 400 ? "warn" : "info",
      "request_completed",
      {
        requestId,
        status,
        durationMs: Math.round(performance.now() - started),
      },
    )
    return Response.json(
      { ...body, requestId },
      {
        status,
        headers: {
          ...headers,
          "Cache-Control": "no-store",
          "X-Request-ID": requestId,
        },
      },
    )
  }
  const origin = request.headers.get("origin")
  const allowedOrigin = process.env.SITE_URL || new URL(request.url).origin
  const previewOrigin =
    process.env.CONTEXT && process.env.CONTEXT !== "production"
      ? process.env.DEPLOY_PRIME_URL
      : undefined
  if (origin && origin !== allowedOrigin && origin !== previewOrigin)
    return respond({ error: "Invalid origin." }, 403)
  const type = request.headers.get("content-type") || ""
  if (
    !type.startsWith("multipart/form-data") &&
    !type.startsWith("application/x-www-form-urlencoded")
  ) {
    return respond({ error: "Use form data." }, 415)
  }
  // Bound the streamed body, including requests without Content-Length.
  const reader = request.body?.getReader()
  if (!reader) return respond({ error: "Missing body." }, 400)
  const chunks: Uint8Array[] = []
  let size = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.byteLength
    if (size > 20000) {
      await reader.cancel()
      return respond({ error: "Request too large." }, 413)
    }
    chunks.push(value)
  }
  let form: FormData
  try {
    form = await new Response(new Blob(chunks as BlobPart[]), {
      headers: { "content-type": type },
    }).formData()
  } catch {
    return respond({ error: "Invalid form data." }, 400)
  }
  const result = contactSchema.safeParse(Object.fromEntries(form))
  if (!result.success) {
    const fields: Record<string, string> = {}
    for (const issue of result.error.issues)
      fields[String(issue.path[0])] ||= issue.message
    return respond(
      { error: "Please check the highlighted fields.", fields },
      400,
    )
  }
  if (result.data.website)
    return respond({ error: "Unable to accept this submission." }, 400)
  try {
    if (!(await allowContact(request)))
      return respond(
        {
          error:
            "Too many attempts. Please wait ten minutes or email us directly.",
        },
        429,
        { "Retry-After": "600" },
      )
  } catch (error) {
    logContact("error", "rate_limit_failed", {
      requestId,
      code: errorCode(error),
      providerStatus:
        error instanceof ContactServiceError ? error.providerStatus : undefined,
    })
    return respond(
      {
        error: `The form is temporarily unavailable. Please email ${site.email}.`,
      },
      503,
    )
  }
  try {
    const delivery = await sendInquiry(result.data, requestId)
    if (delivery === "unavailable")
      return respond(
        {
          error: `The form is not configured yet. Please email ${site.email}.`,
        },
        503,
      )
    if (delivery !== "sent")
      return respond(
        { error: "Email delivery failed. Please retry or email us directly." },
        502,
      )
    return respond({ ok: true })
  } catch (error) {
    if (
      error instanceof ContactServiceError &&
      error.code === "SUBMISSION_IN_PROGRESS"
    )
      return respond(
        {
          error:
            "Your inquiry is already being processed. Please wait before trying again.",
        },
        409,
      )
    logContact("error", "email_delivery_failed", {
      requestId,
      code: errorCode(error),
      providerStatus:
        error instanceof ContactServiceError ? error.providerStatus : undefined,
    })
    return respond(
      {
        error: "Email delivery unavailable. Please retry or email us directly.",
      },
      502,
    )
  }
}
