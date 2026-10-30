# OpenBracket

Next.js App Router + strict TypeScript. The homepage is statically prerendered; only the contact form and optional hero interaction use client components. Plain CSS, simple props, no CMS or component framework.

## Run

Use Node 20.9+ (Node 22 LTS recommended).

```sh
npm ci
cp .env.example .env.local
npm run dev
```

`npm run typecheck`, `npm test`, and `npm run build` validate the application. `npm start` serves the production build.

## Hosting and email

Deploy to a host supporting Next.js App Router and Node route handlers (such as Vercel or a Node server/container). Build with `npm ci && npm run build`; start with `npm start`, binding the host's PORT. This is **not a static-export deployment**: `/api/contact` needs a server runtime and outbound HTTPS access to `api.resend.com`. Allow at least 15 seconds for the function, which has a 10-second provider timeout. Configure HTTPS and set `SITE_URL` to the exact public origin, without a trailing slash. Preview deployments need their own origin value.

Create a Resend account, verify the sending domain and its DNS records, create a sending API key, and set these **server-only** environment variables in the host's secret settings:

- `RESEND_API_KEY`: Resend sending key.
- `CONTACT_FROM`: sender on the verified domain, e.g. `OpenBracket <hello@openbracket.io>`.
- `CONTACT_TO`: destination inbox, e.g. `tam@openbracket.io`.
- `SITE_URL`: canonical deployment origin, e.g. `https://openbracket.io`.

Redeploy after changing configuration. No secret goes into browser code. Visitor email is used only as Reply-To; the sender and recipient are server controlled. Delivery uses plain text. Success means the provider accepted the email, not that it reached an inbox. Missing configuration returns 503, provider errors/timeouts return 502, and the form shows a retry/direct-email option without clearing entered data. Test delivery with a real inquiry after configuring DNS and secrets; no live email is sent by the tests.

The endpoint accepts form data, validates fields with Zod, rejects oversized bodies (20 KB), checks browser Origin, and includes a honeypot. Configure host/WAF rate limits for `/api/contact` before public launch; no unreliable per-process rate counter is used. The form submits without JavaScript too, returning a JSON result from the endpoint.

Provider reference: https://resend.com/docs/api-reference/emails/send-email
Framework reference: https://nextjs.org/docs/app

## Deliberate Gatsby migration

- `/` retains the studio name, Dallas/Fort Worth location, advertising/development background, contact details, and useful services. The obsolete under-construction copy is replaced.
- Original `src/images/ob-logo-reversed.png` is preserved byte-for-byte at `public/images/ob-logo-reversed.png`. The black, white and red brand direction is retained. Unrelated Gatsby starter artwork is removed.
- `/page-2`, `/using-typescript`, `/using-ssr`, `/using-dsg` were framework demos, not business pages. They now permanently redirect to `/`, including trailing-slash variants through Next's URL normalization. Unknown paths return a real 404.
- Gatsby's sample metadata, dependencies, GraphQL layout, demo pages, and config are removed. The canonical production origin is `https://openbracket.io`; update `app/layout.tsx` if the domain changes.

## Optional 3D

The bracket artwork renders in the initial HTML and works without JavaScript or WebGL. “Explore in 3D” dynamically imports a separate Three.js chunk only on request. WebGL failures preserve the static artwork and show a status. The scene respects reduced motion, resizes with its container, and disposes its GPU resources when turned off.
