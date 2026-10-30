# OpenBracket

A responsive, retro computing inspired studio website built with Next.js App Router, React 19, strict TypeScript, and plain CSS. Core content is static HTML. Client code is limited to navigation, the form, and decorative hero interaction. No CMS, analytics, paid assets, or public deployment is included.

## Development

Use Node 20.9+ (Node 22 LTS recommended).

```sh
npm ci
cp .env.example .env.local
npm run dev
```

- `npm run build`: production build and framework type checks.
- `npm run typecheck`: standalone TypeScript check.
- `npm test`: validation, API, email adapter, and rate-limit tests with mocked outbound requests. No email is sent.
- `npm start`: production server after building.

## Content and assets

Edit `data/site.ts` for centralized contact information, services, process steps, navigation, and approved client logos. Page-specific copy lives in `app/{route}/page.tsx`. Tokens, layout, and decorative animation are in `app/globals.css`.

The original logo is preserved byte-for-byte at `public/images/ob-logo-reversed.png`. No approved client logo assets were provided. The homepage client section is therefore hidden. Add approved files to `public/images/clients/` and entries to `clients` in `data/site.ts`:

```ts
{ name: 'Approved client name', asset: '/images/clients/approved-logo.svg', alt: 'Approved client name', url: 'https://approved-client.example' }
```

URL is optional. Obtain approval to publish each client name and logo. The Work page contains verified professional portfolio entries from Tam Pham’s existing site, with original screenshots, marks, and collaboration credits; these are distinct from the homepage’s direct-client logo list. No fabricated examples or testimonials are included.

Routes: `/`, `/services`, `/about`, `/work`, `/contact`, `/privacy`, `/sitemap`; generated `/sitemap.xml`, `/robots.txt`, and social image `/opengraph-image`; unknown paths return 404. Page metadata and canonical URLs are defined per route. Set the production origin in `data/site.ts` if it changes.

## Gatsby migration

The original repository used Gatsby. The preceding rebuild migrated it to Next.js at the owner's request; this redesign retains Next.js conventions and the original brand asset, location, business positioning, service content, and contact details. Obsolete under-construction text and Gatsby sample metadata are removed. Former demo routes `/page-2`, `/using-typescript`, `/using-ssr`, and `/using-dsg` permanently redirect to `/` in `next.config.ts`. Other paths get a useful 404. Do not add new redirects without checking their content purpose.

## Hosting and form configuration

Use a host supporting Next.js Node route handlers (Vercel or a Node server/container). Build: `npm ci && npm run build`; start: `npm start`. Supply the host's `PORT` as needed. Static export hosting cannot serve this contact endpoint. Allow outbound HTTPS to Resend and Upstash and a function duration of at least 20 seconds (3-second rate limiter plus 10-second email timeout).

Set server-only environment variables in your host's secret settings:

| Variable | Configuration |
| --- | --- |
| `SITE_URL` | Exact public origin, no trailing slash, e.g. `https://openbracket.io`; use the exact origin for previews too. |
| `RESEND_API_KEY` | Sending API key from Resend. |
| `CONTACT_FROM` | Sender on a domain verified in Resend, e.g. `OpenBracket <hello@openbracket.io>`. Configure the provider's required DNS records first. |
| `CONTACT_TO` | Studio recipient, normally `tam@openbracket.io`. |
| `UPSTASH_REDIS_REST_URL` | HTTPS REST URL for your Upstash Redis instance. |
| `UPSTASH_REDIS_REST_TOKEN` | Server-only Redis REST credential. |
| `CONTACT_IP_HEADER` | The client IP header **overwritten by your trusted hosting proxy**. For Vercel, check its `x-vercel-forwarded-for` contract. For another host, configure a trusted reverse proxy to strip incoming copies and set its own header. Prevent direct access around that proxy. Do not blindly trust visitor-supplied forwarded headers. |

The production form fails closed with 503 if trusted IP or distributed rate limiting is unavailable. Local development uses a process-local limiter if Redis is absent. Production uses an atomic Redis INCR/EXPIRE script: five valid attempts per IP-derived identifier per ten-minute window. Keys contain a SHA-256 IP hash and expire after ten minutes; messages are never stored in Redis. A host/WAF limit on `/api/contact` can additionally bound malformed requests and provider abuse.

`lib/email.ts` isolates the Resend integration. The visitor's email is Reply-To, never the sender. Plain text is used and submitted content is not logged. The server returns success only after a successful provider response containing a message ID; this means acceptance, not inbox delivery. Provider failures return 502, absent configuration returns 503. The honeypot is rejected without claiming successful delivery. Bodies are capped at 20 KB; required fields, enums, and lengths are checked by shared Zod validation. Client errors are linked to visible labels, values survive failed submission, and a synchronous lock prevents duplicate clicks. A per-submission ID is passed to Resend for idempotency on retries. Editing a message creates a new attempt. The no-JavaScript form posts to the same endpoint and displays a plain JSON response; the email and phone alternatives work independently.

Provider documentation: https://resend.com/docs/api-reference/emails/send-email
Redis REST documentation: https://upstash.com/docs/redis/features/restapi

