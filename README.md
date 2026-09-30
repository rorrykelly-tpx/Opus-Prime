# Opus Prime: Learning Centre

A central place for consultants to discover, search, organise and consume
learning and professional development content.

## Getting started

Requires Node 22 (`nvm use`).

```bash
npm install
cp .env.example .env.local
npm run dev        # http://localhost:3000
```

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build (what Vercel runs) |
| `npm run check` | Lint + typecheck + tests |
| `npm run format` | Format with Prettier |

## Deployment

Hosted on Vercel. Import the GitHub repo in Vercel; the framework is detected
automatically. Every PR gets a preview deployment and `main` deploys to production.
Set environment variables in Vercel → Project → Settings → Environment Variables.

## Docs

- [CLAUDE.md](CLAUDE.md): project context and conventions for AI agents
- [docs/architecture.md](docs/architecture.md)
- [docs/decisions/](docs/decisions/): architecture decision records
