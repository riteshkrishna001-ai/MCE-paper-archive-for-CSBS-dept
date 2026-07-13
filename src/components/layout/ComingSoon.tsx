interface ComingSoonProps {
  title: string;
  note: string;
}

/** Generic placeholder so every nav link resolves to a real route, even
 *  before that page's real content is built in a later phase. */
export function ComingSoon({ title, note }: ComingSoonProps) {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h1 className="font-display text-2xl font-bold text-ink dark:text-ink-inverted">
        {title}
      </h1>
      <p className="mt-2 max-w-md text-sm text-ink-muted">{note}</p>
    </div>
  );
}
