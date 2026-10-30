'use client';
import { useState } from 'react';
import type { FormEvent } from 'react';
export default function ContactForm() {
  const [status, setStatus] = useState('');
  const [pending, setPending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setPending(true); setStatus('');
    try {
      const response = await fetch('/api/contact', { method: 'POST', body: new FormData(form) });
      if (!response.ok) throw new Error('send');
      setStatus('Thanks! Your message is on its way.'); form.reset();
    } catch { setStatus('We couldn’t send your message. Please try again or email tam@openbracket.io.'); }
    finally { setPending(false); }
  }
  return <form action="/api/contact" method="post" onSubmit={submit}><div className="form-row"><label>Your name<input name="name" autoComplete="name" required maxLength={100} placeholder="Alex Taylor" /></label><label>Email address<input name="email" type="email" autoComplete="email" required maxLength={254} placeholder="alex@company.com" /></label></div><label>Company <span>(optional)</span><input name="company" autoComplete="organization" maxLength={150} placeholder="Your business" /></label><label>What are you thinking?<textarea name="message" required minLength={10} maxLength={5000} rows={4} placeholder="A new website, a fresh direction, a tricky challenge…" /></label><div className="honeypot" aria-hidden="true"><label>Leave this empty<input name="website" tabIndex={-1} autoComplete="off" /></label></div><button className="button" disabled={pending}>{pending ? 'Sending…' : 'Send your message'} <span>↗</span></button><p role="status" aria-live="polite" className="form-status">{status}</p></form>;
}
