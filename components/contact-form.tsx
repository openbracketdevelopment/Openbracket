'use client';
import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { contactSchema, projectTypes, budgetRanges } from '../lib/contact';
import type { ContactFields } from '../lib/contact';
import { site } from '../data/site';
export default function ContactForm() {
 const [status, setStatus] = useState('');
 const [success, setSuccess] = useState(false);
 const [pending, setPending] = useState(false);
 const [errors, setErrors] = useState<ContactFields>({});
 const busy = useRef(false);
 const submissionId = useRef('');
 const feedback = useRef<HTMLParagraphElement>(null);
 function invalid(form: HTMLFormElement, fields: ContactFields) {
  setErrors(fields); setStatus('Please check the highlighted fields.');
  const first = Object.keys(fields)[0];
  const element = form.elements.namedItem(first);
  if (element instanceof HTMLElement) element.focus();
 }
 async function submit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault(); if (busy.current) return;
  const form = event.currentTarget;
  const data = new FormData(form);
  const parsed = contactSchema.safeParse(Object.fromEntries(data));
  if (!parsed.success) { const fields: ContactFields = {}; for (const issue of parsed.error.issues) { const key = issue.path[0] as keyof ContactFields; fields[key] ||= issue.message; } invalid(form, fields); return; }
  busy.current = true; setPending(true); setErrors({}); setStatus(''); setSuccess(false);
  submissionId.current ||= crypto.randomUUID(); data.set('submissionId', submissionId.current);
  try {
   const response = await fetch('/api/contact', { method: 'POST', body: data });
   const result: { ok?: boolean; error?: string; fields?: ContactFields } = await response.json();
   if (!response.ok || result.ok !== true) {
    if (result.fields) invalid(form, result.fields);
    else setStatus(result.error || 'We couldn’t send your message. Please try again or email us directly.');
   } else { setSuccess(true); setStatus('Thanks! Your message has been accepted by our email provider. We look forward to hearing more.'); form.reset(); submissionId.current = ''; }
  } catch { setStatus('We couldn’t connect. Your details are still here. Please try again or email us directly.'); }
  finally { busy.current = false; setPending(false); }
 }
 function field(name: keyof ContactFields) { return { id: name, name, 'aria-invalid': Boolean(errors[name]), 'aria-describedby': errors[name] ? `${name}-error` : undefined }; }
 function error(name: keyof ContactFields) { return errors[name] ? <span className="field-error" id={`${name}-error`}>{errors[name]}</span> : null; }
 return <form className="contact-form" action="/api/contact" method="post" onSubmit={submit} noValidate aria-busy={pending} onChange={() => { submissionId.current = ''; }}><div className="window-bar"><span>NEW_MESSAGE / OPENBRACKET</span><span>↗</span></div><div className="form-content"><p className="form-instructions">Fields marked * are required. A rough outline is a good place to start.</p><div className="form-row"><label htmlFor="name">Name *<input {...field('name')} autoComplete="name" required maxLength={100} />{error('name')}</label><label htmlFor="email">Email *<input {...field('email')} type="email" autoComplete="email" required maxLength={254} />{error('email')}</label></div><label htmlFor="company">Company <span>(optional)</span><input {...field('company')} autoComplete="organization" maxLength={150} />{error('company')}</label><label htmlFor="projectType">Project type *<select {...field('projectType')} required defaultValue=""><option value="" disabled>Select one</option>{projectTypes.map(type => <option key={type}>{type}</option>)}</select>{error('projectType')}</label><label htmlFor="message">Tell us about your project *<span className="field-hint" id="message-hint">What do you need, and who is it for? 10–5,000 characters.</span><textarea {...field('message')} aria-describedby={errors.message ? 'message-hint message-error' : 'message-hint'} required minLength={10} maxLength={5000} rows={5} />{error('message')}</label><div className="form-row"><label htmlFor="budget">Budget range <span>(optional)</span><select {...field('budget')} defaultValue=""><option value="">Prefer to discuss</option>{budgetRanges.map(range => <option key={range}>{range}</option>)}</select>{error('budget')}</label><label htmlFor="timing">Desired timing <span>(optional)</span><input {...field('timing')} maxLength={200} placeholder="e.g. Exploring options" />{error('timing')}</label></div><div className="honeypot" aria-hidden="true"><label>Leave this empty<input name="website" tabIndex={-1} autoComplete="off" /></label></div><p className="privacy-note">We use these details to respond to your inquiry. Messages are sent through Resend. <a href="/privacy">Privacy information ↗</a></p><button className="button" disabled={pending}>{pending ? 'Sending your message…' : 'Send your message'} <span>↗</span></button><p ref={feedback} role="status" aria-live="polite" className={`form-status ${success ? 'is-success' : ''}`}>{status}</p><noscript><p>The form submits to our server and displays a plain response. You can also <a href={`mailto:${site.email}`}>email us directly</a>.</p></noscript></div></form>;
}
