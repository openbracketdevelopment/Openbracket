# OpenBracket

A responsive, retro computing inspired studio website built with Next.js App Router, React 19, strict TypeScript, and plain CSS. Core content is static HTML. Client code is limited to navigation, the form, and decorative hero interaction. No CMS, analytics, paid assets, or public deployment is included.

## Development

Use Node 22.13+ LTS (recommended), Node 20.19+, or Node 24+. The minimum is required by the development lint tooling.

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

| Variable                   | Configuration                                                                                                                                                                                                                                                                                                                       |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SITE_URL`                 | Exact public origin, no trailing slash, e.g. `https://openbracket.io`; use the exact origin for previews too.                                                                                                                                                                                                                       |
| `RESEND_API_KEY`           | Sending API key from Resend.                                                                                                                                                                                                                                                                                                        |
| `CONTACT_FROM`             | Sender on a domain verified in Resend, e.g. `OpenBracket <hello@openbracket.io>`. Configure the provider's required DNS records first.                                                                                                                                                                                              |
| `CONTACT_TO`               | Studio recipient, normally `tam@openbracket.io`.                                                                                                                                                                                                                                                                                    |
| `UPSTASH_REDIS_REST_URL`   | HTTPS REST URL for your Upstash Redis instance.                                                                                                                                                                                                                                                                                     |
| `UPSTASH_REDIS_REST_TOKEN` | Server-only Redis REST credential.                                                                                                                                                                                                                                                                                                  |
| `CONTACT_IP_HEADER`        | The client IP header **overwritten by your trusted hosting proxy**. For Vercel, check its `x-vercel-forwarded-for` contract. For another host, configure a trusted reverse proxy to strip incoming copies and set its own header. Prevent direct access around that proxy. Do not blindly trust visitor-supplied forwarded headers. |

The production form fails closed with 503 if trusted IP or distributed rate limiting is unavailable. Local development uses a process-local limiter if Redis is absent. Production uses an atomic Redis INCR/EXPIRE script: five valid attempts per IP-derived identifier per ten-minute window. Keys contain a SHA-256 IP hash and expire after ten minutes; messages are never stored in Redis. A host/WAF limit on `/api/contact` can additionally bound malformed requests and provider abuse.

`lib/email.ts` isolates the Resend integration. The visitor's email is Reply-To, never the sender. Plain text is used and submitted content is not logged. The server returns success only after a successful provider response containing a message ID; this means acceptance, not inbox delivery. Provider failures return 502, absent configuration returns 503. The honeypot is rejected without claiming successful delivery. Bodies are capped at 20 KB; required fields, enums, and lengths are checked by shared Zod validation. Client errors are linked to visible labels, values survive failed submission, and a synchronous lock prevents duplicate clicks. A per-submission ID is passed to Resend for idempotency on retries. Editing a message creates a new attempt. The no-JavaScript form posts to the same endpoint and displays a plain JSON response; the email and phone alternatives work independently.

Provider documentation: https://resend.com/docs/api-reference/emails/send-email
Redis REST documentation: https://upstash.com/docs/redis/features/restapi

## Motion and accessibility

The CRT is a lazy-loaded Three.js product model with a server-rendered SVG fallback. Its decorative display is hidden from assistive technology; an accessible static equivalent is provided. The terminal is a 1024 × 768 canvas texture mapped onto a convex 4:3 surface, with restrained phosphor glow, scanlines, edge shading, and a soft reflection. The green terminal uses the phrases and timing in `lib/typewriter.ts`: 85 ms per character, a 3-second hold, 40 ms per deleted character, and a 550 ms gap. The cursor is solid while editing and blinks only during pauses. Typing and cursor animation pause offscreen, in hidden tabs, and when manually paused. Reduced motion shows a complete static greeting and disables pointer movement by default. Its “Play terminal” button explicitly enables the typing/backspacing sequence for the current page without enabling pointer movement.

