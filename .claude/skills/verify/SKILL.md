---
name: verify
description: Run the project's quality gate (lint, typecheck, tests, build) before handing off a finished change or opening a PR. Use when a feature or fix is complete, not after every small edit.
---

# Verify

1. Run `npm run check` (lint, typecheck, test, in that order).
2. If the change touches routing, config, env vars or dependencies, also run
   `npm run build`. Vercel runs the same build.
3. If something fails, fix it and re-run only the failing step.
4. Report the outcome in a short summary: what passed, anything that failed,
   and anything you skipped and why.
