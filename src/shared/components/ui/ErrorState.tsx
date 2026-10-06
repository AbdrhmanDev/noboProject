type ErrorStateProps = {
  title?: string;
  message?: string;
};

export function ErrorState({
  title = "Something went wrong",
  message = "Please try again.",
}: ErrorStateProps) {
  return (
    <div className="rounded-xl border border-danger bg-danger-soft p-5">
      <h2 className="text-sm font-bold text-danger">{title}</h2>
      <p className="mt-1 text-xs text-ink">{message}</p>
    </div>
  );
}
