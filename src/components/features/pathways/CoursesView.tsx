"use client";

import Link from "next/link";
import { useRef, useState } from "react";

import {
  downloadDataUrl,
  MAX_CERT_FILE_BYTES,
  readAsDataURL,
  shrinkImage,
} from "@/lib/pathways/files";
import { formatDate, moduleHref, pathwayHref, todayIso } from "@/lib/pathways/framework";
import {
  CONSULTING_TOPIC,
  coursesFor,
  isKnowledgeGap,
  knowledgeLabel,
  knowledgeOf,
  roleTopics,
  topicFor,
  topicName,
} from "@/lib/pathways/knowledge";
import type { Certificate, Grade, Role } from "@/types/pathways";

import { CourseList } from "./CourseList";
import { Loading } from "./Loading";
import { usePathways } from "./PathwaysProvider";
import { useChosenRole } from "./use-pathway-route";
import { Wave } from "./Wave";

export function CoursesView({ topic }: { topic?: string }) {
  const route = useChosenRole();
  if (route.status !== "ok") return <Loading />;
  return <Courses role={route.role} grade={route.grade} preselect={topic} />;
}

/** Where to take a topic's subject quiz: the first module in the role that uses it. */
function quizHref(
  framework: ReturnType<typeof usePathways>["framework"],
  topic: string,
  role: Role,
  grade: Grade,
) {
  if (topic === CONSULTING_TOPIC) {
    const first = framework.consultingPillars[0]?.modules[0];
    return first ? moduleHref(role.role, grade, first.name) : pathwayHref(role.role, grade);
  }
  const skill = role.skills.find((s) => topicFor("skill", s.name) === topic);
  return skill ? moduleHref(role.role, grade, skill.name) : pathwayHref(role.role, grade);
}

