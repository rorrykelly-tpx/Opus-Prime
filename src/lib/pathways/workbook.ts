import type { Sheet } from "./spreadsheet";
import { parseCSV } from "./spreadsheet";

// Browser-only: reading spreadsheets the consultant chooses.

export const isSheetFile = (file: { name: string }) => /\.(xlsx|xlsm|xls|ods)$/i.test(file.name);

/** Every non-empty tab of an Excel or OpenDocument workbook, as rows of trimmed strings. */
export async function readWorkbook(file: File): Promise<Sheet[]> {
  // SheetJS is large, so it's only loaded when someone imports a spreadsheet.
  const XLSX = await import("xlsx");
  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
  return workbook.SheetNames.map((name) => {
    const sheet = workbook.Sheets[name];
    const rows = sheet
      ? XLSX.utils.sheet_to_json<unknown[]>(sheet, {
          header: 1,
          defval: "",
          raw: false,
          blankrows: true,
        })
      : [];
    return { name, rows: rows.map((r) => r.map((v) => String(v ?? "").trim())) };
  }).filter((s) => s.rows.some((r) => r.some(Boolean)));
}

export interface SheetLink {
  id: string;
  gid: string | null;
}

export function parseSheetLink(url: string): SheetLink | null {
  const m = String(url || "").match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]{20,})/);
  if (!m) return null;
  const g = String(url).match(/[#&?]gid=(\d+)/);
  return { id: m[1]!, gid: g ? g[1]! : null };
}

export function sheetDownloadUrl(id: string): string {
  return `https://docs.google.com/spreadsheets/d/${encodeURIComponent(id)}/export?format=xlsx`;
}

export class SheetFetchError extends Error {
  constructor(
    message: string,
    /** True when the sheet exists but isn't shared publicly. */
    readonly isPrivate: boolean,
  ) {
    super(message);
    this.name = "SheetFetchError";
  }
}

/**
 * Reads one tab of a public Google Sheet as CSV. When the sheet is private, or the browser can't
 * reach Google, callers fall back to asking for a download or a paste.
 */
export async function fetchSheetTab(
  id: string,
  { gid, sheet }: { gid?: string | null; sheet?: string } = {},
): Promise<string[][]> {
  const which = gid ? `&gid=${gid}` : sheet ? `&sheet=${encodeURIComponent(sheet)}` : "";
  const url = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(id)}/gviz/tq?tqx=out:csv&headers=0${which}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(url, { signal: ctrl.signal, credentials: "omit" });
    if (!res.ok)
      throw new SheetFetchError(`HTTP ${res.status}`, res.status === 401 || res.status === 403);
    const text = await res.text();
    // A private sheet answers with a sign-in page rather than CSV.
    if (/^\s*</.test(text)) throw new SheetFetchError("private", true);
    return parseCSV(text);
  } finally {
    clearTimeout(timer);
  }
}

/** Cells pasted from Google Sheets or Excel: an HTML table if there is one, else tab-separated text. */
export function parsePasted(html: string, text: string): string[][] {
  if (html && /<table/i.test(html)) {
    const doc = new DOMParser().parseFromString(html.replace(/<br\s*\/?>/gi, "\n"), "text/html");
    return [...doc.querySelectorAll("tr")].map((tr) =>
      [...tr.children].flatMap((td) => {
        const value = (td.textContent ?? "").trim();
        const span = Math.min(Number(td.getAttribute("colspan")) || 1, 30);
        return [value, ...Array<string>(span - 1).fill("")];
      }),
    );
  }
  return parseCSV(text || "", "\t");
}
