# CLAUDE.md

## Overview
This project is a learning and development centre web application for a
medium-sized consultancy agency.

The application will provide a central place for consultants to discover,
search, organise, and consume learning and professional development content.

## Purpose

The application will collate learning information from multiple sources,
including:

- PowerPoint presentations
- Word documents
- External training platforms and websites
- Books
- Blogs and articles
- Other internal learning materials

The goal is to make existing learning resources easier to discover and use,
rather than requiring consultants to search across multiple systems and
sources.

## Core Features
<!-- To be defined. See Ideas.md for the working list. -->

## Technical Requirements
- **Framework:** Next.js (App Router) + React + TypeScript (strict)
- **Styling:** Tailwind CSS v4
- **Testing:** Vitest + Testing Library
- **Linting/formatting:** ESLint (flat config) + Prettier
- **Hosting:** Vercel (preview deploy per PR, production from `main`)
- **Runtime:** Node 22 (see `.nvmrc`)
- Database, auth and search provider are not chosen yet. Record the choice in
  `docs/decisions/` when you make it.

## Project Structure
```
src/
  app/                 Routes, layouts, pages (App Router)
    api/               Route handlers (HTTP endpoints)
  components/
    ui/                Generic, reusable presentational components
    features/          Feature-specific components (e.g. search, library)
  lib/                 Shared client/server-safe utilities, env parsing
  server/              Server-only code; never import from client components
    services/          Business logic (ingestion, search, catalogue)
    db/                Database client and queries
  types/               Shared TypeScript types
public/                Static assets
tests/                 Test setup and cross-cutting tests
docs/                  Architecture notes and decision records (ADRs)
.claude/               Agent config: settings, rules, skills
```

## Commands
| Task | Command |
| --- | --- |
| Install | `npm install` |
| Dev server | `npm run dev` |
| Lint | `npm run lint` |
| Typecheck | `npm run typecheck` |
| Test | `npm test` |
| Build | `npm run build` |
| All checks | `npm run check` |

## Development Guidelines
This application is being built as a part of a hackathon, so verification and approval should be intelligent. When making changes to already approved work, approval should be required. However verification shouldn't be too granular, we are trying to strike a balence between correctness and speed.

In practice:
- Run `npm run check` (the `verify` skill) before handing off a finished
  change, not after every small edit.
- Ask before changing work that has already been approved or merged.
- Keep PRs small and focused so Vercel preview deploys are easy to review.
- Detailed conventions live in `.claude/rules/` and load automatically.
