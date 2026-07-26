export default function HomeLoading() {
  return (
    <main className="mx-auto w-[min(calc(100%-32px),1160px)] py-10">
      <div className="h-9 w-36 animate-pulse rounded bg-zinc-200" />
      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div
            className="overflow-hidden rounded-lg border border-border bg-surface"
            key={index}
          >
            <div className="aspect-video animate-pulse bg-zinc-200" />
            <div className="space-y-3 p-4">
              <div className="h-3 w-28 animate-pulse rounded bg-zinc-200" />
              <div className="h-5 w-full animate-pulse rounded bg-zinc-200" />
              <div className="h-5 w-3/4 animate-pulse rounded bg-zinc-200" />
              <div className="h-6 w-full animate-pulse rounded bg-zinc-200" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
