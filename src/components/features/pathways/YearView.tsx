"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type DragEvent } from "react";

import { readTextFiles } from "@/lib/pathways/files";
import { formatDate, todayIso } from "@/lib/pathways/framework";
import { emptyTags } from "@/lib/pathways/storage";
import { isSheetFile } from "@/lib/pathways/workbook";
import { cn } from "@/lib/utils";
import type { Evidence, EvidenceTags, Grade, Role } from "@/types/pathways";

import { Loading } from "./Loading";
import { usePathways } from "./PathwaysProvider";
import { TagChips } from "./TagChips";
import { TagEditor } from "./TagEditor";
import { useChosenRole } from "./use-pathway-route";
import { Wave } from "./Wave";

interface Draft {
  id: string | null;
  title: string;
  date: string;
  text: string;
  summary: string;
  files: string[];
  tags: EvidenceTags | null;
  fileError: string;
  createdAt?: number;
}

function emptyDraft(): Draft {
  return {
    id: null,
    title: "",
    date: todayIso(),
    text: "",
    summary: "",
    files: [],
    tags: null,
    fileError: "",
  };
}

export function YearView() {
  const route = useChosenRole();
  if (route.status !== "ok") return <Loading />;
  return <Year role={route.role} grade={route.grade} />;
}

function Year({ role, grade }: { role: Role; grade: Grade }) {
  const { framework, evidence, demo, store } = usePathways();
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [status, setStatus] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const list = [...evidence].sort((x, y) => (y.date || "").localeCompare(x.date || ""));

  const update = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));

  async function addFiles(files: File[]) {
    const sheet = files.find(isSheetFile);
    if (sheet) {
      // An Excel progression assessment goes to the importer, which fills in everything at once.
      store.setPendingImport(sheet);
      router.push("/pathways/import");
      return;
    }
    const result = await readTextFiles(files);
    setDraft((d) => ({
      ...d,
      text: [d.text, result.text].filter(Boolean).join("\n\n"),
      files: [...d.files, ...result.files],
      fileError: result.skipped.length ? `Skipped: ${result.skipped.join("; ")}.` : "",
    }));
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragOver(false);
    void addFiles([...e.dataTransfer.files]);
  }

  function save() {
    if (!draft.title.trim()) {
      setStatus("Add a title before saving.");
      titleRef.current?.focus();
      return;
    }
    const tags = draft.tags ?? emptyTags();
    const e: Evidence = {
      id: draft.id ?? crypto.randomUUID(),
      title: draft.title.trim(),
      date: draft.date || todayIso(),
      text: draft.text.slice(0, 30000),
      summary: draft.summary,
      files: draft.files,
      tags,
      createdAt: draft.createdAt ?? Date.now(),
    };
    if (store.saveEvidence(e)) {
      setDraft(emptyDraft());
      setStatus("");
      store.toast("Saved to my year");
    } else {
      setStatus("Couldn't save. Your browser's storage may be full.");
    }
  }

  function edit(e: Evidence) {
    setDraft({
      id: e.id,
      title: e.title,
      date: e.date,
      text: e.text,
      summary: e.summary,
      files: e.files,
      tags: structuredClone(e.tags),
      fileError: "",
      createdAt: e.createdAt,
    });
    setStatus("");
    titleRef.current?.focus();
  }

  function remove(e: Evidence) {
    if (!window.confirm("Delete this evidence? You can't undo this.")) return;
    store.deleteEvidence(e.id);
    if (draft.id === e.id) setDraft(emptyDraft());
    store.toast("Deleted");
  }

  return (
    <>
      <div className="band lilac pastel">
        <div className="wrap">
          <p className="sub">
            {demo ? "What has Julia done this year?" : "What have you done this year?"}
          </p>
          <h1>{demo ? "Julia's year" : "My year"}</h1>
          <p>
            Describe a piece of work in your own words, or upload notes, reports or feedback as text
            files. Then tag it against your framework.
          </p>
          <p className="small">
            Your evidence is private to you. For now it&apos;s saved in this browser only.
          </p>
          <p>
            <Link className="btn ghost small" href="/pathways/import">
              Import a progression assessment (Excel)
            </Link>
          </p>
        </div>
      </div>
      <Wave />
      <section className="plain">
        <div className="wrap cols">
          <div>
            <div className="panel" id="evform">
              <h2>{draft.id ? "Edit evidence" : "Add evidence"}</h2>
              <label className="f" htmlFor="ev-title">
                Title
              </label>
              <input
                ref={titleRef}
                type="text"
                id="ev-title"
                value={draft.title}
                onChange={(e) => update({ title: e.target.value })}
                placeholder="For example: Ran discovery workshops for a council housing service"
              />
              <label className="f" htmlFor="ev-date">
                When
              </label>
              <input
                type="date"
                id="ev-date"
                value={draft.date}
                onChange={(e) => update({ date: e.target.value })}
                style={{ maxWidth: 220 }}
              />
              <label className="f" htmlFor="ev-text">
                What you did and what changed
              </label>
              <textarea
                id="ev-text"
                value={draft.text}
                onChange={(e) => update({ text: e.target.value })}
                placeholder="What was the situation? What did you do? What was the result? Include feedback you received."
              />
              <div
                className={cn("drop", dragOver && "over")}
                onDragEnter={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
              >
                <label htmlFor="ev-files" className="btn ghost small">
                  Upload text files
                </label>
                <input
                  id="ev-files"
                  type="file"
                  multiple
                  className="vh"
                  accept=".xlsx,.xlsm,.xls,.ods,.txt,.md,.markdown,.csv,.tsv,.json,.html,.htm,.xml,.yaml,.yml,.log,.rtf,text/*"
                  onChange={(e) => {
                    void addFiles([...(e.target.files ?? [])]);
                    e.target.value = "";
                  }}
                />
                <p className="hint">
                  Or drop them here. Text files (.txt, .md, .csv, .json, .html and similar) are
                  added to this evidence. An Excel progression assessment (.xlsx) opens the
                  importer, which fills in everything at once.
                </p>
                {draft.files.length > 0 && (
                  <p className="filelist">Added: {draft.files.join(", ")}</p>
                )}
                {draft.fileError && <p className="err">{draft.fileError}</p>}
              </div>
              <div aria-live="polite" style={{ marginTop: 16 }}>
                {status && <p className="err">{status}</p>}
              </div>
              {draft.tags && (
                <TagEditor
                  framework={framework}
                  role={role}
                  grade={grade}
                  tags={draft.tags}
                  onChange={(tags) => update({ tags })}
                />
              )}
              <div className="row" style={{ marginTop: 20 }}>
                {draft.tags ? (
                  <button type="button" className="btn" onClick={save}>
                    Save to my year
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn"
                    onClick={() => update({ tags: emptyTags() })}
                  >
                    Tag it
                  </button>
                )}
                {(draft.id || draft.title || draft.text) && (
                  <button
                    type="button"
                    className="linkbtn"
                    onClick={() => {
                      setDraft(emptyDraft());
                      setStatus("");
                    }}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
          <div>
            <h2>Logged this year</h2>
            {list.length ? (
              list.map((e) => (
                <div className="ev" key={e.id}>
                  <h3>{e.title}</h3>
                  <p className="small muted" style={{ margin: "0 0 6px" }}>
                    {formatDate(e.date)}
                    {e.files.length ? `. From ${e.files.join(", ")}` : ""}
                  </p>
                  {e.summary && <p className="small">{e.summary}</p>}
                  <TagChips tags={e.tags} />
                  <div className="row small" style={{ marginTop: 8 }}>
                    <button type="button" className="linkbtn" onClick={() => edit(e)}>
                      Edit<span className="vh"> {e.title}</span>
                    </button>
                    <button type="button" className="linkbtn" onClick={() => remove(e)}>
                      Delete<span className="vh"> {e.title}</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p>
                Nothing yet. Start with something recent: a workshop you ran, a problem you solved,
                feedback you got.
              </p>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
