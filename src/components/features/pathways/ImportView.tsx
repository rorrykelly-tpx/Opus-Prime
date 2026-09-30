"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ClipboardEvent, type DragEvent } from "react";

import {
  bandLabel,
  BEHAVIOUR_BANDS,
  findRoleByName,
  findSkill,
  gradeLabel,
  gradeLadder,
  pathwayHref,
  plural,
  PROFICIENCY_LEVELS,
  todayIso,
} from "@/lib/pathways/framework";
import {
  buildRows,
  candidates,
  importedEvidence,
  parseLevel,
  splitMatch,
  startImportDraft,
  type ImportDraft,
  type ImportLevel,
  type ImportRow,
  type Sheet,
} from "@/lib/pathways/spreadsheet";
import {
  fetchSheetTab,
  isSheetFile,
  parsePasted,
  parseSheetLink,
  readWorkbook,
  SheetFetchError,
  sheetDownloadUrl,
} from "@/lib/pathways/workbook";
import { cn } from "@/lib/utils";
import type { Framework, Grade, Role } from "@/types/pathways";

import { Loading, Spinner } from "./Loading";
import { usePathways } from "./PathwaysProvider";
import { Wave } from "./Wave";

type Step =
  | { step: "start"; error?: string }
  | { step: "loading"; file: string }
  | { step: "review"; draft: ImportDraft; status: string; busy: boolean }
  | { step: "done"; file: string; count: number };

interface SheetLinkState {
  url: string;
  id?: string;
  status: "idle" | "loading" | "blocked";
  error: string;
}

export function ImportView() {
  const { ready } = usePathways();
  return ready ? <Import /> : <Loading />;
}

