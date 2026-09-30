---
paths:
  - "**/*.test.ts"
  - "**/*.test.tsx"
  - "tests/**"
---

# Testing conventions

- Put tests next to the code they cover: `foo.ts` → `foo.test.ts`.
- Focus on services and utilities with real logic. Skip tests for trivial
  presentational components (hackathon pace).
- Use Testing Library queries by role/label, not by class or test id.
- Mock external services at the service boundary, not deep inside.
