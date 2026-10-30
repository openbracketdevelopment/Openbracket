# OpenBracket

OpenBracket is a responsive studio website built with Next.js App Router, TypeScript, and CSS. It includes light and dark themes, an interactive CRT hero, and a server-side contact form.

## Requirements

- Node.js 26.x recommended (see `.nvmrc`)
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

Set the Resend API key, verified sender, recipient, and `SITE_URL=http://localhost:3000`. Local development uses an in-memory rate limiter when Upstash Redis is not configured. Keep credentials server-side. The site runs without email credentials, but contact form delivery requires them.

## Run a production build locally

```sh
npm run build
npm start
```

The contact form requires Upstash Redis and a trusted proxy IP header in production mode; use `npm run dev` for local form development without that infrastructure.

## Development commands

```sh
npm run lint          # Check code quality
npm run typecheck     # Check TypeScript
npm test              # Run tests
npm run format        # Format files
npm run format:check  # Check formatting
```
