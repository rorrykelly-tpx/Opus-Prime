// Browser-only file helpers for evidence uploads and certificates.

export const MAX_TEXT_FILE_BYTES = 1024 * 1024;
export const MAX_CERT_FILE_BYTES = 3 * 1024 * 1024;

export function readAsDataURL(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/** Scales an image down to at most 1600px and re-encodes it as JPEG, so it fits in storage. */
export async function shrinkImage(dataUrl: string): Promise<string> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = dataUrl;
  });
  const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.85);
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const [head = "", body = ""] = dataUrl.split(",");
  const type = head.match(/data:([^;]+)/)?.[1] ?? "application/octet-stream";
  const bin = atob(body);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type });
}

export function downloadDataUrl(dataUrl: string, fileName: string) {
  const url = URL.createObjectURL(dataUrlToBlob(dataUrl));
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export interface TextFilesResult {
  text: string;
  files: string[];
  skipped: string[];
}

/** Reads plain-text evidence files (.txt, .md, .csv, .html and similar), skipping anything else. */
export async function readTextFiles(files: File[]): Promise<TextFilesResult> {
  const parts: string[] = [];
  const names: string[] = [];
  const skipped: string[] = [];
  for (const f of files) {
    if (f.size > MAX_TEXT_FILE_BYTES) {
      skipped.push(`${f.name} is over 1 MB`);
      continue;
    }
    let t: string;
    try {
      t = await f.text();
    } catch {
      skipped.push(`${f.name} couldn't be read`);
      continue;
    }
    // Binary files (Word, PDF) decode to control characters, so they're refused.
    const head = t.slice(0, 4000);
    const odd = (head.match(/[\u0000-\u0008\u000E-\u001F\uFFFD]/g) ?? []).length;
    if (head.includes("\u0000") || odd > head.length * 0.02) {
      skipped.push(`${f.name} isn't plain text (save it as .txt or .md)`);
      continue;
    }
    if (/\.html?$/i.test(f.name)) {
      const doc = new DOMParser().parseFromString(t, "text/html");
      t = doc.body?.textContent ?? t;
    }
    if (/\.rtf$/i.test(f.name)) {
      t = t.replace(/\\par[d]?/g, "\n").replace(/\{\*?\\[^{}]+}|[{}]|\\\S+\s?/g, "");
    }
    t = t
      .replace(/\r\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    parts.push(`--- From ${f.name} ---\n${t.slice(0, 20000)}`);
    names.push(f.name);
  }
  return { text: parts.join("\n\n"), files: names, skipped };
}