function Courses({ role, grade, preselect }: { role: Role; grade: Grade; preselect?: string }) {
  const { framework, knowledge, profile, certs, demo } = usePathways();
  const topics = roleTopics(role);
  const gaps = new Set(topics.filter((t) => isKnowledgeGap(knowledgeOf(t, profile, certs))));
  const completed = new Set(certs.map((c) => c.title.toLowerCase()));
  const order = [...topics].sort((a, b) => Number(gaps.has(b)) - Number(gaps.has(a)));
  const known = (t: string | undefined) => !!t && knowledge.topics.some((x) => x.id === t);
  const defaultTopic = known(preselect)
    ? preselect!
    : (order.find((t) => gaps.has(t)) ?? topics[0] ?? "");

  return (
    <>
      <div className="band pink pastel">
        <div className="wrap">
          <p className="sub">{demo ? "Julia's courses" : "Courses and certificates"}</p>
          <h1>Fill your knowledge gaps</h1>
          <p>
            Each topic below links to the skills in your role. Take the subject quiz to check what
            you know. We suggest courses where you score under 60% or haven&apos;t been tested, and
            you can upload certificates when you finish them.
          </p>
        </div>
      </div>
      <Wave />
      <section className="plain">
        <div className="wrap">
          <h2>Your knowledge base</h2>
          <div className="tbl">
            <table>
              <thead>
                <tr>
                  <th scope="col">Topic</th>
                  <th scope="col">Knowledge</th>
                  <th scope="col">Status</th>
                  <th scope="col">
                    <span className="vh">Subject quiz</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {order.map((t) => {
                  const k = knowledgeOf(t, profile, certs);
                  const pct = k.cert ? 100 : Math.round((k.score ?? 0) * 100);
                  return (
                    <tr key={t}>
                      <th scope="row">{topicName(knowledge, t)}</th>
                      <td style={{ minWidth: 160 }}>
                        <div className="bar" aria-hidden="true">
                          <b style={{ width: `${pct}%` }} />
                        </div>
                        <span className="small">{knowledgeLabel(k)}</span>
                      </td>
                      <td>
                        {gaps.has(t) ? (
                          <span className="rate rate-partial">Gap: courses suggested</span>
                        ) : (
                          <span className="rate rate-met">Good</span>
                        )}
                      </td>
                      <td>
                        <Link href={quizHref(framework, t, role, grade)}>
                          Take the quiz<span className="vh">: {topicName(knowledge, t)}</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <h2 style={{ marginTop: 36 }}>Suggested courses</h2>
          <div className="course-grid">
            {order.map((t) => (
              <div key={t} className={gaps.has(t) ? "panel pastel sky" : "panel"}>
                <h3>{topicName(knowledge, t)}</h3>
                {gaps.has(t) && (
                  <p className="small">
                    <strong>Recommended for you</strong>
                  </p>
                )}
                <CourseList courses={coursesFor(knowledge, t)} completed={completed} />
              </div>
            ))}
          </div>
          <p className="hint">
            Course details, prices and certificates can change. Check with the provider, and your
            line manager for paid courses.
          </p>

          <div className="cols" style={{ marginTop: 36 }}>
            <div>
              <h2>Upload a certificate</h2>
              <CertificateForm order={order} defaultTopic={defaultTopic} />
            </div>
            <div>
              <h2>Your certificates</h2>
              <CertificateList />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function CertificateForm({ order, defaultTopic }: { order: string[]; defaultTopic: string }) {
  const { knowledge, store } = usePathways();
  const [title, setTitle] = useState("");
  const [provider, setProvider] = useState("");
  const [date, setDate] = useState(todayIso);
  const [topic, setTopic] = useState(defaultTopic);
  const [url, setUrl] = useState("");
  const [course, setCourse] = useState("");
  const [message, setMessage] = useState<{ error: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const allTopics = [...knowledge.topics].sort((a, b) => a.name.localeCompare(b.name));

  function chooseCourse(value: string) {
    setCourse(value);
    if (!value) return;
    const [t = "", courseTitle = "", courseProvider = ""] = value.split("|");
    setTitle(courseTitle);
    setProvider(courseProvider);
    setTopic(t);
  }

  async function save() {
    const fail = (text: string) => setMessage({ error: true, text });
    if (!title.trim()) {
      fail("Add the certificate title.");
      titleRef.current?.focus();
      return;
    }
    if (url.trim() && !/^https?:\/\//i.test(url.trim())) {
      fail("The verify link needs to start with https://");
      return;
    }
    const file = fileRef.current?.files?.[0];
    const cert: Certificate = {
      id: crypto.randomUUID(),
      title: title.trim(),
      provider: provider.trim(),
      date,
      topic,
      url: url.trim(),
    };
    let data: string | null = null;
    if (file) {
      if (
        !/^(application\/pdf|image\/)/.test(file.type) &&
        !/\.(pdf|png|jpe?g|webp)$/i.test(file.name)
      ) {
        fail("Choose a PDF or an image file.");
        return;
      }
      if (file.size > MAX_CERT_FILE_BYTES) {
        fail("That file is over 3 MB. Save a smaller copy and try again.");
        return;
      }
      data = await readAsDataURL(file);
      cert.fileName = file.name;
      cert.fileType = file.type || (/\.pdf$/i.test(file.name) ? "application/pdf" : "image/png");
      if (cert.fileType.startsWith("image/")) {
        try {
          data = await shrinkImage(data);
          cert.fileType = "image/jpeg";
          cert.fileName = `${file.name.replace(/\.\w+$/, "")}.jpg`;
        } catch {
          // Keep the original image if it can't be resized.
        }
      }
    }
    setSaving(true);
    const ok = store.saveCertificate(cert, data);
    setSaving(false);
    if (!ok) {
      fail("Couldn't save the certificate. The file may be too big for this browser's storage.");
      return;
    }
    setTitle("");
    setProvider("");
    setUrl("");
    setCourse("");
    setDate(todayIso());
    if (fileRef.current) fileRef.current.value = "";
    setMessage(null);
    store.toast(`Certificate saved. It counts towards ${topicName(knowledge, topic)}.`);
  }

  return (
    <div className="panel" id="certform">
      <label className="f" htmlFor="cert-course" style={{ marginTop: 0 }}>
        Course
      </label>
      <select
        id="cert-course"
        style={{ width: "100%" }}
        value={course}
        onChange={(e) => chooseCourse(e.target.value)}
      >
        <option value="">Choose a course, or enter your own below</option>
        {order.map((t) => (
          <optgroup key={t} label={topicName(knowledge, t)}>
            {coursesFor(knowledge, t)
              .filter((c) => c.cert)
              .map((c) => (
                <option key={c.url} value={`${t}|${c.title}|${c.provider}`}>
                  {c.title}
                </option>
              ))}
          </optgroup>
        ))}
      </select>
      <label className="f" htmlFor="cert-title">
        Certificate title
      </label>
      <input
        ref={titleRef}
        type="text"
        id="cert-title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <label className="f" htmlFor="cert-provider">
        Provider
      </label>
      <input
        type="text"
        id="cert-provider"
        value={provider}
        onChange={(e) => setProvider(e.target.value)}
      />
      <div className="found">
        <div>
          <label className="f" htmlFor="cert-date">
            Date awarded
          </label>
          <input
            type="date"
            id="cert-date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div>
          <label className="f" htmlFor="cert-topic">
            Topic it covers
          </label>
          <select id="cert-topic" value={topic} onChange={(e) => setTopic(e.target.value)}>
            {allTopics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <label className="f" htmlFor="cert-url">
        Link to verify it (optional)
      </label>
      <input
        type="text"
        id="cert-url"
        inputMode="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://"
      />
      <label className="f" htmlFor="cert-file">
        Certificate file
      </label>
      <input
        ref={fileRef}
        type="file"
        id="cert-file"
        accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/*"
        aria-describedby="cert-file-hint"
      />
      <p className="hint" id="cert-file-hint">
        PDF or image, up to 3 MB. It&apos;s stored in this browser with your profile. People you
        share with see the certificate details, not the file.
      </p>
      <p aria-live="polite">
        {message && <span className={message.error ? "err" : ""}>{message.text}</span>}
      </p>
      <button type="button" className="btn" onClick={() => void save()} disabled={saving}>
        Save certificate
      </button>
    </div>
  );
}

function CertificateList() {
  const { certs, knowledge, store } = usePathways();
  const sorted = [...certs].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  if (!sorted.length)
    return <p>No certificates yet. Finish a suggested course and upload it here.</p>;

  function download(cert: Certificate) {
    const file = store.certificateFile(cert);
    if (!file) {
      store.toast("Couldn't find the file for this certificate.");
      return;
    }
    downloadDataUrl(file, cert.fileName ?? "certificate");
  }

  function remove(cert: Certificate) {
    if (!window.confirm(`Delete the certificate "${cert.title}"? You can't undo this.`)) return;
    store.deleteCertificate(cert.id);
    store.toast("Certificate deleted");
  }

  return (
    <>
      {sorted.map((c) => {
        const image =
          c.hasFile && c.fileType?.startsWith("image/") ? store.certificateFile(c) : null;
        return (
          <div className="ev cert" key={c.id}>
            <div className="certthumb">
              {image ? (
                // A data URL from browser storage, which next/image can't optimise.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={image} alt={`Certificate: ${c.title}`} />
              ) : (
                <span aria-hidden="true">{c.hasFile ? "PDF" : ""}</span>
              )}
            </div>
            <div>
              <h3>{c.title}</h3>
              <p className="small muted" style={{ margin: "0 0 6px" }}>
                {c.provider}. {formatDate(c.date)}. Counts towards {topicName(knowledge, c.topic)}.
              </p>
              <div className="row small">
                {c.hasFile ? (
                  <button type="button" className="linkbtn" onClick={() => download(c)}>
                    Download<span className="vh"> {c.title}</span>
                  </button>
                ) : (
                  <span className="muted">No file saved</span>
                )}
                {c.url && (
                  <a href={c.url} target="_blank" rel="noopener noreferrer">
                    Verify<span className="vh"> {c.title} (opens in a new tab)</span>
                  </a>
                )}
                <button type="button" className="linkbtn" onClick={() => remove(c)}>
                  Delete<span className="vh"> {c.title}</span>
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}