function Import() {
  const { framework, profile, store } = usePathways();
  // A spreadsheet dropped on My year arrives here to be read.
  const [state, setState] = useState<Step>(() => {
    const pending = store.peekPendingImport();
    return pending ? { step: "loading", file: pending.name } : { step: "start" };
  });
  const [link, setLink] = useState<SheetLinkState>({ url: "", status: "idle", error: "" });

  function begin(fileName: string, sheets: Sheet[]) {
    const draft = startImportDraft(framework, fileName, sheets, {
      role: profile.role,
      grade: profile.grade,
    });
    setState({ step: "review", draft, status: "", busy: false });
  }

  async function openFile(file: File) {
    setState({ step: "loading", file: file.name });
    try {
      const sheets = await readWorkbook(file);
      if (!sheets.length) throw new Error("empty");
      begin(file.name, sheets);
    } catch {
      setState({
        step: "start",
        error: "We couldn't read that file. Check it opens in Excel, then try again.",
      });
    }
  }

  useEffect(() => {
    const file = store.takePendingImport();
    if (!file) return;
    readWorkbook(file)
      .then((sheets) => {
        if (!sheets.length) throw new Error("empty");
        begin(file.name, sheets);
      })
      .catch(() =>
        setState({
          step: "start",
          error: "We couldn't read that file. Check it opens in Excel, then try again.",
        }),
      );
    // Runs once for the file handed over on arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function openSheetLink() {
    const parsed = parseSheetLink(link.url.trim());
    if (!parsed) {
      setLink({
        ...link,
        status: "idle",
        error:
          "That doesn't look like a Google Sheets link. It should start https://docs.google.com/spreadsheets/d/",
      });
      return;
    }
    setLink({ ...link, id: parsed.id, status: "loading", error: "" });
    try {
      const rows = await fetchSheetTab(parsed.id, { gid: parsed.gid });
      setLink({ ...link, id: parsed.id, status: "idle", error: "" });
      begin("your Google Sheet", [{ name: "Your self assessment", rows }]);
    } catch (e) {
      setLink({
        ...link,
        id: parsed.id,
        status: "blocked",
        error:
          e instanceof SheetFetchError && e.isPrivate
            ? "This sheet isn't public. In Google Sheets choose Share, then under General access choose Anyone with the link."
            : "",
      });
    }
  }

  function importPasted(rows: string[][]) {
    const clean = rows.filter((r) => r.some((c) => String(c).trim()));
    if (clean.length < 2) {
      store.toast("Nothing to import. Copy the cells from the sheet, then paste them.");
      return;
    }
    begin("your Google Sheet (pasted)", [
      {
        name: "Your self assessment",
        rows: clean.map((r) => r.map((c) => String(c ?? "").trim())),
      },
    ]);
  }

  const head = (
    <>
      <div className="band mint pastel">
        <div className="wrap">
          <p className="sub">Import a progression assessment</p>
          <h1>Bring in your self assessment</h1>
          <p>
            Upload the Excel file you use for your progression assessment, or link to it in Google
            Sheets. We read the &quot;Your self assessment&quot; tab, work out the columns
            ourselves, and bring in each skill, behaviour and impact you&apos;ve assessed. Your
            pathway, modules, My year and Where am I? all update from this one file.
          </p>
        </div>
      </div>
      <Wave />
    </>
  );

  if (state.step === "loading") {
    return (
      <>
        {head}
        <section className="plain">
          <div className="wrap">
            <p role="status">
              <Spinner /> Reading {state.file}…
            </p>
          </div>
        </section>
      </>
    );
  }

  if (state.step === "done") {
    const { role, grade } = profile;
    return (
      <>
        {head}
        <section className="plain">
          <div className="wrap">
            <h2>
              Imported {state.count} {plural(state.count, "item")}
            </h2>
            <p>
              From {state.file}. Your pathway, modules and level now include your self assessment.
            </p>
            <div className="row">
              {role && grade && (
                <Link className="btn" href={pathwayHref(role, grade)}>
                  See my progress
                </Link>
              )}
              <Link className="btn ghost" href="/pathways/level">
                Where am I?
              </Link>
              <Link className="btn ghost" href="/pathways/year">
                Review in My year
              </Link>
              <button type="button" className="linkbtn" onClick={() => setState({ step: "start" })}>
                Import another file
              </button>
            </div>
          </div>
        </section>
      </>
    );
  }

  if (state.step === "review") {
    return (
      <>
        {head}
        <Review
          state={state}
          onChange={(draft) => setState({ ...state, draft })}
          onDone={(count) => setState({ step: "done", file: state.draft.file, count })}
          onBusy={(busy, status) => setState({ ...state, busy, status })}
          onCancel={() => setState({ step: "start" })}
        />
      </>
    );
  }

  return (
    <>
      {head}
      <section className="plain">
        <div className="wrap">
          {state.error && <p className="err">{state.error}</p>}
          <div className="cols">
            <div>
              <FilePicker onFile={(f) => void openFile(f)} />
            </div>
            <div>
              <SheetLinkPanel
                link={link}
                setLink={setLink}
                onUse={() => void openSheetLink()}
                onPaste={importPasted}
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function FilePicker({ onFile }: { onFile: (file: File) => void }) {
  const { store } = usePathways();
  const [over, setOver] = useState(false);

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setOver(false);
    const file = [...e.dataTransfer.files].find(isSheetFile);
    if (file) onFile(file);
    else store.toast("Choose an Excel file (.xlsx, .xls or .ods).");
  }

  return (
    <div
      className={cn("drop", over && "over")}
      onDragEnter={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop}
    >
      <label htmlFor="imp-file" className="btn small">
        Choose an Excel file
      </label>
      <input
        id="imp-file"
        type="file"
        className="vh"
        accept=".xlsx,.xlsm,.xls,.ods"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = "";
        }}
      />
      <p className="hint">.xlsx, .xlsm, .xls or .ods. Or drop it here.</p>
    </div>
  );
}

