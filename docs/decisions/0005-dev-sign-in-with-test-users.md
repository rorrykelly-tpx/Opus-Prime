# 5. Dev sign-in with test users until SSO

**Status:** Accepted
**Date:** 2026-09-30

## Context

ADR 0002 put identity behind `@/server/auth`, with a dev provider that always
returned one fixed user. That meant the UI could never show a signed-out
state, sign-in or sign-out, and per-user progress couldn't be demonstrated
with more than one person.

## Decision

- `AuthProvider` also covers sign-in and sign-out: `signInOptions()`,
  `signIn(optionId)` and `signOut()`.
- The `/sign-in` page renders one button per sign-in option. The header has a
  sign-out button. `/pathways` redirects to `/sign-in` when nobody is signed in.
- The dev provider offers a few test users and stores the chosen user's id in
  an `httpOnly` cookie. The first test user keeps the id `dev-user`, so
  progress already saved in browsers is kept.

## Consequences

- An SSO provider returns a single "company account" option and its `signIn`
  redirects to the identity provider. The sign-in page and header don't change.
- The dev cookie isn't signed, so anyone can sign in as any test user. That's
  acceptable only because the accounts are fake and no data is stored on the
  server.
- After signing in you land on `/pathways`, not the page you first asked for.
  Add a return path if that becomes annoying.
