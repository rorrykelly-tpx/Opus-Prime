import Link from "next/link";

export default function PathwayNotFound() {
  return (
    <main id="main" className="mx-auto max-w-5xl px-4 py-12">
      {/* not-found.tsx can't export metadata; React hoists this into <head>. */}
      <title>Page not found | Learning pathways</title>
      <h1 className="text-4xl font-semibold tracking-tight">Page not found</h1>
      <p className="mt-4 text-lg text-slate-700">
        We couldn&apos;t find that pathway or module. The role may not have that grade, or the link
        may be out of date.
      </p>
      <p className="mt-6">
        <Link href="/pathways" className="font-medium text-indigo-800 underline underline-offset-2">
          Choose your role and grade
        </Link>
      </p>
    </main>
  );
}
