import { contactSchema } from '../../../lib/contact';
export const runtime = 'nodejs';
export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  const allowedOrigin = process.env.SITE_URL || new URL(request.url).origin;
  if (origin && origin !== allowedOrigin) return Response.json({ error: 'Invalid origin.' }, { status: 403 });
  const type = request.headers.get('content-type') || '';
  if (!type.startsWith('multipart/form-data') && !type.startsWith('application/x-www-form-urlencoded')) {
    return Response.json({ error: 'Use form data.' }, { status: 415 });
  }
  // Bound the streamed body, including requests without Content-Length.
  const reader = request.body?.getReader();
  if (!reader) return Response.json({ error: 'Missing body.' }, { status: 400 });
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 20000) { await reader.cancel(); return Response.json({ error: 'Request too large.' }, { status: 413 }); }
    chunks.push(value);
  }
  let form: FormData;
  try { form = await new Response(new Blob(chunks as BlobPart[]), { headers: { 'content-type': type } }).formData(); }
  catch { return Response.json({ error: 'Invalid form data.' }, { status: 400 }); }
  const result = contactSchema.safeParse(Object.fromEntries(form));
  if (!result.success) return Response.json({ error: 'Check your name, email and message (10–5000 characters).' }, { status: 400 });
  if (result.data.website) return Response.json({ ok: true });
  const { RESEND_API_KEY, CONTACT_FROM, CONTACT_TO } = process.env;
  if (!RESEND_API_KEY || !CONTACT_FROM || !CONTACT_TO) {
    return Response.json({ error: 'Email is not configured. Please email tam@openbracket.io.' }, { status: 503 });
  }
  const { name, email, company, message } = result.data;
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: CONTACT_FROM, to: [CONTACT_TO], reply_to: email, subject: 'New OpenBracket project inquiry', text: `Name: ${name}\nEmail: ${email}\nCompany: ${company || 'Not provided'}\n\n${message}` }),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return Response.json({ error: 'Email delivery failed. Please try again.' }, { status: 502 });
    return Response.json({ ok: true });
  } catch { return Response.json({ error: 'Email delivery unavailable. Please try again.' }, { status: 502 }); }
}