The header has normal links and a mobile native modal dialog with focus containment, initial close-button focus, Escape handling, close control, focus restoration, and expanded state. Navigation remains readable in server HTML; without JavaScript, an additional normal-link navigation row is rendered. FAQ disclosure uses native details/summary. Visible focus, skip link, semantic headings, persistent form labels, field errors, and status feedback are implemented. Brand red `#DE3736` is retained in decorative accents. Text-bearing red surfaces use `#C52D2D` with white text (5.54:1 contrast); lighter red accents serve small text on dark surfaces, and darker red is used on off-white. No WCAG certification is claimed.

## Owner decisions before launch

1. Configure and verify Resend sender DNS, recipient, Upstash, trusted proxy IP, and production origin. Authorize a real delivery test before sending any external email.
2. Confirm the privacy copy, inquiry retention/deletion practices, hosting provider's logging/retention, and email provider arrangements. The policy deliberately does not invent a retention period or legal guarantees. Update it when adding analytics or other processors.
3. Supply only approved client logos if that section is desired.
4. Complete browser/screenshot QA on mobile, tablet, and desktop, including keyboard menu operation, reduced motion, form feedback, and overflow. The CRT has been reviewed in native Chrome at desktop and 375px mobile widths in both themes, including its reduced-motion state. Broader cross-browser and full-site accessibility QA remain launch checks.

No public deployment or external test email is authorized by this task.

## Light and dark themes

The header switch works at desktop and mobile widths. At 515px and below, the theme switch and “Let’s talk” CTA live inside the mobile menu, leaving the horizontal logo and Menu trigger in one compact header row. The separate studio tagline is removed. Header and menu theme controls synchronize within the same tab as well as across tabs. `lib/theme.ts` supplies the inline pre-paint initialization script: use an explicit `openbracket-theme` localStorage value when present, otherwise follow the system preference. `components/theme-toggle.tsx` handles selection, system changes, blocked storage, and cross-tab synchronization. With no explicit choice, changes to the OS theme are followed; after a selection, that choice takes priority. Clear the stored key to return to system mode. If storage is blocked, the selected theme lasts for the current page.

CSS tokens apply the chosen palette to all pages, menus, forms, and footer; both existing SVG wordmark variants are used. The CRT uses programmatic Three.js geometry and a vector fallback rather than a downloaded model. Its materials change to charcoal for the light theme while its green terminal remains dark. No separate monitor asset or inversion filter is required. Theme changes do not remount the terminal or restart its timer. Transitions are brief and disabled for reduced motion. Without JavaScript, CSS follows the system theme and the terminal displays a static greeting. If adding a strict CSP, authorize the bootstrap script with a nonce or hash; blocking it prevents saved-theme initialization before paint.

DOM tests cover the complete animation sequence and timing, cursor states, pause/resume, hidden-tab suspension, reduced motion, cleanup under React Strict Mode, theme changes without restarting timers, system preference changes, explicit selection persistence, blocked storage at startup, and cross-tab changes. The revised CRT has also been reviewed in native Chrome in both themes at desktop and mobile sizes; broader keyboard and cross-browser QA remain separate checks.

## Work page and revised monitor

`data/work.ts` contains five verified projects, their roles, source links, technologies, screenshots, and brand marks. All five original case studies were read before writing descriptions. `public/work/SOURCES.md` records provenance and attribution. Fidium is credited to Tam’s Amdocs work; Toro and EarthX retain their stated agency context. The source pages do not identify those agencies, so names are not inferred. ESPS and Cintra are presented as professional portfolio entries without claiming OpenBracket ownership. The logos appear under “Brands I’ve worked with,” with their original artwork and padded surfaces rather than filters or recoloring. Confirm any additional attribution with the owner before expanding these entries.

The shared navigation replaces Contact with Work. The header’s “Let’s talk” CTA, footer Contact link, directory, and contact form remain. The compact theme switch precedes the CTA in DOM and visual order; its sun/moon positions reflect the active theme. Existing persistence and system-following behavior are unchanged.

