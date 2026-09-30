# Spec 0001: Learning pathways

**Status:** Draft, for review
**Author:** Rorry Kelly
**Date:** 2026-09-30
**Reference prototype:** [TPXimpact learning pathways artifact](https://claude.ai/artifact/9wbdJpdmNk4Cix8WHsWcxe)

> Placeholders are marked **TBD**. Open questions are listed at the end.

## 1. Summary

A consultant chooses their role and grade. The app builds a personal
**learning pathway** from the TPXimpact progression framework. It covers the
craft skills the role needs, the behaviours expected at that grade, and the
consulting skills programme. Each skill in the pathway is a **module**. The
consultant reads what good looks like, checks their understanding, and links
learning resources and evidence to it.

The pathway is how consultants find their way into the learning centre. It
answers "what should I learn next for my role and grade?" and points to the
right content.

## 2. Problem

- The progression framework lives in spreadsheets. Consultants find it hard
  to see what applies to their role and grade.
- Learning resources (decks, docs, external courses, books) aren't linked to
  the framework skills they support.
- Evidence for progression conversations is collected ad hoc, usually in a
  spreadsheet filled in just before a review.

## 3. Goals and non-goals

### Goals

- A consultant can go from "choose role and grade" to a personal pathway in
  under a minute.
- Every module shows the expected level for the consultant's grade and what
  good looks like at that level.
- Every module links to relevant learning resources from the learning centre
  catalogue.
- A consultant can track progress through their pathway.

### Non-goals (for this spec)

- Formal grading or promotion decisions. The app supports conversations with
  line managers. It doesn't replace them.
- Editing the framework in the app. The framework spreadsheets stay the
  source of truth.
- Replacing the progression assessment process.

## 4. Users

| User | Needs |
| --- | --- |
| Consultant | See what their role and grade need, find learning for it, track progress |
| Line manager / mentor | See a report's pathway and evidence when it is shared with them (phase 3) |
| Head of Practice / L&D admin | Keep framework data and resource links up to date (phase 2) |

## 5. User flow

This follows the flow of the reference prototype.

```
Home: choose role + grade ──► Pathway ──► Module ──► (read → quiz → evidence)
        │                        │
        └─ Import assessment     ├─► My year (evidence log)
           (phase 2)             ├─► Where am I? (level estimate, phase 2)
                                 └─► Sharing (phase 3)
```

### 5.1 Home: choose role and grade

- Heading: "Grow in your craft".
- The consultant picks a **role**. Roles are grouped by capability and
  practice, e.g. Delivery → Delivery Management → Delivery Manager.
- The consultant then picks a **grade**. Only grades that exist for that role
  are offered. Show a hint like "This role starts at Junior / Graduate (6/7)".
- Primary action: **Build my pathway**.
- Secondary panel (phase 2): "Already done a progression assessment? Upload
  the Excel file instead."

### 5.2 Pathway

- Header: practice, role, "Your grade: …", and a **Change role or grade** link.
- Explainer: "Each module has three steps: read what good looks like, pass the
  quiz, and log evidence at the level for your grade."
- Sections:
  1. **Your craft skills**: skills mapped to the role, each with the expected
     proficiency level at the chosen grade.
  2. **Behaviours**: the 5 behaviours (e.g. Developing your craft,
     Communicating and collaborating) and the band for the grade.
  3. **Consulting core**: the 3 consulting pillars (e.g. Client
     Relationships), each with modules at the literacy, fluency and mastery
     stages. Foundation modules are for everyone.
- Each module card shows a name, the target level and progress (not started,
  read, quiz passed, evidence logged).
- Overall **Pathway progress** indicator.

### 5.3 Module

- Title, definition and target level for the consultant's grade.
- **What good looks like**: the framework descriptors for the target level,
  with the levels either side for context. The consultant can **Mark as
  read** or **Undo**.
  - If the framework doesn't describe the target level yet, say so: "Ask your
    Head of Practice what good looks like."
- **Learning resources** (not in the prototype, added for the learning
  centre): catalogue items tagged to this skill. Examples: internal decks,
  Service Manual pages, GOV.UK standards, books, external courses.
- **Test yourself** (phase 2): a short quiz generated from the level
  descriptors. The pass mark is 80%. Show "Passed. This counts towards your
  module progress." or "Not passed yet. Read the levels again and have
  another go."
- **Your evidence**: evidence items tagged to this module, with a link to add
  more.
- **Where this sits** (consulting modules only): the pillar, the stage, and
  the linked impact and behaviour. Also list other modules in the same pillar.

### 5.4 My year (evidence log)

- "What have you done this year?" The consultant adds evidence with a title,
  a date, and "What you did and what changed".
- Placeholder prompt: "What was the situation? What did you do? What was the
  result? Include feedback you received."
- The consultant tags evidence against framework items by hand. AI-assisted
  tagging ("Map to my framework") is phase 2.
- Evidence can be edited and deleted. Deleting asks for confirmation.
- Privacy copy: "Your evidence is private to you unless you choose to share
  it."

### 5.5 Where am I? (phase 2)

- Estimates the grade the consultant is working at, based on their evidence.
- Placement rule, taken from the prototype and to be confirmed: the evidence
  meets at least 70% of the craft skill levels **and** 3 of the 5 behaviour
  bands at a grade, and every grade below it.
- **What to do next**: the biggest gaps for the target grade, most important
  first, each linked to its module and resources.
- Optional AI-generated 3-month plan.
- Always show: "This is a guide for conversations with your line manager, not
  a grading decision."

### 5.6 Import a progression assessment (phase 2)

- Upload `.xlsx` / `.xls` / `.ods`. Read the role, grade, self-assessed levels,
  evidence and line manager comments.
- Column mapping UI per sheet: framework item column, level column, evidence
  columns, comments and header row.
- Result: "Imported N items". The pathway and evidence update.

### 5.7 Sharing (phase 3)

- "Who can see your progress": share by colleague email.
- "Shared with me": a read-only view of another consultant's pathway,
  evidence and position against expectations.
- Access must be enforced on the server. The prototype noted that its sharing
  "isn't yet a hard security boundary". This app must fix that.

### 5.8 Framework data (admin, phase 2)

- Show the framework version, the source spreadsheets, and counts (roles,
  skills, behaviours, impacts).
- Update by uploading the framework workbooks: "Progression Framework - DT
  billable skills" and "Progression Framework - behaviours and impact matrix".
  Alternatively, sync from the Google Sheet (**TBD**).

## 6. Scope by phase

| Phase | Includes | Why |
| --- | --- | --- |
| **1 (MVP, this hackathon)** | 5.1 Home, 5.2 Pathway, 5.3 Module (read + resources), static framework data | Shows the core value: framework → pathway → learning content |
| 2 | Quiz, My year, Where am I?, assessment import, framework upload, AI tagging and plans | Needs persistence, auth and AI decisions |
| 3 | Sharing with line managers and mentors | Needs auth and permissions |

## 7. Data model (draft)

Taken from the prototype's framework data. It contains 21 roles, 111 skill
definitions, 6 proficiency levels, 5 behaviours, 3 impacts and 3 consulting
pillars.

```ts
type ProficiencyLevel =
  | "Learner" | "Contributor" | "Skilled" | "Expert" | "Leader" | "Driver";

type Grade = "6/7" | "8" | "9" | "10" | "11" | "12"; // TBD: confirm labels

interface Skill {
  name: string;               // e.g. "Accessibility and inclusion (Service Design)"
  definition: string;
  levels: Record<ProficiencyLevel, string[]>; // "what good looks like" descriptors
}

interface Role {
  capability: string;         // e.g. "Delivery"
  practice: string;           // e.g. "Delivery Management"
  role: string;               // e.g. "Delivery Manager"
  grades: Grade[];
  skills: { name: string; expected: Partial<Record<Grade, ProficiencyLevel | null>> }[];
}

interface Behaviour {
  name: string;               // e.g. "Developing your craft"
  definition: string;
  bands: Record<Grade, string[]>;
}

interface ConsultingPillar {
  pillar: string;             // e.g. "Client Relationships"
  summary: string;
  links: { impact: string; behaviour: string };
  modules: { name: string; stage: "literacy" | "fluency" | "mastery"; foundation: boolean }[];
}

// Phase 2+
interface Evidence {
  id: string;
  userId: string;
  title: string;
  date: string;               // ISO date
  text: string;
  tags: { itemName: string; level?: ProficiencyLevel }[];
}

interface ModuleProgress {
  userId: string;
  moduleKey: string;
  read: boolean;
  quizPassedAt?: string;
}
```

Resource links: each catalogue resource has `frameworkTags: string[]` that
match `Skill.name`, `Behaviour.name` or consulting module names. **TBD:**
this depends on the catalogue spec.

## 8. Technical approach

Follows `CLAUDE.md` and `.claude/rules/`.

| Concern | Location |
| --- | --- |
| Types | `src/types/pathways.ts` |
| Framework data (phase 1) | Static JSON in `src/data/framework.json`, validated with zod on load |
| Service | `src/server/services/pathways.ts`. `buildPathway(role, grade)`, `getModule(key, grade)`, `estimateLevel(evidence)` (phase 2) |
| API | Not needed for phase 1. Server Components call the service directly. Phase 2 adds `src/app/api/evidence/route.ts` |
| Routes | `/pathways` (home), `/pathways/[role]/[grade]` (pathway), `/pathways/[role]/[grade]/modules/[module]` (module) |
| Components | `src/components/features/pathways/`, e.g. `RolePicker.tsx`, `GradePicker.tsx`, `ModuleCard.tsx`, `LevelDescriptors.tsx`, `PathwayProgress.tsx` |
| State (phase 1) | Role and grade in the URL, so pathways can be bookmarked and shared. "Mark as read" is kept in `localStorage` until there is a database |

Decisions this feature forces (record as ADRs in `docs/decisions/`):

- Database for evidence and progress (phase 2).
- Auth, likely company SSO (phase 2). It is required before any evidence is
  stored on the server.
- AI provider and usage policy for tagging, quizzes and plans (phase 2).
- Storage and handling of framework data. Is it sensitive or internal-only?

## 9. Acceptance criteria (phase 1)

- [ ] I can pick any of the 21 roles and only see grades valid for that role.
- [ ] **Build my pathway** takes me to a URL that encodes my role and grade.
- [ ] The pathway lists every craft skill for the role with the expected
      level at my grade. Skills with no expectation at my grade are hidden or
      marked "Not expected at your grade".
- [ ] The pathway lists the 5 behaviours and the 3 consulting pillars with
      their modules.
- [ ] A module page shows the target level descriptors, plus the levels either
      side for context.
- [ ] A module with no descriptors at the target level shows the "Ask your
      Head of Practice" note.
- [ ] A module page lists tagged learning resources, or an empty state if
      there are none.
- [ ] Mark as read persists across reloads in the same browser and updates
      pathway progress.
- [ ] Pages are keyboard accessible, have labelled controls and meet WCAG 2.2
      AA.
- [ ] Unit tests cover `buildPathway` and `getModule`, including a role
      with gaps in its level descriptors.
- [ ] `npm run check` passes.

## 10. Open questions

1. Can the framework data be committed to the repo, or must it be loaded at
   runtime from an internal source?
2. Where do resource-to-skill tags come from? Are they tagged by hand in the
   catalogue, suggested by AI, or both?
3. How do consulting stages map to grades? The prototype suggests literacy
   for grades 6–8, fluency for 8–10 and mastery for 10+. Is this confirmed?
4. Is the placement rule (70% of skills, 3 of 5 behaviours) official, or was
   it invented for the prototype?
5. Who owns updates to the framework data?
6. Does the quiz need approved question banks, or are AI-generated questions
   acceptable?
7. Grade labels: confirm display names (e.g. "Junior / Graduate (6/7)") for
   each grade.
