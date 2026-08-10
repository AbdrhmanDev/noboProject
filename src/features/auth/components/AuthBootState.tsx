export function AuthBootState() {
  return (
    <div className="bg-space grid min-h-screen place-items-center p-6 text-white">
      <div className="bg-stars absolute inset-0 pointer-events-none" />
      <div className="panel relative z-10 rounded-2xl p-6 text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-blue-400" />
        <div className="brand-text mt-4 text-xl font-black">NOBO</div>
        <p className="mt-1 text-xs text-gray-400">Restoring session...</p>
      </div>
    </div>
  );
}
