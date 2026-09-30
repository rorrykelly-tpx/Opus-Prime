# Architecture

## Stack

Next.js (App Router) on Vercel, TypeScript, Tailwind CSS. See `CLAUDE.md` for
the full list and the folder layout.

## Request flow

Browser → Server Component / route handler (`src/app`) → service
(`src/server/services`) → data source (`src/server/db` or an external API).

## Authentication

All identity lookups go through `src/server/auth` (`getCurrentUser()` /
`requireUser()`), backed by a swappable `AuthProvider` that also handles
sign-in and sign-out. Until company SSO is added, `/sign-in` offers test users
and `/pathways` redirects there when nobody is signed in. See ADRs 0002 and 0005.

## Open decisions

- Database
- Search (database full-text or a dedicated search service)
- Document ingestion for PowerPoint/Word files (storage and text extraction)

Record each decision as an ADR in `docs/decisions/`.