## Motion and accessibility

The original CRT illustration is CSS/HTML; its decorative display is hidden from assistive technology. It needs no WebGL, external assets, Three.js, GSAP, or heavy lazy-loaded bundle. The complete static composition and an initial greeting exist before hydration. The green phosphor terminal types the phrases in `lib/typewriter.ts` in sequence: 85 ms per character, a 3-second hold, 40 ms per deleted character, and a 550 ms gap. Timing values live beside the editable phrases. The cursor is solid while editing and blinks only during pauses. A fixed-height area prevents layout shifts, and assistive technology receives a static equivalent instead of repeated announcements. Typing and cursor animation pause offscreen, when the tab is hidden, and when manually paused. Reduced motion shows a complete static greeting instead. The monitor uses a warm molded casing, recessed curved screen, vents, adjustment dials, and a power indicator. Pointer tilt is mouse-only and disabled with reduced motion. Screen texture stays inside the decorative monitor.

The header has normal links and a mobile native modal dialog with focus containment, initial close-button focus, Escape handling, close control, focus restoration, and expanded state. Navigation remains readable in server HTML; without JavaScript, an additional normal-link navigation row is rendered. FAQ disclosure uses native details/summary. Visible focus, skip link, semantic headings, persistent form labels, field errors, and status feedback are implemented. Brand red `#DE3736` is retained in decorative accents. Text-bearing red surfaces use `#C52D2D` with white text (5.54:1 contrast); lighter red accents serve small text on dark surfaces, and darker red is used on off-white. No WCAG certification is claimed.

## Owner decisions before launch

1. Configure and verify Resend sender DNS, recipient, Upstash, trusted proxy IP, and production origin. Authorize a real delivery test before sending any external email.
2. Confirm the privacy copy, inquiry retention/deletion practices, hosting provider's logging/retention, and email provider arrangements. The policy deliberately does not invent a retention period or legal guarantees. Update it when adding analytics or other processors.
3. Supply only approved client logos if that section is desired.
4. Complete browser/screenshot QA on mobile, tablet, and desktop, including keyboard menu operation, reduced motion, form feedback, and overflow. Browser automation was unavailable and native Chrome actions were repeatedly rejected because its UI state changed; automated HTTP/build/unit checks do not replace visual review.

No public deployment or external test email is authorized by this task.

## Light and dark themes

The header switch works at desktop and mobile widths. `lib/theme.ts` supplies the inline pre-paint initialization script: use an explicit `openbracket-theme` localStorage value when present, otherwise follow the system preference. `components/theme-toggle.tsx` handles selection, system changes, blocked storage, and cross-tab synchronization. With no explicit choice, changes to the OS theme are followed; after a selection, that choice takes priority. Clear the stored key to return to system mode. If storage is blocked, the selected theme lasts for the current page.

CSS tokens apply the chosen palette to all pages, menus, forms, and footer; both existing SVG wordmark variants are used. The CRT is CSS geometry rather than an external image or 3D asset. Its materials change to charcoal for the light theme while its green terminal remains dark. No separate monitor asset or inversion filter is required. Theme changes do not remount the terminal or restart its timer. Transitions are brief and disabled for reduced motion. Without JavaScript, CSS follows the system theme and the terminal displays a static greeting. If adding a strict CSP, authorize the bootstrap script with a nonce or hash; blocking it prevents saved-theme initialization before paint.

DOM tests cover the complete animation sequence and timing, cursor states, pause/resume, hidden-tab suspension, reduced motion, cleanup under React Strict Mode, theme changes without restarting timers, system preference changes, explicit selection persistence, blocked storage at startup, and cross-tab changes. Real-browser mobile screenshots and keyboard navigation remain unverified because the browser access host is unavailable.

## Work page and revised monitor

`data/work.ts` contains five verified projects, their roles, source links, technologies, screenshots, and brand marks. All five original case studies were read before writing descriptions. `public/work/SOURCES.md` records provenance and attribution. Fidium is credited to Tam’s Amdocs work; Toro and EarthX retain their stated agency context. The source pages do not identify those agencies, so names are not inferred. ESPS and Cintra are presented as professional portfolio entries without claiming OpenBracket ownership. The logos appear under “Brands I’ve worked with,” with their original artwork and padded surfaces rather than filters or recoloring. Confirm any additional attribution with the owner before expanding these entries.

The shared navigation replaces Contact with Work. The header’s “Let’s talk” CTA, footer Contact link, directory, and contact form remain. The compact theme switch follows the CTA in DOM and visual order; its sun/moon positions reflect the active theme. Existing persistence and system-following behavior are unchanged.

The attached CRT reference informs the squared front casing, stepped deep right housing, side vents, recessed bezel, curved glass, green indicator, square power control, and low wedge base. CSS 3D planes provide visible housing depth without a second rendering library, animation loop, or new model dependency. The screen stays HTML and retains its existing typewriter state across theme changes. Light mode uses dark casing materials; dark mode uses warm casing materials. No external CRT asset is needed. The monitor renders statically without JavaScript; reduced motion freezes pointer tilt and shows a static greeting. Browser screenshots remain unverified because the browser access host is unavailable.
