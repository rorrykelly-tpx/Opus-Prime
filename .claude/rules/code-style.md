# Code style

- TypeScript strict mode. No `any` unless there's a comment explaining why.
- Import through the `@/` alias (`@/lib/utils`), not long relative paths.
- Named exports for components and utilities. Default exports only where
  Next.js requires them (`page.tsx`, `layout.tsx`, etc.).
- File names: `kebab-case.ts` for modules, `PascalCase.tsx` for components.
- Validate external input (request bodies, query params, env vars, ingested
  files) with `zod` at the boundary. Trust the types after that.
- Put secrets in environment variables. Add every new variable to
  `.env.example` and to `src/lib/env.ts`.
- Comment on why, not what. Don't leave commented-out code behind.