function SheetLinkPanel({
  link,
  setLink,
  onUse,
  onPaste,
}: {
  link: SheetLinkState;
  setLink: (l: SheetLinkState) => void;
  onUse: () => void;
  onPaste: (rows: string[][]) => void;
}) {
  const pasted = useRef<string[][] | null>(null);
  const [pasteText, setPasteText] = useState("");

  function onPasteCells(e: ClipboardEvent<HTMLTextAreaElement>) {
    const html = e.clipboardData.getData("text/html");
    if (html && /<table/i.test(html)) {
      e.preventDefault();
      const rows = parsePasted(html, "");
      pasted.current = rows;
      setPasteText(
        `Pasted ${rows.length} rows from Google Sheets. Choose "Use pasted cells" to continue.`,
      );
    }
  }

  return (
    <div className="panel">
      <h3>Or use a Google Sheet</h3>
      <p className="small">
        Paste the link to your assessment. The sheet needs to be shared so that anyone with the link
        can view it.
      </p>
      <label className="f" htmlFor="gs-url" style={{ marginTop: 0 }}>
        Google Sheets link
      </label>
      <div className="row">
        <input
          type="text"
          id="gs-url"
          value={link.url}
          onChange={(e) => setLink({ ...link, url: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onUse();
            }
          }}
          placeholder="https://docs.google.com/spreadsheets/d/…"
          style={{ flex: 1, minWidth: 240 }}
          inputMode="url"
          aria-describedby="gs-err"
        />
        <button type="button" className="btn" onClick={onUse} disabled={link.status === "loading"}>
          {link.status === "loading" ? (
            <>
              <Spinner /> Opening
            </>
          ) : (
            "Use this sheet"
          )}
        </button>
      </div>
      <p id="gs-err" className="err" aria-live="polite">
        {link.error}
      </p>
      {link.status === "blocked" && link.id && (
        <div className="panel pastel sky" style={{ margin: "10px 0 0" }}>
          <h3>Two quick ways to bring it in</h3>
          <p className="small">
            This page couldn&apos;t open the Google Sheet by itself, so use one of these.
          </p>
          <ol className="next">
            <li>
              <strong>Download it as Excel</strong>, then drop the file into the box on the left.
              <br />
              <a
                className="btn small"
                style={{ marginTop: 8 }}
                href={sheetDownloadUrl(link.id)}
                target="_blank"
                rel="noopener noreferrer"
              >
                Download the sheet as Excel
              </a>
            </li>
            <li>
              <strong>Or copy and paste.</strong> In the sheet, open the self assessment tab, select
              everything (Ctrl+A, or Cmd+A on a Mac) and copy it. Then paste it here.
              <label className="vh" htmlFor="gs-paste">
                Paste your self assessment cells
              </label>
              <textarea
                id="gs-paste"
                style={{ minHeight: 90, marginTop: 8 }}
                placeholder="Paste your cells here"
                value={pasteText}
                onPaste={onPasteCells}
                onChange={(e) => {
                  pasted.current = null;
                  setPasteText(e.target.value);
                }}
              />
              <button
                type="button"
                className="btn small"
                style={{ marginTop: 8 }}
                onClick={() => onPaste(pasted.current ?? parsePasted("", pasteText))}
              >
                Use pasted cells
              </button>
            </li>
          </ol>
        </div>
      )}
    </div>
  );
}

function colName(headers: string[], i: number) {
  return i >= 0 ? `"${headers[i]}"` : null;
}

interface ReviewProps {
  state: Extract<Step, { step: "review" }>;
  onChange: (draft: ImportDraft) => void;
  onDone: (count: number) => void;
  onBusy: (busy: boolean, status: string) => void;
  onCancel: () => void;
}

