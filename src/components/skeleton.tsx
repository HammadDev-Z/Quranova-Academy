import { cn } from "./ui";

/** Grey shimmering block used while a route streams in. */
function Bone({ className }: { className?: string }) {
  return <div aria-hidden className={cn("skeleton", className)} />;
}

/** Generic page placeholder: a heading, a row of cards and a table. Fits inside any portal shell. */
export function PageSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <div role="status" aria-label="Loading" className="fade-in space-y-6">
      <div className="space-y-3">
        <Bone className="h-4 w-32" />
        <Bone className="h-9 w-72 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: cards }, (_, i) => (
          <Bone key={i} className="h-28 rounded-3xl" />
        ))}
      </div>
      <div className="space-y-3 rounded-3xl bg-white/70 p-5">
        {Array.from({ length: 5 }, (_, i) => (
          <Bone key={i} className="h-10" />
        ))}
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}

/** Public site placeholder: dark hero band plus content blocks. */
export function SiteSkeleton() {
  return (
    <div role="status" aria-label="Loading" className="fade-in">
      <div className="bg-brand-800 py-16 sm:py-20">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4">
          <Bone className="h-10 w-80 max-w-full bg-white/15" />
          <Bone className="h-5 w-96 max-w-full bg-white/10" />
        </div>
      </div>
      <div className="mx-auto grid max-w-6xl gap-5 px-4 py-14 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Bone key={i} className="h-44 rounded-2xl" />
        ))}
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