The reference-based monitor lives in `lib/crt-model.ts`, `components/crt/monitor-scene.tsx`, and `components/crt/monitor-fallback.tsx`. It has a broad beveled frame, deep stepped/tapered enclosure, casing seam, horizontal right-side vents, a real sloping recessed bezel, outward-curving glass, green indicator, square power control, and a central tilt/swivel neck and gently domed oval pedestal. A long-lens three-quarter camera keeps perspective restrained. Warm casing is used against the dark page and charcoal casing against the light page. The OpenBracket logo is textured onto the lower front panel. Terminal content follows the curved glass UVs rather than a flat HTML overlay.

Geometry and materials are created once per mount. Theme changes update material colors without replacing the model or resetting the parent typewriter. The renderer uses capped pixel ratios (1.5 desktop, 1.25 mobile), a small procedural grain texture, a 1024px cached self-shadow map, and a small feathered contact patch. The large ground receiver was removed to prevent a visibly clipped cast shadow. Frames are requested only for text/cursor changes, resize, theme changes, and subtle pointer movement; there is no continuous render loop. Cursor intervals and renders stop offscreen or when the tab is hidden. Geometry, materials, textures, observers, listeners, timers, render targets, and the WebGL renderer are disposed on unmount.

The SVG fallback stays visible until the first successful WebGL frame. It handles no JavaScript, missing WebGL, initialization failure, and context loss. After context loss, the fallback remains until reload. No paid asset or external 3D model is required. The result is an original reference-inspired model, not an exact reconstruction: the studio lighting, plastic finish, and subtle glass reflections are simplified for web performance. Native Chrome desktop/mobile reviews covered both casing variants and reduced motion. Geometry tests check 4:3 proportions, two-axis convexity, non-degenerate triangles, continuous forward-facing normals and UVs, recess depth, enclosure depth, pedestal proportions and support connections, finite vertices, and a bounded vertex count.

## Linting and formatting

ESLint uses the Next.js Core Web Vitals and TypeScript configurations in `eslint.config.mjs`. `eslint-config-prettier` disables stylistic rules that conflict with Prettier. Existing formatting preferences are retained in `.prettierrc` (no semicolons and omitted parentheses for a single arrow-function parameter).

```sh
npm run lint         # Check all source code; warnings fail the check
npm run lint:fix     # Apply available ESLint fixes
npm run format       # Format all supported repository files
npm run format:check # Verify formatting without changes
```

Formatting includes TypeScript, JavaScript, CSS, HTML, JSON configuration, and Markdown. Build output, dependency folders, framework-generated declarations, the npm-generated lockfile, original portfolio artwork, and generated brand SVGs are excluded. Edit `scripts/generate-brand.mjs` to change generated artwork. Editors with the ESLint and Prettier extensions will discover the repository configurations automatically.

### Glass perimeter and pedestal refinement

The former corner-clamping approach collapsed 60 glass triangles, compromising the corner topology and its normal interpolation. The mesh now uses concentric rounded-rectangle rings with zero degenerate triangles, consistent XY-derived UVs, and smooth forward-facing normals. The glass projects outward in both axes and seats into a rounded, multi-section bezel lip; the old backing rectangle was removed. The white edge strip is absent in the reviewed renders in both themes. This was corrected through geometry, normals, and seating rather than a black perimeter overlay or stronger vignette. Reflections now use a feathered area highlight instead of a hard-edged rectangular patch.

The housing is raised above a central swivel neck and a domed oval base approximately 62% of its width. The mount follows the underside slope, with space visible on both sides of the neck. A small contact patch stays beneath the base. Fine roughness variation, faint lower-panel scuffs, and matte seams/vents provide restrained wear without obscuring the terminal. Original camera orientation, theme-dependent casing colors, OpenBracket branding, and terminal timing remain. Native Chrome reviews covered desktop and 375px mobile in both themes; the animated terminal was also exercised on the curved screen.

