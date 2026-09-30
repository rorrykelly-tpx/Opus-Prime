# Architecture

## Stack
Next.js (App Router) on Vercel, TypeScript, Tailwind CSS. See `CLAUDE.md` for
the full list and the folder layout.

## Request flow
Browser → Server Component / route handler (`src/app`) → service
(`src/server/services`) → data source (`src/server/db` or an external API).

## Open decisions
- Database
- Authentication (likely company SSO)
- Search (database full-text or a dedicated search service)
- Document ingestion for PowerPoint/Word files (storage and text extraction)

Record each decision as an ADR in `docs/decisions/`.
