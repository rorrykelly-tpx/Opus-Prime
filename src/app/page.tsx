import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-4 px-6 py-24">
      <h1 className="text-4xl font-semibold tracking-tight">Learning Centre</h1>
      <p className="text-lg text-slate-600">
        One place to discover, search and organise learning and development content.
      </p>
      <p>
        <Link
          href="/pathways"
          className="inline-block rounded-md bg-indigo-700 px-5 py-3 font-semibold text-white hover:bg-indigo-800"
        >
          Build your learning pathway
        </Link>
      </p>
    </main>
  );
}
