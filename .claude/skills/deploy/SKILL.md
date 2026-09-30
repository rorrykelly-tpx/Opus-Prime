---
name: deploy
description: Prepare and ship a change to Vercel through a preview deployment and PR. Use when the user asks to deploy, ship or open a PR.
---

# Deploy

The GitHub repo is connected to Vercel, so pushing a branch creates a preview
deployment and merging to `main` deploys to production.

1. Run the `verify` skill, including `npm run build`.
2. Make sure any new env vars are in `.env.example` and tell the user to add
   them in Vercel (Project → Settings → Environment Variables) for Preview and
   Production.
3. Commit on a feature branch, never directly on `main`, then push.
4. Open a PR with `gh pr create`. Summarise the change and include the
   preview URL once Vercel posts it.
5. Don't run a production deploy (`vercel --prod`) or merge to `main` without
   explicit approval from the user.
