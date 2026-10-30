import { contactSchema } from "./contact"
import type { z } from "zod"
export async function sendInquiry(data: z.infer<typeof contactSchema>) {
  const { RESEND_API_KEY, CONTACT_FROM, CONTACT_TO } = process.env
  if (!RESEND_API_KEY || !CONTACT_FROM || !CONTACT_TO) return "unavailable"
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
      ...(data.submissionId
        ? { "Idempotency-Key": `contact/${data.submissionId}` }
        : {}),
    },
    body: JSON.stringify({
      from: CONTACT_FROM,
      to: [CONTACT_TO],
      reply_to: data.email,
      subject: "New OpenBracket project inquiry",
      text: `Name: ${data.name}\nEmail: ${data.email}\nCompany: ${data.company || "Not provided"}\nProject: ${data.projectType}\nBudget: ${data.budget || "Not provided"}\nTiming: ${data.timing || "Not provided"}\n\n${data.message}`,
    }),
    signal: AbortSignal.timeout(10000),
  })
  if (!response.ok) return "failed"
  const result: unknown = await response.json()
  return typeof result === "object" &&
    result !== null &&
    "id" in result &&
    typeof result.id === "string"
    ? "sent"
    : "failed"
}
