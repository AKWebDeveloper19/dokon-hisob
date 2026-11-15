export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="panel empty">
      <h2>{title}</h2>
      {children ? <p>{children}</p> : null}
    </div>
  );
}
