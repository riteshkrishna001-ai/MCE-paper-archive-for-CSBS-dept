import { Loader2 } from 'lucide-react';

export function FullPageSpinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-ink-muted">
      <Loader2 className="h-7 w-7 animate-spin text-brand-500" aria-hidden="true" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
