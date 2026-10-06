type EmptyStateProps = {
  title?: string;
  message?: string;
};

export function EmptyState({
  title = "No data yet",
  message = "Items will appear here when available.",
}: EmptyStateProps) {
  return (
    <div className="grid min-h-40 place-items-center rounded-xl border border-dashed border-line-strong bg-surface p-6 text-center">
      <div>
        <h2 className="text-sm font-bold text-ink">{title}</h2>
        <p className="mt-1 text-xs text-subtle">{message}</p>
      </div>
    </div>
  );
}
