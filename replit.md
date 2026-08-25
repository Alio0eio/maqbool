# EMPO — AI Recruitment Platform

An AI-assisted recruitment platform connecting candidates and recruiters, covering job posting, applications, async video interviews, and offers.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/empo` — the live candidate/recruiter frontend (React + Vite). Currently runs against mock data (`src/lib/mock-data.ts`), not the real API.
- `artifacts/mockup-sandbox` — a design/prototyping sandbox sharing the same `@workspace/design-system` package as `empo`.
- `artifacts/api-server` — Express 5 API. Only `/api/healthz` is implemented; the other ~45 endpoints defined in the OpenAPI spec have no handlers yet.
- `lib/design-system` — shared UI components (shadcn-based) consumed by both `empo` and `mockup-sandbox` via `workspace:*`.
- `lib/api-spec/openapi.yaml` — source of truth for the API contract (auth, jobs, candidates, applications, interviews, offers, companies, notifications, conversations, billing, reports).
- `lib/api-zod` and `lib/api-client-react` — generated (via Orval, `pnpm --filter @workspace/api-spec run codegen`) from `openapi.yaml`. Do not hand-edit `src/generated/*`.
- `lib/db` — Drizzle + Postgres setup. Connection/config is real; `src/schema/index.ts` is still an empty template — no tables are defined yet.
- `Empo_stitch/` — reference-only folder of Stitch design mockups (screenshots + generated HTML) that `empo`'s pages were originally built from. Check here before redesigning an empo page.
- `.design-sync/`, `.ds-sync/`, `ds-bundle/` — generated/cache state for an external design-sync tool; all gitignored, safe to delete and regenerate.

## Architecture decisions

- Spec-first API: the OpenAPI spec and its generated client/schemas exist ahead of the server implementation — `empo` is meant to eventually consume `@workspace/api-client-react`'s generated hooks instead of `mock-data.ts`.
- `lib/design-system` exports point at `src/` (not `dist/`) so consumers typecheck against source directly; the `dist/` build output that exists isn't currently consumed by anything.
- No automated tests or CI exist yet anywhere in the repo.

## Product

Two user roles — candidates and recruiters — covering the full hiring loop: job posting → application → screening → async video interview → decision → offer.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- macOS is case-insensitive by default — a page imported as `@/pages/recruiter/jobs` but saved as `Jobs.tsx` will typecheck locally-passing-looking but fail `tsc` with a TS1261 casing-collision error. Keep filenames and import paths in matching case.
- `artifacts/empo`'s `tsconfig.json` needs `"types": ["vite/client"]` for `import.meta.env` to typecheck — don't reset it to `[]`.
- Run `pnpm run typecheck` from the repo root before assuming a frontend package is healthy; per-package `pnpm --filter <name> run typecheck` is faster while iterating.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
