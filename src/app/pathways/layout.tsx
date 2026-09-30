import Link from "next/link";

export default function PathwaysLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <a
        href="#main"
        className="sr-only rounded-md bg-white px-4 py-2 font-semibold focus:not-sr-only focus:absolute focus:top-2 focus:left-2"
      >
        Skip to main content
      </a>
      <header className="border-b border-slate-300">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <Link href="/" className="text-lg font-semibold">
            Learning Centre
          </Link>
          <nav aria-label="Learning pathways">
            <Link
              href="/pathways"
              className="font-medium text-indigo-800 underline underline-offset-2"
            >
              Choose your role
            </Link>
          </nav>
        </div>
      </header>
      {children}
    </>
  );
}
