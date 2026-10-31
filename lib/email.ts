import { logContact, ContactServiceError, errorCode } from "./contact-log"
import { contactSchema } from "./contact"
import { inquiryKey, submission } from "./submission"
import type { z } from "zod"

export function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    character =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ]!,
  )
}
function frame(title: string, content: string) {
  return `<!doctype html><html lang="en"><body style="margin:0;background:#f6f5ef;color:#171815;font-family:Arial,sans-serif"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td style="padding:32px 16px"><table role="presentation" width="100%" style="max-width:600px;margin:auto;background:#fff" cellspacing="0" cellpadding="0"><tr><td style="padding:28px;background:#111210;color:#fff;border-top:5px solid #d72828"><b style="color:#ef7773">[ ]</b> OPENBRACKET</td></tr><tr><td style="padding:28px"><h1 style="font-size:26px;margin:0 0 24px">${title}</h1>${content}</td></tr><tr><td style="padding:20px 28px;border-top:1px solid #ddd;font-size:12px">OpenBracket · Dallas–Fort Worth · <a style="color:#bd2222" href="https://openbracket.io">openbracket.io</a></td></tr></table></td></tr></table></body></html>`
}
export function emailTemplates(
  data: z.infer<typeof contactSchema>,
  timestamp: number,
) {
  const time = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "long",
    timeZone: "America/Chicago",
  }).format(timestamp)
  const fields = [
    ["Name", data.name],
    ["Email", data.email],
    ["Phone", data.phone],
    ["Company", data.company || "Not provided"],
    ["Project", data.projectType],
    ["Budget", data.budget || "Not provided"],
    ["Timing", data.timing || "Not provided"],
    ["Submitted (America/Chicago)", time],
  ]
  const text = `New project inquiry\n\n${fields.map(([label, value]) => `${label}: ${value}`).join("\n")}\n\n${data.message}`
  const html = frame(
    "New project inquiry",
    `<table role="presentation" width="100%">${fields.map(([label, value]) => `<tr><td style="padding:8px 12px 8px 0;vertical-align:top;color:#555">${label}</td><td style="padding:8px 0;overflow-wrap:anywhere">${escapeHtml(value)}</td></tr>`).join("")}</table><h2 style="font-size:18px">Project details</h2><p style="line-height:1.7">${escapeHtml(data.message).replace(/\r?\n/g, "<br>")}</p><p><a style="color:#bd2222" href="mailto:${escapeHtml(data.email)}">Reply to ${escapeHtml(data.name)}</a> · <a style="color:#bd2222" href="tel:${data.phone.replace(/[^+\d]/g, "")}">Call</a></p>`,
  )
  const acknowledgment = `Hi ${data.name.split(/\s+/)[0]},\n\nThanks for reaching out to OpenBracket. We’ve received your message and look forward to learning more about your project.\n\nWe’ll review your inquiry and get back to you soon. If you have anything else to add, you can reply to this email.\n\n— OpenBracket`
  return {
    text,
    html,
    acknowledgment,
    acknowledgmentHtml: frame(
      "We received your message",
      acknowledgment
        .split("\n\n")
        .map(part => `<p style="line-height:1.7">${escapeHtml(part)}</p>`)
        .join(""),
    ),
  }
}
export async function sendInquiry(
  data: z.infer<typeof contactSchema>,
  requestId?: string,
) {
  const { RESEND_API_KEY, CONTACT_FROM, CONTACT_TO } = process.env
  if (!RESEND_API_KEY || !CONTACT_FROM || !CONTACT_TO) {
    logContact("error", "email_configuration_missing", {
      requestId,
      missing: ["RESEND_API_KEY", "CONTACT_FROM", "CONTACT_TO"].filter(
        key => !process.env[key],
      ),
    })
    return "unavailable"
  }
  const key = inquiryKey(data)
  const record = await submission(key, "claim")
  if (record.state === "accepted") return "sent"
  if (record.state === "pending")
    throw new ContactServiceError(
      "SUBMISSION_IN_PROGRESS",
      "Submission already processing",
    )
  const templates = emailTemplates(data, record.at)
  async function deliver(payload: object, kind: string) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `contact/${key}/${kind}`,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
      cache: "no-store",
    })
    if (!response.ok)
      throw new ContactServiceError(
        "EMAIL_PROVIDER_REJECTED",
        "Email provider rejected request",
        response.status,
      )
    const result: unknown = await response.json()
    if (
      !result ||
      typeof result !== "object" ||
      !("id" in result) ||
      typeof result.id !== "string"
    )
      throw new ContactServiceError(
        "EMAIL_INVALID_RESPONSE",
        "Email provider returned no message ID",
      )
  }
  try {
    await deliver(
      {
        from: CONTACT_FROM,
        to: [CONTACT_TO],
        reply_to: data.email,
        subject: "New project inquiry — OpenBracket",
        text: templates.text,
        html: templates.html,
      },
      "notification",
    )
  } catch (error) {
    await submission(key, "release").catch(() => {})
    throw error
  }
  // The inquiry is accepted. A confirmation failure must never invite a duplicate inquiry.
  try {
    await submission(key, "accepted")
    await deliver(
      {
        from: CONTACT_FROM,
        to: [data.email],
        reply_to: CONTACT_TO,
        subject: "We received your message — OpenBracket",
        text: templates.acknowledgment,
        html: templates.acknowledgmentHtml,
      },
      "acknowledgment",
    )
  } catch (error) {
    logContact("error", "acknowledgment_failed", {
      requestId,
      code: errorCode(error),
      providerStatus:
        error instanceof ContactServiceError ? error.providerStatus : undefined,
    })
  }
  return "sent"
}
