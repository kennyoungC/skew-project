export default function NewsDetailsLoading() {
  return (
    <main className="mx-auto w-[min(calc(100%-32px),1160px)] py-10 md:py-12">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_310px] lg:gap-10">
        <div>
          <div className="h-3 w-24 animate-pulse rounded bg-zinc-200" />
          <div className="mt-4 h-11 w-full animate-pulse rounded bg-zinc-200" />
          <div className="mt-3 h-11 w-4/5 animate-pulse rounded bg-zinc-200" />
          <div className="mt-6 aspect-[16/8.5] animate-pulse rounded-lg bg-zinc-200" />
          <div className="mt-8 space-y-3">
            {Array.from({ length: 5 }, (_, index) => (
              <div
                className="h-4 animate-pulse rounded bg-zinc-200"
                key={index}
              />
            ))}
          </div>
        </div>
        <div className="space-y-5">
          {Array.from({ length: 3 }, (_, index) => (
            <div
              className="h-52 animate-pulse rounded-lg border border-border bg-surface"
              key={index}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
