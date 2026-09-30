# 1. Use Next.js on Vercel

**Status:** Accepted
**Date:** 2026-09-30

## Context
We need a full-stack web app built quickly for a hackathon and hosted on Vercel.

## Decision
Use Next.js (App Router) with TypeScript and Tailwind CSS, deployed to Vercel.
The UI and API live in one codebase.

## Consequences
- Zero-config Vercel deploys, with a preview deployment for every PR.
- Serverless functions have execution time limits, so long-running ingestion
  work has to run as background or scheduled jobs.
