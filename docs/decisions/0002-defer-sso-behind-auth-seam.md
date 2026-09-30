# 2. Defer SSO, but route all identity through an auth seam

**Status:** Accepted
**Date:** 2026-09-30

## Context
The app will need company SSO for login, but it isn't a hackathon priority.
Per-user features (bookmarks, progress, collections) still need to know who
the user is, and we don't want to rework them when SSO arrives.

## Decision
- All code gets the current user from `@/server/auth` via `getCurrentUser()`
  or `requireUser()`. Nothing else reads sessions, cookies or tokens.
- These are backed by an `AuthProvider` interface, selected with the
  `AUTH_PROVIDER` env var. Today the only provider is `dev`, which returns a
  fixed user for every request.
- `User.id` is the identity provider's stable subject ID (e.g. the Entra ID
  object ID), not the email. Store user-owned data against `User.id`.

## Consequences
- Adding SSO means writing one new provider (likely Auth.js with the
  company's IdP), adding sign-in routes, and optionally a `proxy.ts` to
  protect pages. Callers don't change.
- Until then, anyone who can reach a deployment is the dev user, and all
  per-user data is shared. Vercel preview/production deployments should be
  treated as non-private (use Vercel Deployment Protection if needed).
- Data saved against `dev-user` won't map to real users; plan to discard or
  migrate it when SSO lands.
