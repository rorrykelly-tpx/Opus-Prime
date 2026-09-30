# Services

Server-only business logic (content ingestion, search, catalogue). Each file
starts with `import "server-only";`. Route handlers and Server Components call
these; services never deal with HTTP directly.
