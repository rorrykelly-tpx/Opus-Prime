import { NotFoundView } from "@/components/features/pathways/NotFoundView";

export default function PathwaysNotFound() {
  return (
    <>
      {/* not-found.tsx can't export metadata; React hoists this into <head>. */}
      <title>Page not found | TPXimpact learning pathways</title>
      <NotFoundView />
    </>
  );
}
