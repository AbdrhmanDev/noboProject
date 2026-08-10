type ErrorStateProps = {
  title?: string;
  message?: string;
};

export function ErrorState({
  title = "Something went wrong",
  message = "Please try again.",
}: ErrorStateProps) {
  return (
    <div className="panel rounded-2xl border-red-400/25 bg-red-500/10 p-5">
      <h2 className="text-sm font-black text-red-200">{title}</h2>
      <p className="mt-1 text-xs text-red-100/75">{message}</p>
    </div>
  );
}
