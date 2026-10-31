# OpenBracket

OpenBracket’s studio website, built with Next.js App Router, TypeScript, and CSS. It includes light and dark themes, an optional interactive CRT display, and a server-side contact form.

## Run locally

Use Node.js **22 LTS** (`.nvmrc`; minimum 22.13) and npm.

```sh
nvm install
nvm use
npm ci
cp .env.example .env.local
npm run dev
```

Open [localhost:3000](http://localhost:3000). For a production build, run `npm run build`, then `npm start`.

## Contact form configuration

Set these server-side variables locally and in Netlify’s environment settings:

| Variable                   | Purpose                                                                                   |
| -------------------------- | ----------------------------------------------------------------------------------------- |
| `SITE_URL`                 | Public origin, e.g. `https://openbracket.io`; use `http://localhost:3000` locally.        |
| `RESEND_API_KEY`           | Resend API key with permission to send emails.                                            |
| `CONTACT_FROM`             | Sender on a **verified Resend domain**, e.g. `OpenBracket <hello@openbracket.io>`.        |
| `CONTACT_TO`               | Studio inbox receiving inquiries and replies to acknowledgments.                          |
| `UPSTASH_REDIS_REST_URL`   | Upstash Redis REST endpoint; required in production.                                      |
| `UPSTASH_REDIS_REST_TOKEN` | Redis REST token; required in production.                                                 |
| `CONTACT_IP_HEADER`        | On Netlify, `x-nf-client-connection-ip`. Use only a header your hosting proxy overwrites. |

Use a Resend sandbox/test configuration outside production. No real email is sent by the automated tests. Restart the dev server after changing environment variables. Never expose credentials through `NEXT_PUBLIC_` variables.

The endpoint validates fields, rejects honeypot submissions, limits requests to five per IP-derived hash per ten-minute window, and uses Redis submission hashes to prevent duplicate emails for 24 hours. Local development alone may use memory storage. Production fails closed without shared storage and a trusted IP header. No CAPTCHA is currently necessary.

Notification and acknowledgment emails contain HTML and plain text. Acknowledgments follow accepted notifications. If acknowledgment delivery fails, the inquiry still succeeds; inspect the `acknowledgment_failed` log rather than asking the visitor to resubmit. Resend idempotency keys additionally protect uncertain notification retries for [24 hours](https://resend.com/docs/dashboard/emails/idempotency-keys). There is no automatic acknowledgment retry queue.

Server logs include request IDs, safe error codes, provider status, and duration. They exclude form contents, raw IP addresses, credentials, and provider response bodies. Match the form’s error reference to `X-Request-ID` and the server log.

## Netlify

This app needs Netlify’s Next.js adapter and Node serverless functions; a static-only host cannot run the contact endpoint. The existing `netlify.toml` uses `.next` and `@netlify/plugin-nextjs`.

1. Set the environment variables above for the appropriate deploy contexts. Netlify supplies `CONTEXT` and `DEPLOY_PRIME_URL`; previews accept their configured preview origin.
2. In **Project configuration → Developer settings → Continuous deployment → Dependency management**, select Node **22**. Remove old `NODE_VERSION=18` and conflicting `AWS_LAMBDA_JS_RUNTIME` overrides from shared/context environment settings; if an explicit function runtime is required, use `nodejs22.x`.
3. Ensure the project’s base directory contains `.nvmrc`. Netlify gives that file precedence over its UI Node selection. CI release builds use the same file; the publish-only workflow uses Node 22.
4. The dashboard currently still labels the framework **Gatsby** and the publish directory **public** (base directory `/`). Update those legacy UI defaults to **Next.js** and **.next**, and ensure any old Gatsby integration is removed. Repository `netlify.toml` takes precedence for this build; its legacy-plugin skip remains as a migration safeguard.
5. Redeploy and confirm the build log uses Node 22 and the Agent Runner warning disappears. A read-only dashboard check confirmed Node **18.x** and the warning are still present. The new configuration has not been deployed. Builds being stopped is a separate dashboard setting.

See Netlify’s [dependency configuration](https://docs.netlify.com/build/configure-builds/manage-dependencies/) for version precedence. No deployment is performed by local build or test commands.

## Rendering and caching

Marketing pages, sitemap, robots, and page-specific 1200 × 630 sharing images are generated at build time. Content changes through repository releases, so timed ISR adds no benefit. Preview contexts emit `noindex` metadata and disallow crawling; production pages remain indexable with canonical production URLs.

Contact responses and provider/storage requests are uncached. Form data never enters a page cache. Themes, the live clock, typing, and controls run in isolated client components. Three.js loads only when the hero approaches view. The fixed-size static monitor remains available if WebGL or loading fails; the 3D display reveals only after sizing, branding readiness, and its first frame.

Audio attempts permitted autoplay, then unlocks on a qualifying interaction if needed. Saved mute is respected; missed keystrokes are never replayed. Browser autoplay policy can still require the **Enable sound** control. The original supplied recordings remain in `assets/audio/originals`.

## Checks

```sh
npm run lint
npm run typecheck
npm test
npm run format:check
npm run build
```

Use `npm run format` to format the repository. Tests mock email delivery and cover validation, spam checks, duplicate handling, email templates, themes, audio, power transitions, and typing behavior. Real-device Safari/Android and a deployed Netlify preview should be checked before release.
