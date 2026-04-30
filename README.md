# Shaken Baby Alliance COPE Admin

Nuxt 4 admin portal for the COPE messaging system. This repo contains the web UI, API routes, authentication layer, Prisma data access, and deployment configuration used to manage caregivers, messages, workflows, settings, and reporting.

## Stack

- `Nuxt 4` for the application shell and routing
- `Nuxt UI` and Tailwind for UI primitives and styling
- `Better Auth` for authentication
- `Prisma` for database access
- `SQLite` for local development
- `Twilio` for messaging integration
- `Nodemailer` for email delivery

## Setup

### 1. Install dependencies

This repository should use `pnpm` as the default package manager.

```bash
pnpm install
```

### 2. Configure environment variables

Create a local environment file from the template:

```bash
cp .env.example .env
```

Set values for:

- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `EMAIL_USER`
- `EMAIL_PASS`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`
- `GEMINI_API_KEY`

### 3. Prepare the database

```bash
pnpm dlx prisma generate
pnpm prisma:reset
```

### 4. Run locally

```bash
pnpm dev
```

The app runs on `http://localhost:3000`.

## Repository Layout

- `app/`: Nuxt application code such as pages, layouts, middleware, composables, and components.
- `server/`: API routes and server-side utilities.
- `prisma/`: Prisma schema and seed data.
- `public/`: Static files served directly.
- `plugins/`: Nuxt plugins.
- `assets/`: Shared top-level styling assets.
- `docs/`: Project standards and structure notes.

See [docs/PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md) for organization rules and the current cleanup backlog.

## Team Conventions

- Keep secrets only in local `.env` files, never in committed source files.
- Prefer `pnpm` so the lockfile stays consistent across the team.
- Keep route filenames lowercase and hyphenated for predictable URLs.
- Group server APIs by domain and use one routing style consistently within each domain.
- Avoid committing generated artifacts such as local databases, logs, and build outputs.

## Current Structural Priorities

- Standardize API route structure so flat `.get/.post` files and nested `index.ts` routes are not mixed for the same domain.
- Continue moving shared backend business logic out of route files and into dedicated services.
- Split larger pages into domain-focused subcomponents as the UI grows.

## License

MIT
