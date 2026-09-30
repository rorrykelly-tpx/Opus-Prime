"use client";

import { useRef, useState } from "react";

import { findRoleByName, plural } from "@/lib/pathways/framework";
import {
  applyFrameworkTabs,
  FRAMEWORK_TABS,
  frameworkTabKind,
  type FrameworkTabKind,
} from "@/lib/pathways/framework-import";
import { frameworkOverrideSchema } from "@/lib/pathways/schemas";
import { parseCSV } from "@/lib/pathways/spreadsheet";
import { loadFrameworkOverride } from "@/lib/pathways/storage";
import {
  fetchSheetTab,
  isSheetFile,
  parseSheetLink,
  readWorkbook,
  SheetFetchError,
  sheetDownloadUrl,
} from "@/lib/pathways/workbook";

import { Loading, Spinner } from "./Loading";
import { usePathways } from "./PathwaysProvider";

type Tabs = Partial<Record<FrameworkTabKind, string[][]>>;

type Message =
  | { kind: "busy"; text: string }
  | { kind: "error"; text: string }
  | { kind: "ok"; text: string; warning?: string }
  | { kind: "download"; ids: string[]; isPrivate: boolean };

export function DataView() {
  const { ready } = usePathways();
  return ready ? <Data /> : <Loading />;
}

