# 4. Keep pathway progress and evidence in the browser for now

**Status:** Accepted, until a database is chosen
**Date:** 2026-09-30

## Context

The learning pathways app, which matches the reference prototype, lets consultants mark
modules as read, take quizzes, log evidence, import a progression assessment and upload
certificates. Spec 0001 keeps "Mark as read" in `localStorage` until there is a database.
No database has been chosen yet. Identity comes from the auth seam (ADR 0002), which returns a
fixed dev user for now.

## Decision

- Keep the consultant's profile, evidence and certificates in `localStorage`, under keys
  that include the signed-in user's id (`lp:<userId>:…`), so people sharing a browser don't
  see each other's data.
- Validate everything read back from storage with zod, dropping invalid items rather than
  failing.
- Keep the demo (Julia Okafor) in memory only, flagged in `sessionStorage` for the tab.
- Leave sharing off outside the demo. Spec 0001 requires access to be enforced on the server,
  which needs a database.
- Leave out the prototype's AI features (mapping evidence, scenario quizzes, 3-month plans and
  reading unusual spreadsheets) until an AI provider is chosen.

## Consequences

- Progress stays on one device and is lost if browser data is cleared.
- Certificate files are stored as data URLs, so large files can exceed the browser's storage
  quota. The app tells the consultant when a save fails.
- When a database arrives, `src/lib/pathways/storage.ts` and `app-store.ts` are the only
  places that read or write this data, and records are already keyed by `User.id`.
