# Auth

Who is making the request. Call `getCurrentUser()` or `requireUser()` from
`@/server/auth` in Server Components, route handlers and services. Never read
sessions, cookies or identity-provider tokens anywhere else.

Sign-in and sign-out also go through here (`signInOptions()`, `signIn()`,
`signOut()`), used by `/sign-in` and the header's sign-out button via the
server actions in `src/app/sign-in/actions.ts`.

The active provider is chosen by `AUTH_PROVIDER`. Only `dev` exists today: the
sign-in page lists test users and the chosen one is kept in a cookie. SSO will
be added as another `AuthProvider`; see ADRs 0002 and 0005.