function Data() {
  const { framework, builtinFramework, profile, store } = usePathways();
  const [message, setMessage] = useState<Message | null>(null);
  const [links, setLinks] = useState("");
  const filesRef = useRef<HTMLInputElement>(null);

  function apply(tabs: Tabs) {
    const result = applyFrameworkTabs(tabs, loadFrameworkOverride() ?? {}, builtinFramework.skills);
    if (!result.ok) {
      setMessage({ kind: "error", text: result.error });
      return;
    }
    const parsed = frameworkOverrideSchema.safeParse(result.override);
    if (!parsed.success || !store.saveFrameworkOverride(parsed.data)) {
      setMessage({
        kind: "error",
        text: "We couldn't use those files. Check they're the framework workbooks, then try again.",
      });
      return;
    }
    // A role that isn't in the new framework can't be shown, so ask the consultant to choose again.
    const roles = parsed.data.roles ?? builtinFramework.roles;
    if (profile.role && !findRoleByName({ ...builtinFramework, roles }, profile.role)) {
      store.updateProfile((p) => ({ ...p, role: null, grade: null }));
    }
    const missing = result.missing;
    setMessage({
      kind: "ok",
      text: `Loaded ${result.loaded.join(", ")}.`,
      warning: missing.length
        ? `${missing.length} skill ${plural(missing.length, "name")} in "Skills by role" ${missing.length === 1 ? "has" : "have"} no definition: ${missing.slice(0, 5).join(", ")}.`
        : undefined,
    });
  }

  async function applyFiles() {
    const files = [...(filesRef.current?.files ?? [])];
    if (!files.length) {
      setMessage({ kind: "error", text: "Choose at least one framework file first." });
      return;
    }
    setMessage({ kind: "busy", text: "Reading files…" });
    const tabs: Tabs = {};
    try {
      for (const f of files) {
        if (isSheetFile(f)) {
          for (const s of await readWorkbook(f)) {
            const k = frameworkTabKind(s.name, s.rows);
            if (k && !tabs[k]) tabs[k] = s.rows;
          }
        } else {
          const rows = parseCSV(await f.text());
          const k = frameworkTabKind(f.name.replace(/\.csv$/i, "").replace(/^.*-\s*/, ""), rows);
          if (k) tabs[k] = rows;
        }
      }
    } catch {
      setMessage({
        kind: "error",
        text: "We couldn't read one of those files. Check it opens in Excel, then try again.",
      });
      return;
    }
    apply(tabs);
  }

  async function applySheets() {
    const found = links
      .split(/\s+/)
      .map(parseSheetLink)
      .filter((l) => l !== null);
    if (!found.length) {
      setMessage({
        kind: "error",
        text: "Add at least one Google Sheets link. It should start https://docs.google.com/spreadsheets/d/",
      });
      return;
    }
    setMessage({ kind: "busy", text: "Opening your sheets…" });
    const tabs: Tabs = {};
    let isPrivate = false;
    for (const l of found) {
      for (const tab of FRAMEWORK_TABS) {
        try {
          const rows = await fetchSheetTab(l.id, { sheet: tab });
          const k = frameworkTabKind("", rows);
          if (k && !tabs[k]) tabs[k] = rows;
        } catch (e) {
          if (e instanceof SheetFetchError && e.isPrivate) isPrivate = true;
          break;
        }
      }
    }
    if (Object.keys(tabs).length) apply(tabs);
    else setMessage({ kind: "download", ids: found.map((l) => l.id), isPrivate });
  }

  function reset() {
    store.resetFramework();
    setMessage({ kind: "ok", text: "Back to the built-in framework." });
  }

  const skills = framework.skills.length;
  return (
    <section className="plain">
      <div className="wrap">
        <h1>Framework data</h1>
        <p className="sub">
          {framework.overridden
            ? "You're previewing framework files you uploaded."
            : "Using the built-in framework."}
        </p>
        <p>
          Source: {builtinFramework.version}. {framework.roles.length} roles, {skills} skill
          definitions, {framework.behaviours.length} behaviours, {framework.impacts.length} impacts,{" "}
          {framework.consultingPillars.length} consulting pillars.
        </p>
        <div className="panel">
          <h3>Update from the framework spreadsheets</h3>
          <p>
            Upload the framework workbooks as they are: &quot;Progression Framework - DT billable
            skills&quot; and &quot;Progression Framework - behaviours and impact matrix&quot;. We
            read the tabs &quot;Skills by role&quot;, &quot;Skill definitions&quot;,
            &quot;Behaviours&quot; and &quot;Impact&quot; and rebuild every role, module, level and
            quiz from them. You can upload one workbook or both, as Excel files or as CSV exports of
            those tabs.
          </p>
          <div className="cols" style={{ gap: 28 }}>
            <div>
              <label className="f" htmlFor="fw-files">
                Framework files (.xlsx or .csv)
              </label>
              <input
                ref={filesRef}
                type="file"
                id="fw-files"
                multiple
                accept=".xlsx,.xlsm,.xls,.ods,.csv,text/csv"
              />
              <div className="row" style={{ marginTop: 12 }}>
                <button type="button" className="btn" onClick={() => void applyFiles()}>
                  Preview with these files
                </button>
                {framework.overridden && (
                  <button type="button" className="btn ghost" onClick={reset}>
                    Go back to built-in data
                  </button>
                )}
              </div>
            </div>
            <div>
              <label className="f" htmlFor="fw-gs">
                Or Google Sheets links, one per line
              </label>
              <textarea
                id="fw-gs"
                style={{ minHeight: 84 }}
                placeholder="https://docs.google.com/spreadsheets/d/…"
                value={links}
                onChange={(e) => setLinks(e.target.value)}
                aria-describedby="fw-gs-hint"
              />
              <p className="hint" id="fw-gs-hint">
                Sheets need to be shared so that anyone with the link can view them.
              </p>
              <button
                type="button"
                className="btn ghost"
                style={{ marginTop: 6 }}
                onClick={() => void applySheets()}
              >
                Use these sheets
              </button>
            </div>
          </div>
          <div aria-live="polite" style={{ marginTop: 14 }}>
            {message?.kind === "busy" && (
              <p>
                <Spinner /> {message.text}
              </p>
            )}
            {message?.kind === "error" && <p className="err">{message.text}</p>}
            {message?.kind === "ok" && (
              <p>
                {message.text} {message.warning && <span className="err">{message.warning}</span>}
              </p>
            )}
            {message?.kind === "download" && (
              <div className="panel pastel sky">
                <h3>Download them instead</h3>
                <p className="small">
                  {message.isPrivate
                    ? "These sheets aren't public. In Google Sheets choose Share, then under General access choose Anyone with the link."
                    : "This page couldn't open the Google Sheets by itself."}{" "}
                  Download each sheet as Excel, then choose the files on the left.
                </p>
                <div className="row">
                  {message.ids.map((id, n) => (
                    <a
                      key={id}
                      className="btn small"
                      href={sheetDownloadUrl(id)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Download sheet {n + 1} as Excel
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <p className="note">
          Uploaded framework data only changes what you see in this browser. Everyone else keeps
          seeing the built-in framework until it&apos;s updated in the app.
        </p>
      </div>
    </section>
  );
}
