# 2. Keep phase 1 framework data as static JSON in the repo

**Status:** Proposed. Depends on spec 0001, open question 1 (can the framework data be committed?)
**Date:** 2026-09-30

## Context

Learning pathways (spec 0001) need the TPXimpact progression framework: roles, skill
definitions and level descriptors, behaviours, impacts and the consulting skills programme.
The source of truth is two spreadsheets, "Progression Framework - DT billable skills" and
"Progression Framework - behaviours and impact matrix". Phase 1 has no database, and
uploading the framework in the app is phase 2.

## Decision

- Store the framework in `src/data/framework.json`. It was converted from the data embedded in
  the reference prototype (Skills v1.0, Progression Assessment 2026, and Behaviours and impact
  v3.0). It holds 21 roles, 111 skills, 6 proficiency levels, 5 behaviours, 3 impacts and
  3 consulting pillars.
- Store learning resources in `src/data/resources.json`. Each resource has `frameworkTags` that
  match skill, behaviour or consulting module names. The 32 resources are the prototype's
  starter set of public links, tagged using the prototype's matching rules. They are a
  placeholder until the catalogue spec decides where tags come from (open question 2).
- Validate both files with zod when the server loads them
  (`src/server/services/framework.ts`), including cross-references such as undefined skills,
  unknown resource tags and URL slug clashes. A unit test parses the committed files, so CI
  catches bad data.
- Only server code reads the files. Client components get the view models they need as props.

## Consequences

- No database or network call is needed to render a pathway, so pages render quickly.
- Updating the framework means editing the JSON and redeploying until phase 2 adds framework
  upload. The spreadsheets stay the source of truth, so changes must be made there first.
- The framework ships in the repo and in every deployment, including Vercel previews. If it is
  internal-only, it must not go in a public repo, and previews need Vercel deployment
  protection. If it can't be committed at all, load it at runtime from an internal source
  instead. Only `framework.ts` would need to change.
- Some descriptors contain typos from the source spreadsheets. They are kept as they are so the
  data matches the framework, and should be fixed at the source.
