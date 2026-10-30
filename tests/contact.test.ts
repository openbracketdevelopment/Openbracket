import { test } from 'node:test';
import assert from 'node:assert/strict';
import { contactSchema } from '../lib/contact';
import { POST } from '../app/api/contact/route';
const valid = { name: ' Alex ', email: 'alex@example.com', message: 'A new website for our business.' };
test('validates and normalizes contact fields', () => { const parsed = contactSchema.parse(valid); assert.equal(parsed.name, 'Alex'); assert.equal(parsed.company, ''); });
test('rejects invalid, missing, oversized and non-string values', () => {
  for (const value of [{ ...valid, email: 'bad' }, { ...valid, message: 'short' }, { ...valid, name: '' }, { ...valid, message: 'a'.repeat(5001) }, { ...valid, email: 42 }]) assert.equal(contactSchema.safeParse(value).success, false);
});
function request(values = valid, origin = 'http://localhost:3000') { return new Request('http://localhost:3000/api/contact', { method: 'POST', headers: { origin }, body: new URLSearchParams(values) }); }
test('endpoint rejects foreign origins and malformed input', async () => {
  assert.equal((await POST(request(valid, 'https://foreign.example'))).status, 403);
  assert.equal((await POST(request({ ...valid, email: 'invalid' }))).status, 400);
  assert.equal((await POST(request({ ...valid, message: 'x'.repeat(21000) }))).status, 413);
});
test('honeypot does not send email', async () => {
  const body = new URLSearchParams({ ...valid, website: 'spam' });
  assert.equal((await POST(new Request('http://localhost:3000/api/contact', { method: 'POST', body }))).status, 200);
});
test('provider success, rejection and network failure', async () => {
  const originalFetch = globalThis.fetch;
  const old = { ...process.env };
  process.env.RESEND_API_KEY = 'test'; process.env.CONTACT_FROM = 'studio@example.com'; process.env.CONTACT_TO = 'owner@example.com';
  try {
    globalThis.fetch = async (_input, init) => { const payload = JSON.parse(String(init?.body)); assert.equal(payload.reply_to, valid.email); assert.deepEqual(payload.to, ['owner@example.com']); return new Response('{}'); };
    assert.equal((await POST(request())).status, 200);
    globalThis.fetch = async () => new Response('{}', { status: 429 });
    assert.equal((await POST(request())).status, 502);
    globalThis.fetch = async () => { throw new Error('network'); };
    assert.equal((await POST(request())).status, 502);
    delete process.env.RESEND_API_KEY;
    assert.equal((await POST(request())).status, 503);
  } finally { globalThis.fetch = originalFetch; process.env = old; }
});
