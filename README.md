# OpenBracket

OpenBracket is a responsive studio website built with Next.js App Router, TypeScript, and CSS. It includes light and dark themes, an interactive CRT hero, and a server-side contact form.

## Requirements

- Node.js 26.x recommended to match `.nvmrc` and deployment (22.13+ on 22.x or 24+ also supported)
- npm

## Run locally

```sh
npm ci
npm run dev
```

Open [localhost:3000](http://localhost:3000).

## Environment setup

To enable the contact form, create a local environment file:

```sh
cp .env.example .env.local
```

Set the Resend API key, verified sender, recipient, and site URL. Production also requires the Upstash Redis credentials and trusted proxy IP header listed in `.env.example`. Keep credentials server-side.

## Production

```sh
npm run build
npm start
```

Deploy to a Next.js-compatible Node.js host. Static-only hosting does not support the contact form endpoint.

### Netlify releases

The pipeline mirrors the portfolio site, with `main` replacing `master`:

- [Release build](.github/workflows/release.yml) builds and publishes to production when a `v*` tag is pushed. The tagged commit must be on `main`. Ordinary branch pushes do not deploy.
- Set `AUTO_PUBLISH` to `"false"` in that workflow before tagging to create drafts instead. Both modes use Netlify's **production** environment-variable context.
- [Publish production](.github/workflows/publish-production.yml) manually promotes a draft without rebuilding. Run it from `main` with the deploy ID from the release summary, or use Netlify's **Publish deploy** control.

**GitHub configuration**

Under **Settings > Secrets and variables > Actions**, add these **repository secrets**:

| Secret               | Value                                                                                                           |
| -------------------- | --------------------------------------------------------------------------------------------------------------- |
| `NETLIFY_AUTH_TOKEN` | Netlify personal access token from user settings > Applications, for an account allowed to deploy this project. |
| `NETLIFY_SITE_ID`    | OpenBracket's Project ID / Site ID from Netlify project configuration. Do not use the portfolio's ID.           |

The portfolio's token can be reused if its account has access to both projects; a restricted deployment account is preferable. No GitHub PAT or Netlify build hook is needed.

Enable GitHub Actions and create a **production** environment for manual promotion. Optionally require reviewers and restrict deployment branches to `main`. Automatic tag releases intentionally bypass this environment, matching the portfolio; its approval rules do not gate automatic publishing. Keep the two secrets at repository scope so both workflows can access them.

**Netlify configuration**

1. Create or select the OpenBracket project. If connecting GitHub, select `main` as the production branch.
2. Stop Netlify's native Git builds using **Stop builds** in the project's continuous deployment build settings. CLI deployments still work; leaving Git builds enabled creates another deployment path on branch pushes.
3. [netlify.toml](netlify.toml) sets Node 26, build command `npm run build`, publish directory `.next`, and the Next.js adapter for server routes. Remove conflicting `NODE_VERSION` overrides. [.nvmrc](.nvmrc) selects the same runtime locally and in Actions.
4. Configure the production domain/DNS and HTTPS. Set these server-only application variables in Netlify's **Production** context, available to **Functions** and **Builds** where needed:
   - `SITE_URL`: exact production origin, without a trailing slash.
   - `RESEND_API_KEY`, `CONTACT_FROM`, `CONTACT_TO`: email credentials, verified sender, and recipient.
   - `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`: distributed rate limiter credentials.
   - `CONTACT_IP_HEADER`: a client-IP header that Netlify overwrites on the deployed Next.js handler. Verify the hosting contract before enabling the form; do not blindly copy a Vercel-specific header.
5. Mark credentials secret; never commit them or use `NEXT_PUBLIC_` prefixes. Allow outbound HTTPS to Resend/Upstash and at least 20 seconds for the contact function. The production form fails closed if trusted IP or Redis configuration is missing.

After merging these changes into `main`, push a new, unused release tag:

```sh
git switch main
git pull --ff-only
git tag v1.0.0
git push origin v1.0.0
```

The Actions summary contains the deploy URL and ID. A draft URL will not pass the contact form's origin check while `SITE_URL` points to production. Verify the form after deployment; obtain authorization before sending real test email.

## Development commands

```sh
npm run lint          # Check code quality
npm run typecheck     # Check TypeScript
npm test              # Run tests
npm run format        # Format files
npm run format:check  # Check formatting
```
