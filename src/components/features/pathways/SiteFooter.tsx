"use client";

import Link from "next/link";

import { usePathways } from "./PathwaysProvider";

export function SiteFooter() {
  const { ready, toast: message } = usePathways();
  return (
    <>
      <footer>
        <div className="wrap">
          <p>
            Built from the TPXimpact progression framework: DT billable skills v1.0 and behaviours
            and impact v3.0, plus the consulting skills programme.{" "}
            {ready && <span>Saved in this browser only.</span>}
          </p>
          <p>
            <Link href="/pathways/data">Framework data and updates</Link>
          </p>
        </div>
      </footer>
      <div className={message ? "toast on" : "toast"} role="status" aria-live="polite">
        {message}
      </div>
    </>
  );
}
