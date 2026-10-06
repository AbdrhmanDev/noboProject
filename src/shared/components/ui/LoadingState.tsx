type LoadingStateProps = {
  label?: string;
};

export function LoadingState({ label = "Loading..." }: LoadingStateProps) {
  return (
    <div className="grid min-h-40 place-items-center rounded-xl border border-line bg-surface p-6 text-center">
      <div>
        <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-line border-t-accent" />
        <p className="mt-3 text-xs font-semibold text-muted">{label}</p>
      </div>
    </div>
  );
}
