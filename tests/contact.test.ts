import { test } from "node:test"
import assert from "node:assert/strict"
import { contactSchema } from "../lib/contact"
import { POST } from "../app/api/contact/route"
const valid = {
  name: " Alex ",
  email: "alex@example.com",
  projectType: "Not sure yet",
  message: "A new website for our business.",
}
function request(values = valid, origin = "http://localhost:3000") {
  return new Request("http://localhost:3000/api/contact", {
    method: "POST",
    headers: { origin },
    body: new URLSearchParams(values),
  })
}
test("validation normalizes fields and rejects missing, invalid and oversized values", () => {
  assert.equal(contactSchema.parse(valid).name, "Alex")
  for (const value of [
    { ...valid, email: "bad" },
    { ...valid, message: "short" },
    { ...valid, name: "" },
    { ...valid, message: "a".repeat(5001) },
    { ...valid, projectType: "invented" },
    { ...valid, projectType: undefined },
    { ...valid, budget: "invented" },
  ])
    assert.equal(contactSchema.safeParse(value).success, false)
})
test("endpoint rejects foreign origins, oversized bodies, spam and invalid fields", async () => {
  assert.equal(
    (await POST(request(valid, "https://foreign.example"))).status,
    403,
  )
  const invalid = await POST(request({ ...valid, email: "invalid" }))
  assert.equal(invalid.status, 400)
  assert.ok((await invalid.json()).fields.email)
  assert.equal(
    (await POST(request({ ...valid, message: "x".repeat(21000) }))).status,
    413,
  )
  assert.equal(
    (
      await POST(
        new Request("http://localhost:3000/api/contact", {
          method: "POST",
          body: new URLSearchParams({ ...valid, website: "spam" }),
        }),
      )
    ).status,
    400,
  )
})
test("delivery, failure, missing configuration, idempotency and distributed limits", async () => {
  const originalFetch = globalThis.fetch
  const old = { ...process.env }
  process.env.RESEND_API_KEY = "test"
  process.env.CONTACT_FROM = "studio@example.com"
  process.env.CONTACT_TO = "owner@example.com"
  process.env.UPSTASH_REDIS_REST_URL = "https://redis.example"
  process.env.UPSTASH_REDIS_REST_TOKEN = "test"
  let count = 1
  let providerStatus = 200
  let networkFailure = false
  let emailCalls = 0
  const submissionId = "d0f3692e-cbe8-4c45-8b71-2242bbad5971"
  globalThis.fetch = async (input, init) => {
    if (String(input).startsWith("https://redis.example"))
      return Response.json({ result: count })
    emailCalls++
    if (networkFailure) throw new Error("network")
    const payload = JSON.parse(String(init?.body))
    assert.equal(payload.reply_to, valid.email)
    assert.deepEqual(payload.to, ["owner@example.com"])
    if (init?.headers && "Idempotency-Key" in init.headers)
      assert.equal(init.headers["Idempotency-Key"], `contact/${submissionId}`)
    return Response.json({ id: "mock-message" }, { status: providerStatus })
  }
  try {
    assert.equal((await POST(request())).status, 200)
    assert.equal(
      (
        await POST(
          new Request("http://localhost:3000/api/contact", {
            method: "POST",
            body: new URLSearchParams({ ...valid, submissionId }),
          }),
        )
      ).status,
      200,
    )
    providerStatus = 429
    assert.equal((await POST(request())).status, 502)
    networkFailure = true
    assert.equal((await POST(request())).status, 502)
    delete process.env.RESEND_API_KEY
    assert.equal((await POST(request())).status, 503)
    count = 6
    const before = emailCalls
    const limited = await POST(request())
    assert.equal(limited.status, 429)
    assert.equal(limited.headers.get("Retry-After"), "600")
    assert.equal(emailCalls, before)
  } finally {
    globalThis.fetch = originalFetch
    process.env = old
  }
})
test("production limiter fails closed without trusted proxy and shared storage", async () => {
  const { allowContact } = await import("../lib/rate-limit")
  const old = { ...process.env }
  try {
    Object.assign(process.env, { NODE_ENV: "production" })
    delete process.env.CONTACT_IP_HEADER
    await assert.rejects(allowContact(request()), /Trusted proxy/)
    process.env.CONTACT_IP_HEADER = "x-trusted-client-ip"
    const proxied = new Request("http://localhost:3000/api/contact", {
      headers: { "x-trusted-client-ip": "192.0.2.1" },
    })
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
    await assert.rejects(allowContact(proxied), /Distributed rate limiter/)
  } finally {
    process.env = old
  }
})