function Review({ state, onChange, onDone, onBusy, onCancel }: ReviewProps) {
  const { framework, profile, store } = usePathways();
  const { draft } = state;
  const role = findRoleByName(framework, draft.role);
  const ladder = role ? gradeLadder(role) : [];
  const table = draft.tables[0];
  const mapped = draft.rows.filter((r) => r.match);
  const count = (k: string) => mapped.filter((r) => r.match.startsWith(`${k}|`)).length;
  const used =
    table && table.on
      ? [
          colName(table.headers, table.item) &&
            `framework items from ${colName(table.headers, table.item)}`,
          colName(table.headers, table.level) &&
            `levels from ${colName(table.headers, table.level)}`,
          table.evidence.length > 0 &&
            `evidence from ${table.evidence.map((x) => colName(table.headers, x)).join(" and ")}`,
        ].filter(Boolean)
      : [];

  function rebuild(patch: Partial<ImportDraft>) {
    const next = { ...draft, ...patch };
    onChange({ ...next, ...buildRows(framework, next) });
  }

  function setRole(name: string) {
    const r = findRoleByName(framework, name || null);
    let grade = draft.grade;
    if (r && (!grade || !gradeLadder(r).includes(grade))) {
      grade =
        profile.grade && gradeLadder(r).includes(profile.grade)
          ? profile.grade
          : (r.grades[0] ?? null);
    }
    // Craft skill matches belong to the old role.
    const over = Object.fromEntries(
      Object.entries(draft.over).filter(([, o]) => !o.match?.startsWith("s|")),
    );
    rebuild({ role: name || null, grade, over, setProfile: true });
  }

  function setMatch(row: ImportRow, match: string) {
    const [kind, name] = splitMatch(match);
    const level = kind ? parseLevel(kind, row.rawLevel, name, role, draft.grade) : null;
    rebuild({ over: { ...draft.over, [row.key]: { match, level } } });
  }

  function setLevel(row: ImportRow, level: string) {
    const current = draft.over[row.key] ?? { match: row.match };
    rebuild({
      over: {
        ...draft.over,
        [row.key]: { ...current, level: (level || null) as ImportLevel | null },
      },
    });
  }

  function doImport() {
    if (!role || !draft.grade) return;
    onBusy(true, "Importing…");
    if (draft.setProfile || !profile.role) {
      const grade = draft.grade;
      store.updateProfile((p) => ({ ...p, role: role.role, grade, plan: null }));
    }
    let failed = 0;
    for (const e of importedEvidence(draft, todayIso())) {
      if (!store.saveEvidence(e)) failed++;
    }
    if (failed) {
      store.toast(
        `${failed} ${plural(failed, "item")} couldn't be saved. Import the file again to retry.`,
      );
    }
    onDone(mapped.length - failed);
  }

  return (
    <section className="plain">
      <div className="wrap">
        <div className="panel pastel lilac">
          <h3>Your details</h3>
          <p className="small" style={{ marginTop: -6 }}>
            From the &quot;{draft.tab}&quot; tab of {draft.file}
          </p>
          <div className="found">
            <div>
              <label className="f" htmlFor="imp-role" style={{ marginTop: 0 }}>
                Role
              </label>
              <RoleSelect framework={framework} value={draft.role} onChange={setRole} />
            </div>
            <div>
              <label className="f" htmlFor="imp-grade" style={{ marginTop: 0 }}>
                Grade
              </label>
              <select
                id="imp-grade"
                value={draft.grade ?? ""}
                onChange={(e) => rebuild({ grade: e.target.value as Grade, setProfile: true })}
              >
                {ladder.map((g) => (
                  <option key={g} value={g}>
                    {gradeLabel(g)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="small" style={{ marginTop: 10 }}>
            {draft.detected.role || draft.detected.grade
              ? `Found in the file: ${[draft.detected.role, draft.detected.grade && gradeLabel(draft.detected.grade)].filter(Boolean).join(", ")}.`
              : "We couldn't find a role or grade in the file, so check these."}
          </p>
          <label className="chk">
            <input
              type="checkbox"
              checked={draft.setProfile}
              onChange={(e) => onChange({ ...draft, setProfile: e.target.checked })}
            />{" "}
            Use this as my role and grade
          </label>
        </div>

        <h2>Your self assessment</h2>
        <p>
          {mapped.length
            ? `We found ${mapped.length} assessed ${plural(mapped.length, "item")}: ${count("s")} craft ${plural(count("s"), "skill")}, ${count("b")} ${plural(count("b"), "behaviour")}${count("i") ? `, ${count("i")} ${plural(count("i"), "impact")}` : ""}${count("c") ? `, ${count("c")} consulting` : ""}.`
            : "We didn't find any framework items on this tab."}{" "}
          {used.length > 0 && <span className="muted small">We took {used.join(", ")}.</span>}
        </p>
        {mapped.length > 0 && (
          <RowTable
            rows={mapped}
            framework={framework}
            role={role}
            onMatch={setMatch}
            onLevel={setLevel}
          />
        )}
        {draft.skipped.length > 0 && (
          <details style={{ marginTop: 14 }}>
            <summary className="small">
              {draft.skipped.length} {plural(draft.skipped.length, "row")}{" "}
              {draft.skipped.length === 1 ? "doesn't" : "don't"} match the framework and won&apos;t
              be imported
            </summary>
            <RowTable
              rows={draft.skipped}
              framework={framework}
              role={role}
              onMatch={setMatch}
              onLevel={setLevel}
            />
          </details>
        )}
        <div aria-live="polite" style={{ marginTop: 14 }}>
          {state.status && (
            <p>
              {state.busy && <Spinner />} {state.status}
            </p>
          )}
        </div>
        <div className="row" style={{ marginTop: 10 }}>
          <button
            type="button"
            className="btn"
            onClick={doImport}
            disabled={!role || !mapped.length || state.busy}
          >
            Import {mapped.length} {plural(mapped.length, "item")}
          </button>
          <button type="button" className="linkbtn" onClick={onCancel}>
            Cancel
          </button>
        </div>
        {!role && <p className="err">Choose your role to match the craft skills.</p>}
      </div>
    </section>
  );
}

function RoleSelect({
  framework,
  value,
  onChange,
}: {
  framework: Framework;
  value: string | null;
  onChange: (role: string) => void;
}) {
  const capabilities = [...new Set(framework.roles.map((r) => r.capability))];
  return (
    <select id="imp-role" value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
      <option value="">Choose your role</option>
      {capabilities.map((c) => (
        <optgroup key={c} label={c}>
          {framework.roles
            .filter((r) => r.capability === c)
            .map((r) => (
              <option key={r.role}>{r.role}</option>
            ))}
        </optgroup>
      ))}
    </select>
  );
}

function RowTable({
  rows,
  framework,
  role,
  onMatch,
  onLevel,
}: {
  rows: ImportRow[];
  framework: Framework;
  role: Role | null;
  onMatch: (row: ImportRow, match: string) => void;
  onLevel: (row: ImportRow, level: string) => void;
}) {
  const all = candidates(framework, role);
  const groups: [string, string][] = [
    ["s", "Craft skills"],
    ["b", "Behaviours"],
    ["i", "Impact"],
    ["c", "Consulting core"],
  ];
  return (
    <div className="tbl">
      <table className="imp-table">
        <thead>
          <tr>
            <th scope="col">In your spreadsheet</th>
            <th scope="col">Maps to</th>
            <th scope="col">Level</th>
            <th scope="col">Evidence</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const [kind, name] = splitMatch(r.match);
            const skill = kind === "s" ? findSkill(framework, name) : null;
            return (
              <tr key={r.key}>
                <td>
                  <span className="raw">{r.raw}</span>
                  {r.rawLevel && (
                    <>
                      <br />
                      <span className="small muted">Rated: {r.rawLevel}</span>
                    </>
                  )}
                </td>
                <td>
                  <select
                    value={r.match}
                    onChange={(e) => onMatch(r, e.target.value)}
                    aria-label={`Framework item for ${r.raw}`}
                  >
                    <option value="">Skip this row</option>
                    {groups.map(([k, label]) => (
                      <optgroup key={k} label={label}>
                        {all
                          .filter((x) => x.kind === k)
                          .map((x) => (
                            <option key={x.name} value={`${k}|${x.name}`}>
                              {x.name}
                            </option>
                          ))}
                      </optgroup>
                    ))}
                  </select>
                </td>
                <td>
                  {kind === "s" && (
                    <select
                      value={r.level ?? ""}
                      onChange={(e) => onLevel(r, e.target.value)}
                      aria-label={`Level for ${r.raw}`}
                    >
                      <option value="">No level</option>
                      {PROFICIENCY_LEVELS.filter(
                        (l) => !skill || skill.levels[l].length > 0 || l === r.level,
                      ).map((l) => (
                        <option key={l}>{l}</option>
                      ))}
                    </select>
                  )}
                  {kind === "b" && (
                    <select
                      value={r.level ?? ""}
                      onChange={(e) => onLevel(r, e.target.value)}
                      aria-label={`Grade band for ${r.raw}`}
                    >
                      <option value="">No level</option>
                      {BEHAVIOUR_BANDS.map((b) => (
                        <option key={b} value={b}>
                          {bandLabel(b)}
                        </option>
                      ))}
                    </select>
                  )}
                  {(kind === "i" || kind === "c") && (
                    <span className="muted small">Not needed</span>
                  )}
                </td>
                <td className="snip">
                  {r.evidence ? (
                    `${r.evidence.slice(0, 140)}${r.evidence.length > 140 ? "…" : ""}`
                  ) : (
                    <span className="small">None</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
