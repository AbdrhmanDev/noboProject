type EmptyStateProps = {
  title?: string;
  message?: string;
};

export function EmptyState({
  title = "No data yet",
  message = "Items will appear here when available.",
}: EmptyStateProps) {
  return (
    <div className="panel grid min-h-40 place-items-center rounded-2xl border-dashed p-6 text-center">
      <div>
        <h2 className="text-sm font-black text-gray-200">{title}</h2>
        <p className="mt-1 text-xs text-gray-500">{message}</p>
      </div>
    </div>
  );
}
