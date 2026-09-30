import type {
  BehaviourBand,
  Evidence,
  Framework,
  Grade,
  ProficiencyLevel,
  Role,
} from "@/types/pathways";

import {
  bandForGrade,
  BEHAVIOUR_BANDS,
  expectedLevel,
  findRoleByName,
  gradeLadder,
  PROFICIENCY_LEVELS,
} from "./framework";

// Reading a progression assessment spreadsheet: find the table, match rows to the framework and
// work out each level. Ported from the prototype; everything here is pure so it can be tested.

export interface Sheet {
  name: string;
  rows: string[][];
}

/** s: craft skill, b: behaviour, i: impact, c: consulting pillar. */
export type MatchKind = "s" | "b" | "i" | "c";

export interface Candidate {
  kind: MatchKind;
  name: string;
}

export type ImportLevel = ProficiencyLevel | BehaviourBand;

export function parseCSV(text: string, delimiter = ","): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += c;
    } else if (c === '"' && field === "") quoted = true;
    else if (c === delimiter) {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((x) => x.trim()));
}

export const norm = (s: string) =>
  String(s || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9()]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Normalised, without anything in brackets. */
const base = (s: string) =>
  norm(s)
    .replace(/\(.*?\)/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const STOP = new Set(["and", "the", "of", "a", "to", "in", "for", "with", "your", "you"]);
const tokens = (s: string) =>
  base(s)
    .replace(/[()]/g, "")
    .split(" ")
    .filter((w) => w && !STOP.has(w));

/** Names from the behaviours and impact matrix before v3.0, mapped to today's framework. */
export const ALIASES: Record<string, Candidate> = {
  "learning and development": { kind: "b", name: "Developing your craft" },
  "ownership of work and tasks": { kind: "b", name: "Owning and delivering" },
  "giving feedback": { kind: "b", name: "Supporting and developing others" },
  "presenting yourself in client situations": {
    kind: "b",
    name: "Communicating and collaborating",
  },
  "dealing with challenges": { kind: "b", name: "Navigating scope and complexity" },
  storytelling: { kind: "b", name: "Communicating and collaborating" },
  "time management": { kind: "b", name: "Owning and delivering" },
  "client contributions": { kind: "i", name: "Client delivery" },
  "inclusive teams": { kind: "i", name: "People and practice" },
  "practice area": { kind: "i", name: "People and practice" },
  "growth contribution": { kind: "i", name: "Growth and social value" },
};

export function candidates(framework: Framework, role: Role | null): Candidate[] {
  return [
    ...(role?.skills ?? []).map((s) => ({ kind: "s" as const, name: s.name })),
    ...framework.behaviours.map((b) => ({ kind: "b" as const, name: b.name })),
    ...framework.impacts.map((i) => ({ kind: "i" as const, name: i.name })),
    ...framework.consultingPillars.map((p) => ({ kind: "c" as const, name: p.pillar })),
  ];
}

/**
 * The framework item a spreadsheet label refers to: an exact or bracket-less match, an old
 * alias, a name contained in the label, or failing that the closest match by shared words.
 */
export function matchItem(framework: Framework, text: string, role: Role | null): Candidate | null {
  const nt = norm(text);
  const bt = base(text);
  if (!bt || bt.length < 3) return null;
  const all = candidates(framework, role);
  const exact = all.find((x) => norm(x.name) === nt) ?? all.find((x) => base(x.name) === bt);
  if (exact) return exact;
  for (const [k, v] of Object.entries(ALIASES)) {
    if (bt === k || bt.startsWith(`${k} `)) return v;
  }
  const contained = all
    .filter((x) => {
      const b = base(x.name);
      return b.length >= 6 && (bt.includes(b) || (bt.length >= 8 && b.includes(bt)));
    })
    .sort((a, b) => base(b.name).length - base(a.name).length);
  if (contained[0]) return contained[0];
  const words = new Set(tokens(text));
  let best: Candidate | null = null;
  let bestScore = 0;
  for (const x of all) {
    const xw = new Set(tokens(x.name));
    const shared = [...words].filter((w) => xw.has(w)).length;
    const score = shared / (new Set([...words, ...xw]).size || 1);
    if (score > bestScore) {
      bestScore = score;
      best = x;
    }
  }
  return bestScore >= 0.5 ? best : null;
}

/** +1 above expectations, 0 meeting them, -1 below, or null if the wording doesn't say. */
function relative(t: string): number | null {
  if (/exceed|above|beyond|outstanding|ahead/.test(t)) return 1;
  if (
    /working towards|not yet|develop|partial|approach|below|some evidence|emerging|^no$/.test(t)
  ) {
    return -1;
  }
  if (/meet|meeting|achieved|^yes$|^y$|competent|on track|fully|✓|^met$/.test(t)) return 0;
  return null;
}

export function parseGrade(text: string): Grade | null {
  const t = String(text || "").toLowerCase();
  const m = t.match(/\b(6|7|8|9|10|11|12)\b/);
  if (m) return m[1] as Grade;
  if (/head of/.test(t)) return "12";
  if (/principal/.test(t)) return "11";
  if (/\blead\b/.test(t)) return "10";
  if (/senior/.test(t)) return "9";
  if (/\bmid\b/.test(t)) return "8";
  if (/junior/.test(t)) return "7";
  if (/graduate/.test(t)) return "6";
  return null;
}

const LEVEL_WORDS: [string, ProficiencyLevel][] = [
  ["business leader", "Driver"],
  ["driver", "Driver"],
  ["leader", "Leader"],
  ["expert", "Expert"],
  ["skilled", "Skilled"],
  ["advanced", "Skilled"],
  ["practitioner", "Skilled"],
  ["contributor", "Contributor"],
  ["intermediate", "Contributor"],
  ["working", "Contributor"],
  ["learner", "Learner"],
  ["awareness", "Learner"],
  ["aware", "Learner"],
];

/** Turns a rating as written ("Skilled", "Meeting", "3", "Senior") into a level or band. */
export function parseLevel(
  kind: MatchKind,
  raw: string,
  name: string,
  role: Role | null,
  grade: Grade | null,
): ImportLevel | null {
  const t = norm(raw).replace(/[()]/g, "");
  if (!t) return null;
  if (kind === "s") {
    const exp = role && grade ? expectedLevel(role, name, grade) : null;
    const ei = exp ? PROFICIENCY_LEVELS.indexOf(exp) : -1;
    if (/working towards|not yet/.test(t)) return ei > 0 ? PROFICIENCY_LEVELS[ei - 1]! : null;
    for (const [word, level] of LEVEL_WORDS) if (t.includes(word)) return level;
    if (/^[1-6](\s|$)/.test(t)) return PROFICIENCY_LEVELS[Number(t[0]) - 1]!;
    const r = relative(t);
    if (r !== null && ei >= 0) return PROFICIENCY_LEVELS[Math.max(0, Math.min(5, ei + r))]!;
    return null;
  }
  if (kind === "b") {
    const r = relative(t);
    const gi = BEHAVIOUR_BANDS.indexOf(bandForGrade(grade ?? "8"));
    const g = parseGrade(t);
    if (g) return bandForGrade(g);
    if (r !== null) return BEHAVIOUR_BANDS[Math.max(0, Math.min(5, gi + r))]!;
  }
  return null;
}

export interface SheetTable {
  sheet: string;
  on: boolean;
  headers: string[];
  /** Header row index. */
  header: number;
  item: number;
  level: number;
  evidence: number[];
  manager: number;
  score: number;
}

const ITEM_RE =
  /(skill|behaviou?r|impact|competenc|criteri|capabilit|framework area|element|area)/i;
const LEVEL_RE = /(level|rating|score|self[\s-]?assess|proficiency|band|assessment|grade)/i;
const EV_RE =
  /(evidence|example|comment|note|narrative|justif|what (have|did) you|detail|reflection)/i;
const MGR_RE = /(manager|reviewer|\blm\b|assessor|moderat)/i;

const columnLetter = (i: number) => `Column ${String.fromCharCode(65 + (i % 26))}`;

/** Finds the assessment table on a sheet: its header row and the item, level and evidence columns. */
export function detectTable(framework: Framework, sheet: Sheet, role: Role | null): SheetTable {
  const rows = sheet.rows;
  let best: Omit<SheetTable, "sheet" | "on" | "headers"> | null = null;
  for (let r = 0; r < Math.min(rows.length, 40); r++) {
    const row = rows[r]!;
    let item = -1;
    let level = -1;
    let manager = -1;
    const evidence: number[] = [];
    row.forEach((c, i) => {
      if (!c || c.length > 60) return;
      if (item < 0 && ITEM_RE.test(c) && !LEVEL_RE.test(c) && !EV_RE.test(c)) item = i;
      else if (MGR_RE.test(c)) {
        if (manager < 0) manager = i;
      } else if (LEVEL_RE.test(c) && !/^(definition|description)$/i.test(c)) {
        if (level < 0 || /self/i.test(c)) level = i;
      } else if (EV_RE.test(c) && !/^(definition|description|guidance)/i.test(c)) evidence.push(i);
    });
    const score = (item >= 0 ? 2 : 0) + (level >= 0 ? 1 : 0) + (evidence.length ? 1 : 0);
    if (item >= 0 && score >= 3 && (!best || score > best.score)) {
      best = { header: r, item, level, evidence, manager, score };
    }
  }

  if (!best) {
    // No labelled header: find the column that holds framework names.
    const width = Math.max(0, ...rows.map((r) => r.length));
    let col = -1;
    let count = 0;
    let first = -1;
    for (let i = 0; i < width; i++) {
      let n = 0;
      let f = -1;
      rows.forEach((r, ri) => {
        const cell = r[i];
        if (cell && cell.length < 120 && matchItem(framework, cell, role)) {
          n++;
          if (f < 0) f = ri;
        }
      });
      if (n > count) {
        count = n;
        col = i;
        first = f;
      }
    }
    if (count >= 2) {
      const itemRows = rows.filter((r) => r[col] && matchItem(framework, r[col]!, role));
      const levelCounts: [number, number][] = [];
      for (let i = 0; i < width; i++) {
        if (i !== col) {
          levelCounts.push([i, itemRows.filter((r) => r[i] && r[i]!.length < 40).length]);
        }
      }
      levelCounts.sort((a, b) => b[1] - a[1]);
      const level = levelCounts[0] && levelCounts[0][1] >= 2 ? levelCounts[0][0] : -1;
      const evidence: number[] = [];
      for (let i = 0; i < width; i++) {
        if (i !== col && i !== level && rows.some((r) => (r[i] ?? "").length > 60))
          evidence.push(i);
      }
      best = {
        header: first - 1,
        item: col,
        level,
        evidence: evidence.slice(0, 2),
        manager: -1,
        score: 1,
      };
    }
  }

  const headerRow = best && best.header >= 0 ? rows[best.header] : undefined;
  const width = Math.max(1, ...rows.slice(0, 60).map((r) => r.length));
  const headers = Array.from({ length: width }, (_, i) => headerRow?.[i] || columnLetter(i));
  return best
    ? { sheet: sheet.name, on: true, headers, ...best }
    : {
        sheet: sheet.name,
        on: false,
        headers,
        header: 0,
        item: -1,
        level: -1,
        evidence: [],
        manager: -1,
        score: 0,
      };
}

/** Looks for the consultant's role and grade in the first rows, then in the file name. */
export function detectRoleGrade(
  framework: Framework,
  sheets: Sheet[],
  fileName: string,
): { role: string | null; grade: Grade | null } {
  let role: string | null = null;
  let grade: Grade | null = null;
  const names = framework.roles.map((r) => r.role).sort((a, b) => b.length - a.length);
  for (const s of sheets) {
    for (const row of s.rows.slice(0, 60)) {
      row.forEach((c, i) => {
        if (!c) return;
        const lc = c.toLowerCase();
        if (!role) {
          const hit = names.find((n) => lc.includes(n.toLowerCase()));
          if (hit && (lc.length < 80 || /role|job|title|position/.test(lc))) role = hit;
        }
        if (!grade && /\b(grade|current level|band)\b/.test(lc) && lc.length < 60) {
          const g = parseGrade(
            [c.replace(/grade|level|band/gi, ""), row[i + 1] ?? "", row[i + 2] ?? ""].join(" "),
          );
          if (g) grade = g;
        }
      });
    }
  }
  if (!role) {
    const haystack = `${fileName} ${sheets.map((s) => s.name).join(" ")}`.toLowerCase();
    role = names.find((n) => haystack.includes(n.toLowerCase())) ?? null;
  }
  return { role, grade };
}

/** A short stable hash, so re-importing the same file replaces its evidence rather than adding more. */
export function hashKey(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

export interface ImportRow {
  key: string;
  sheet: string;
  /** Row index on the sheet. */
  r: number;
  raw: string;
  rawLevel: string;
  evidence: string;
  /** "kind|name", or "" to skip. */
  match: string;
  level: ImportLevel | null;
}

export type RowOverride = { match?: string; level?: ImportLevel | null };

export interface ImportDraft {
  file: string;
  tab: string;
  sheets: Sheet[];
  detected: { role: string | null; grade: Grade | null };
  role: string | null;
  grade: Grade | null;
  /** Whether to use the file's role and grade as the consultant's own. */
  setProfile: boolean;
  /** The consultant's corrections, by row key. */
  over: Record<string, RowOverride>;
  tables: SheetTable[];
  rows: ImportRow[];
  skipped: ImportRow[];
}

export function splitMatch(match: string): [MatchKind | "", string] {
  const i = match.indexOf("|");
  return i < 0 ? ["", ""] : [match.slice(0, i) as MatchKind, match.slice(i + 1)];
}

/** Rows that match the framework (or were matched by hand), and rows that will be skipped. */
export function buildRows(
  framework: Framework,
  draft: Pick<ImportDraft, "tables" | "sheets" | "role" | "grade" | "over">,
): { rows: ImportRow[]; skipped: ImportRow[] } {
  const role = findRoleByName(framework, draft.role);
  const rows: ImportRow[] = [];
  const skipped: ImportRow[] = [];
  for (const t of draft.tables) {
    if (!t.on || t.item < 0) continue;
    const sheet = draft.sheets.find((s) => s.name === t.sheet);
    if (!sheet) continue;
    sheet.rows.forEach((row, r) => {
      if (r <= t.header) return;
      const item = row[t.item];
      if (!item || item.length > 160) return;
      const m = matchItem(framework, item, role);
      const rawLevel = t.level >= 0 ? (row[t.level] ?? "") : "";
      const evidence = t.evidence
        .map((i) => row[i])
        .filter(Boolean)
        .join("\n\n");
      if (!m && !evidence && !rawLevel) return;
      const key = `${t.sheet}:${r}`;
      const o = draft.over[key];
      const match = o && "match" in o ? (o.match ?? "") : m ? `${m.kind}|${m.name}` : "";
      const [kind, name] = splitMatch(match);
      const level =
        o && "level" in o
          ? (o.level ?? null)
          : kind
            ? parseLevel(kind, rawLevel, name, role, draft.grade)
            : null;
      const rec: ImportRow = {
        key,
        sheet: t.sheet,
        r,
        raw: item,
        rawLevel,
        evidence,
        match,
        level,
      };
      (m || o?.match ? rows : skipped).push(rec);
    });
  }
  return { rows, skipped };
}

const SELF_TAB = /self[\s-]*assess/i;

/**
 * Starts an import from a workbook. Only the self assessment tab is read: the tab named
 * "Your self assessment…", or the first tab.
 */
export function startImportDraft(
  framework: Framework,
  fileName: string,
  sheets: Sheet[],
  current: { role: string | null; grade: Grade | null },
): ImportDraft {
  const main = sheets.find((s) => SELF_TAB.test(s.name)) ?? sheets[0]!;
  const detected = detectRoleGrade(
    framework,
    [main, ...sheets.filter((s) => s !== main)],
    fileName,
  );
  const roleName = detected.role ?? current.role;
  const role = findRoleByName(framework, roleName);
  const ladder = role ? gradeLadder(role) : [];
  const grade =
    detected.grade && ladder.includes(detected.grade)
      ? detected.grade
      : current.grade && ladder.includes(current.grade)
        ? current.grade
        : (ladder[0] ?? null);
  const table = detectTable(framework, main, role);
  table.on = table.item >= 0;
  const draft: ImportDraft = {
    file: fileName,
    tab: main.name,
    sheets: [main],
    detected,
    role: roleName,
    grade,
    setProfile: !!detected.role || !!detected.grade || !current.role,
    over: {},
    tables: [table],
    rows: [],
    skipped: [],
  };
  return { ...draft, ...buildRows(framework, draft) };
}

/** Turns the matched rows into evidence, one piece per row. Ids are stable per file and row. */
export function importedEvidence(
  draft: ImportDraft,
  today: string,
  now: number = Date.now(),
): Evidence[] {
  return draft.rows
    .filter((r) => r.match)
    .map((r) => {
      const [kind, name] = splitMatch(r.match);
      const level = r.level;
      const isLevel = (l: ImportLevel | null): l is ProficiencyLevel =>
        l !== null && (PROFICIENCY_LEVELS as readonly string[]).includes(l);
      const isBand = (l: ImportLevel | null): l is BehaviourBand =>
        l !== null && (BEHAVIOUR_BANDS as readonly string[]).includes(l);
      return {
        id: `imp${hashKey(`${draft.file}|${r.key}`)}`,
        title: `${name}: from my assessment`,
        date: today,
        text: (r.evidence || "No evidence text in the spreadsheet.").slice(0, 30000),
        files: [draft.file],
        summary: `Imported from sheet "${r.sheet}", row ${r.r + 1}.${r.rawLevel ? ` Self-assessed: ${r.rawLevel}.` : ""}`,
        tags: {
          skills:
            kind === "s" && isLevel(level) ? [{ name, level, why: "From your assessment" }] : [],
          behaviours:
            kind === "b" && isBand(level)
              ? [{ name, band: level, why: "From your assessment" }]
              : [],
          impacts: kind === "i" ? [name] : [],
          consulting: kind === "c" ? [name] : [],
        },
        createdAt: now,
        source: { file: draft.file, sheet: r.sheet, row: r.r },
      };
    });
}
