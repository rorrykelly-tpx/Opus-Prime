# Auth

Who is making the request. Call `getCurrentUser()` or `requireUser()` from
`@/server/auth` in Server Components, route handlers and services. Never read
sessions, cookies or identity-provider tokens anywhere else.

The active provider is chosen by `AUTH_PROVIDER`. Only `dev` exists today (a
fixed local user). SSO will be added as another `AuthProvider`; see
`docs/decisions/0002-defer-sso-behind-auth-seam.md`.
