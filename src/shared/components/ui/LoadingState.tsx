type LoadingStateProps = {
  label?: string;
};

export function LoadingState({ label = "Loading..." }: LoadingStateProps) {
  return (
    <div className="panel grid min-h-40 place-items-center rounded-2xl p-6 text-center">
      <div>
        <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-white/10 border-t-blue-400" />
        <p className="mt-3 text-xs font-semibold text-gray-400">{label}</p>
      </div>
    </div>
  );
}
