---
paths:
  - "src/app/api/**"
  - "src/server/**"
---

# Backend conventions

- Route handlers (`src/app/api/**/route.ts`) stay thin: parse and validate
  input, call a service in `src/server/services/`, return the response.
- Business logic lives in services. Services don't know about HTTP.
- Files under `src/server/` start with `import "server-only";` so they can't
  be bundled into client code by accident.
- Return consistent JSON errors: `{ error: { code, message } }` with an
  appropriate status code.
- Vercel functions are stateless with time limits. Run long jobs (bulk
  document ingestion, re-indexing) as background or scheduled jobs, not in
  a request.
