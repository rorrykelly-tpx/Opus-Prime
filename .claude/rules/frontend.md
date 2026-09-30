---
paths:
  - "src/app/**/*.tsx"
  - "src/components/**/*.tsx"
---

# Frontend conventions

- Components are Server Components by default. Add `"use client"` only when
  the component needs state, effects or browser APIs, and keep client
  components as small leaves.
- Never import from `src/server/` in a client component.
- Style with Tailwind utility classes. Use `cn()` from `@/lib/utils` to
  combine conditional classes.
- Generic, reusable pieces go in `components/ui/`. Anything tied to a domain
  concept (search, resource cards, collections) goes in `components/features/<feature>/`.
- Accessibility is required: semantic HTML, labelled form controls, visible
  focus states, alt text on images.
- Fetch data in Server Components or route handlers, not in `useEffect`.
