# Project Structure Standards

This document defines the target organization for the COPE admin repository and highlights the main gaps in the current layout.

## Target Layout

```text
app/
  components/     reusable UI building blocks
  composables/    client-side reusable logic
  layouts/        app shells
  middleware/     route guards
  pages/          file-based routes
  utils/          browser-only helpers

server/
  api/            HTTP endpoints grouped by domain
  utils/          server-only helpers and integrations

prisma/
  schema.prisma   schema definition
  seed.ts         local/dev seed data

public/           static files
assets/           global styles and non-public source assets
plugins/          Nuxt plugins
docs/             repository standards and architecture notes
```

## Naming Rules

- Use lowercase kebab-case for route files in `app/pages`.
- Use domain-first grouping for `server/api`.
- Keep utilities named by responsibility, not by screen.
- Use singular or plural API resource names consistently per domain.

## Current Findings

### 1. Mixed route naming

- The canonical login route now lives at `app/pages/login.vue`.
- Some pages are domain-specific, while others use generic names like `flows.vue` and `templates.vue` without matching server-side grouping.

### 2. Mixed API layout patterns

- Flat resource handlers exist beside nested folder routes.
- `server/api/get/users/index.ts` uses a one-off path shape that does not match the main `users.*.ts` pattern.
- `dashboard.get.ts` exists alongside `dashboard/stats/index.ts` and `dashboard/users/recent/index.ts`, which suggests partial domain nesting.

### 3. Shared asset ownership

- Global styles should live in a single canonical location.
- The active Nuxt stylesheet entrypoint is `app/assets/css/main.css`.

### 4. Environment and local state hygiene

- The repository correctly ignores `.env`, local databases, and build outputs.
- Teams should rely on `.env.example` for setup and keep real credentials local only.

### 5. Package management consistency

- The repository is standardized on `pnpm`.

## Safe Next Refactors

- Move the `server/api/get/users/index.ts` handler into the standard `users` API structure or remove it if unused.
- Split large page files into domain subcomponents where the UI is growing beyond one screen per file.
