import { test, mock } from "node:test"
import assert from "node:assert/strict"
import { contactSchema } from "../lib/contact"
import { POST } from "../app/api/contact/route"
const valid = {
  name: " Alex ",
  email: "alex@example.com",
  phone: "+1 (214) 555-0123",
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
    { ...valid, phone: "" },
    { ...valid, phone: "123" },
    { ...valid, phone: "call me" },
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
  const records = new Map<string, { state: string; at: string }>()
  const submissionId = "d0f3692e-cbe8-4c45-8b71-2242bbad5971"
  globalThis.fetch = async (input, init) => {
    if (String(input).startsWith("https://redis.example")) {
      assert.equal(
        String(input),
        "https://redis.example",
        "Redis commands must post to the REST root",
      )
      const command = JSON.parse(String(init?.body))
      assert.equal(command[0], "EVAL")
      assert.equal(command[2], 1)
      if (command[3].startsWith("inquiry:")) {
        const record = records.get(command[3]) || {
          state: "idle",
          at: command[5],
        }
        const previous = record.state
        record.state =
          command[4] === "claim"
            ? previous === "idle"
              ? "pending"
              : previous
            : command[4] === "accepted"
              ? "accepted"
              : "idle"
        records.set(command[3], record)
        return Response.json({ result: [previous, record.at] })
      }
      assert.match(command[3], /^contact:[a-f0-9]{64}:\d+$/)
      return Response.json({ result: count })
    }
    emailCalls++
    if (networkFailure) throw new Error("network")
    const payload = JSON.parse(String(init?.body))
    const acknowledgment = payload.subject.startsWith("We received")
    assert.equal(
      payload.reply_to,
      acknowledgment ? "owner@example.com" : valid.email,
    )
    assert.deepEqual(payload.to, [
      acknowledgment ? valid.email : "owner@example.com",
    ])
    assert.ok(payload.html.includes("OPENBRACKET"))
    assert.ok(payload.text)
    if (init?.headers && "Idempotency-Key" in init.headers)
      assert.match(
        init.headers["Idempotency-Key"],
        /^contact\/[a-f0-9]{64}\/(notification|acknowledgment)$/,
      )
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
    assert.equal(
      emailCalls,
      2,
      "retries do not send another notification or acknowledgment",
    )
    records.clear()
    providerStatus = 429
    assert.equal((await POST(request())).status, 502)
    records.clear()
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

test("503 diagnostics correlate with the response without exposing inquiry data or secrets", async () => {
  const old = { ...process.env }
  const originalFetch = globalThis.fetch
  const records: string[] = []
  const logs = ["info", "warn", "error"].map(level =>
    mock.method(
      console,
      level as "info" | "warn" | "error",
      (message: string) => records.push(message),
    ),
  )
  try {
    process.env.UPSTASH_REDIS_REST_URL = "https://redis.example/"
    process.env.UPSTASH_REDIS_REST_TOKEN = "secret-redis-token"
    globalThis.fetch = async () =>
      Response.json(
        { error: `provider error with ${valid.email} secret-redis-token` },
        { status: 400 },
      )
    const response = await POST(request())
    assert.equal(response.status, 503)
    const body = await response.json()
    assert.equal(body.requestId, response.headers.get("X-Request-ID"))
    assert.match(body.requestId, /^[a-f0-9-]{36}$/)
    const entries = records.map(record => JSON.parse(record))
    const failure = entries.find(entry => entry.event === "rate_limit_failed")
    assert.equal(failure.code, "RATE_LIMIT_PROVIDER_REJECTED")
    assert.equal(failure.providerStatus, 400)
    assert.equal(failure.requestId, body.requestId)
    assert.equal(entries.at(-1).status, 503)
    assert.equal(typeof entries.at(-1).durationMs, "number")
    assert.ok(!records.join("").includes(valid.email))
    assert.ok(!records.join("").includes(valid.message))
    assert.ok(!records.join("").includes("secret-redis-token"))
  } finally {
    logs.forEach(log => log.mock.restore())
    globalThis.fetch = originalFetch
    process.env = old
  }
})

test("email templates escape HTML, include international phone and Chicago timestamp, and provide plain text", async () => {
  const { emailTemplates } = await import("../lib/email")
  const data = contactSchema.parse({
    ...valid,
    name: '<img src=x onerror="evil()">',
    message: 'First line\n<script>alert("bad")</script>',
    phone: "+44 (20) 7946 0958",
  })
  const templates = emailTemplates(data, Date.UTC(2026, 0, 15, 18))
  assert.ok(!templates.html.includes("<script>"))
  assert.ok(!templates.html.includes("<img src=x"))
  assert.ok(templates.html.includes("&lt;script&gt;"))
  assert.ok(templates.html.includes("<br>"))
  assert.ok(templates.html.includes('href="tel:+442079460958"'))
  assert.match(templates.text, /America\/Chicago.*Jan 15, 2026/)
  assert.match(templates.text, /12:00:00 PM CST/)
  assert.match(templates.acknowledgment, /Hi <img,/)
  assert.ok(!templates.acknowledgmentHtml.includes("<img"))
})

test("accepted inquiries remain successful after acknowledgment failure and do not send duplicate emails", async () => {
  const old = { ...process.env }
  const originalFetch = globalThis.fetch
  const { sendInquiry } = await import("../lib/email")
  const data = contactSchema.parse({
    ...valid,
    message: "Unique partial delivery scenario for this test.",
  })
  let notifications = 0,
    acknowledgments = 0
  const log = mock.method(console, "error", () => {})
  try {
    process.env.RESEND_API_KEY = "sandbox-key"
    process.env.CONTACT_FROM = "verified@example.com"
    process.env.CONTACT_TO = "studio@example.com"
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
    globalThis.fetch = async (_url, init) => {
      const payload = JSON.parse(String(init?.body))
      if (payload.subject.startsWith("We received")) {
        acknowledgments++
        return Response.json({ error: "sandbox failure" }, { status: 500 })
      }
      notifications++
      return Response.json({ id: "sandbox-notification" })
    }
    assert.equal(await sendInquiry(data), "sent")
    assert.equal(
      await sendInquiry({ ...data, submissionId: crypto.randomUUID() }),
      "sent",
    )
    assert.equal(notifications, 1)
    assert.equal(acknowledgments, 1)
    assert.equal(log.mock.callCount(), 1)
    assert.match(
      String(log.mock.calls[0].arguments[0]),
      /acknowledgment_failed/,
    )
  } finally {
    globalThis.fetch = originalFetch
    process.env = old
    log.mock.restore()
  }
})

test("simultaneous identical inquiries only send one notification and acknowledgment", async () => {
  const old = { ...process.env }
  const originalFetch = globalThis.fetch
  const { sendInquiry } = await import("../lib/email")
  const data = contactSchema.parse({
    ...valid,
    message: "Concurrent submission scenario with unique content.",
  })
  let finish: (() => void) | undefined
  let calls = 0
  try {
    Object.assign(process.env, {
      RESEND_API_KEY: "sandbox",
      CONTACT_FROM: "studio@example.com",
      CONTACT_TO: "owner@example.com",
    })
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
    globalThis.fetch = async () => {
      calls++
      if (calls === 1)
        await new Promise<void>(resolve => {
          finish = resolve
        })
      return Response.json({ id: "sandbox-email" })
    }
    const first = sendInquiry(data)
    await new Promise(resolve => setImmediate(resolve))
    await assert.rejects(sendInquiry(data), /already processing/)
    assert.equal(calls, 1)
    finish!()
    assert.equal(await first, "sent")
    assert.equal(calls, 2)
    assert.equal(await sendInquiry(data), "sent")
    assert.equal(calls, 2)
  } finally {
    finish?.()
    globalThis.fetch = originalFetch
    process.env = old
  }
})
