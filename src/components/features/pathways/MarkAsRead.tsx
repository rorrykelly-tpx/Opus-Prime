"use client";

import { useState } from "react";

import { setModuleRead, useReadModules } from "@/lib/read-progress";
import { cn } from "@/lib/utils";

export function MarkAsRead({ slug }: { slug: string }) {
  const read = useReadModules().has(slug);
  const [announcement, setAnnouncement] = useState("");

  function toggle() {
    setModuleRead(slug, !read);
    setAnnouncement(
      read ? "Marked as not read." : "Marked as read. Your pathway progress is updated.",
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {read && <span className="text-slate-700">You&apos;ve marked this as read.</span>}
      {/* One button whose label changes, so keyboard focus stays put when it's pressed. */}
      <button
        type="button"
        onClick={toggle}
        className={cn(
          "min-h-11 text-indigo-800",
          read
            ? "px-1 font-medium underline underline-offset-2 hover:text-indigo-900"
            : "rounded-md border-2 border-indigo-700 px-4 py-2 font-semibold hover:bg-indigo-50",
        )}
      >
        {read ? "Undo" : "Mark as read"}
      </button>
      <span role="status" className="sr-only">
        {announcement}
      </span>
    </div>
  );
}