### CRT power and local clock

The physical lower-right button is backed by a native 44px HTML button whose position follows the projected 3D button face. Pointer, touch, Enter and Space activate it; canceled presses and blur release it without toggling. Its recessed face travels locally over 100ms and returns over 190ms. Hover/focus adds a restrained highlight and a power tooltip. Busy transitions ignore further activations.

`lib/crt-power.ts` owns the explicit ON → POWERING_OFF → OFF → POWERING_ON → BOOTING → ON sequence, editable timings, boot messages, and screen effects. Shutdown takes 540ms, warm-up 850ms, and the sequential simulated boot approximately four seconds, ending with `run good-things.exe` and an initialization confirmation. Only the display texture and emission animate; reflections, enclosure, pedestal and camera stay intact. The indicator is red when off and green during startup/on. No boot command executes and no network request is made by the boot sequence. Reduced motion uses 160ms fades and immediate button travel; it preserves the full sequential command readout without motion so boot is never skipped. Screen-reader status changes describe power state rather than announcing every boot line, clock tick or typed character.

`components/crt/use-monitor.ts` freezes the terminal's phrase, character, phase and remaining timer delay during a power cycle. The manual pause state survives startup. Theme changes do not reset typing or recreate the scene. Screen transitions and button travel request frames only while moving; typing, cursor and clock updates invalidate the existing renderer. Offscreen/hidden rendering stops, and all timers/listeners are cleaned up on unmount. The SVG fallback also supports power states and boot content.

`lib/texas-clock.ts` formats the visitor's device clock with `Intl.DateTimeFormat` using **America/Chicago**, including CST/CDT automatically. Its configurable sun/moon thresholds are 06:00 and 18:00 Texas time, independent of the website theme. It updates at minute boundaries and immediately on tab visibility return. A neutral server-rendered placeholder avoids hydration mismatches. The clock continues independently of terminal pause/power, so the current time appears after boot. No geolocation, time API or additional provider configuration is needed; accuracy depends on the device clock.

### Recorded audio and shared hero time

Sound and normal-motion terminal playback reset to **on** on every fresh page load, with best-effort audio autoplay. Old saved mute/pause values do not override startup; muting and pausing apply only to the current page session. Browser restrictions can keep playback muted until the sound button is activated. The button labels describe the next action: **Sound off** mutes active audio; **Sound on** enables it. `aria-pressed` reflects the actual playback state. A pending autoplay attempt never locks the button, and old attempts cannot override a newer user choice. No startup/power cue plays merely because the page loads.

`lib/crt-audio.ts` now uses processed versions of the three user-supplied recordings for typing and power cues, replacing the synthesized interaction effects. Three short keystroke variations and separate on/off WAVs total about 50 KB. They load/decode once, reuse buffers, retry failed assets on later enable, and abort on disposal. The supplied `background-noise.mp3` replaces synthesized ambience with a separate quiet 30-second crossfaded loop (about 241 KB). Typing follows visible non-whitespace character additions; deletion, pauses and whole boot lines stay silent. Accepted power actions cue once. All sounds mute together, stop while hidden and clean up on unmount. See [audio processing notes](assets/audio/README.md) for source preservation, exact edits, reproduction and the outstanding listening limitation.

The in-screen and external location clocks use the same `useSyncExternalStore` source in `lib/texas-clock.ts`, with one minute-boundary timer across all subscribers and one visibility listener. The external time stays visible while the monitor is off. Initial normal-motion playback remains automatic and session pause is never stored; reduced-motion visitors see the full static phrase and can explicitly choose Play.

`shutdownMotion` in `lib/crt-power.ts` separately controls the 180ms image collapse, 50ms line hold, 160ms contraction and 150ms phosphor afterglow, plus independent decay exponents. The screen render texture freezes its last pixels during shutdown. Only content/emission changes; reflected glass and physical geometry remain stationary. Reduced motion retains a 160ms fade and the complete boot readout.
