// "Loading…" title over a small sliding bar in the palette gradient. Used by app/loading.tsx and the splash screen.
export default function LoadingIndicator() {
  return (
    <div className="flex flex-col items-center gap-4" role="status" aria-live="polite">
      <p className="font-serif text-2xl font-heading text-heading">Loading…</p>
      <div className="h-2 w-40 overflow-hidden border border-line bg-surface">
        <div className="loading-bar h-full w-1/3 bg-palette-gradient" />
      </div>
    </div>
  );
}
