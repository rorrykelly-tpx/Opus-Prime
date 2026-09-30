---
name: new-feature
description: Scaffold a new feature end to end (route, components, service, types, test) following the project structure. Use when the user asks to add a new page, feature or capability.
---

# New feature

Given a feature name (e.g. `search`, `collections`):

1. **Confirm scope.** Restate the feature in one or two sentences. If it
   changes already-approved work, ask before continuing.
2. **Types:** add shared types to `src/types/<feature>.ts`.
3. **Service:** add business logic to `src/server/services/<feature>.ts`
   (starting with `import "server-only";`), plus a `<feature>.test.ts` beside it.
4. **API (if needed):** add `src/app/api/<feature>/route.ts`. Validate input
   with zod and call the service.
5. **UI:** add the page under `src/app/<route>/page.tsx` and components under
   `src/components/features/<feature>/`.
6. **Env:** if the feature needs new env vars, add them to `.env.example` and
   `src/lib/env.ts`.
7. Run the `verify` skill.
