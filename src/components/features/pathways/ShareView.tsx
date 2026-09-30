"use client";

import { useState } from "react";

import { Loading } from "./Loading";
import { usePathways } from "./PathwaysProvider";
import { useChosenRole } from "./use-pathway-route";
import { Wave } from "./Wave";

export function ShareView() {
  const route = useChosenRole();
  if (route.status !== "ok") return <Loading />;
  return <Share />;
}

// Sharing must be enforced on the server (spec 0001, 5.7), which needs a database. Until then
// it's switched off, except in the demo, which shows how it will work without saving anything.
function Share() {
  const { demo, profile, store } = usePathways();
  const [emails, setEmails] = useState(profile.shareWith.join("\n"));
  const [error, setError] = useState("");

  function save() {
    const raw = emails
      .split(/[\s,;]+/)
      .map((x) => x.trim())
      .filter(Boolean);
    const bad = raw.filter((x) => !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(x));
    if (bad.length) {
      setError(`These don't look like email addresses: ${bad.join(", ")}`);
      return;
    }
    setError("");
    store.toast("In the demo, sharing changes aren't saved.");
  }

  return (
    <>
      <div className="band pink pastel">
        <div className="wrap">
          <p className="sub">Sharing</p>
          <h1>Who can see your progress</h1>
          <p>
            Add the email addresses of people you want to see your pathway, such as your line
            manager or a mentor. They&apos;ll see your role, grade, where your evidence places you,
            your module progress and your evidence. Remove an address to stop sharing with them.
          </p>
        </div>
      </div>
      <Wave />
      <section className="plain">
        <div className="wrap cols">
          <div>
            {demo ? (
              <div className="panel">
                <label className="f" htmlFor="share-emails" style={{ marginTop: 0 }}>
                  Share with these email addresses
                </label>
                <textarea
                  id="share-emails"
                  style={{ minHeight: 110 }}
                  placeholder="name@tpximpact.com, another.name@tpximpact.com"
                  value={emails}
                  onChange={(e) => setEmails(e.target.value)}
                  aria-describedby="share-hint share-err"
                />
                <p className="hint" id="share-hint">
                  Separate addresses with commas or new lines. We match each address to a colleague
                  in your organisation.
                </p>
                <p id="share-err" className="err" aria-live="polite">
                  {error}
                </p>
                <button type="button" className="btn" onClick={save}>
                  Save sharing
                </button>
                {profile.shareWith.length > 0 && (
                  <>
                    <h3 style={{ marginTop: 22 }}>Shared with</h3>
                    <ul className="res">
                      {profile.shareWith.map((e) => (
                        <li key={e}>
                          {e}
                          {profile.shareNames[e] && <small>{profile.shareNames[e]}</small>}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            ) : (
              <p>
                Sharing isn&apos;t switched on yet. It needs a database, so the server can check who
                is allowed to see each pathway. Right now your progress is saved in this browser
                only.
              </p>
            )}
          </div>
          <div>
            <h2>Shared with me</h2>
            <p>
              {demo
                ? "No one has shared their pathway with Julia. In the demo, sharing changes aren't saved."
                : "Pathways people share with you will appear here once sharing is switched on."}
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
