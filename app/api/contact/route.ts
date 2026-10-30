import { contactSchema } from '../../../lib/contact';
import { sendInquiry } from '../../../lib/email';
import { allowContact } from '../../../lib/rate-limit';
import { site } from '../../../data/site';
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
  if (!result.success) {
    const fields: Record<string, string> = {};
    for (const issue of result.error.issues) fields[String(issue.path[0])] ||= issue.message;
    return Response.json({ error: 'Please check the highlighted fields.', fields }, { status: 400 });
  }
  if (result.data.website) return Response.json({ error: 'Unable to accept this submission.' }, { status: 400 });
  try {
    if (!await allowContact(request)) return Response.json({ error: 'Too many attempts. Please wait ten minutes or email us directly.' }, { status: 429, headers: { 'Retry-After': '600' } });
  } catch { return Response.json({ error: `The form is temporarily unavailable. Please email ${site.email}.` }, { status: 503 }); }
  try {
    const delivery = await sendInquiry(result.data);
    if (delivery === 'unavailable') return Response.json({ error: `The form is not configured yet. Please email ${site.email}.` }, { status: 503 });
    if (delivery !== 'sent') return Response.json({ error: 'Email delivery failed. Please retry or email us directly.' }, { status: 502 });
    return Response.json({ ok: true });
  } catch { return Response.json({ error: 'Email delivery unavailable. Please retry or email us directly.' }, { status: 502 }); }
}
