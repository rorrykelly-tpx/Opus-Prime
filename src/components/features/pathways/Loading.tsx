export function Spinner() {
  return <span className="spin" aria-hidden="true" />;
}

export function Loading({ children = "Loading your pathway…" }: { children?: React.ReactNode }) {
  return (
    <section className="plain">
      <div className="wrap">
        <p role="status">
          <Spinner /> {children}
        </p>
      </div>
    </section>
  );
}
