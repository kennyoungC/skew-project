import Link from "next/link";
import { BiasMeter } from "@/components/bias-meter";
import { Brand } from "@/components/brand";
import {
  ArrowRightIcon,
  BookmarkIcon,
  ClockIcon,
  MenuIcon,
  SearchIcon,
  SparkIcon,
} from "@/components/icons";
import { NewsCard } from "@/components/news-card";
import { featuredArticle } from "@/lib/demo-news";

const panel =
  "rounded-lg border border-border bg-surface p-5 shadow-soft-sm sm:p-6";
const panelTitle =
  "mb-5 border-b border-border pb-3 text-[13px] font-bold tracking-[-0.01em] uppercase";

const colors = [
  ["Text primary", "#0D0D0F", "bg-foreground"],
  ["Text secondary", "#687280", "bg-secondary"],
  ["Surface", "#FFFFFF", "bg-surface"],
  ["Left framing", "#B42318", "bg-left"],
  ["Center framing", "#E5E7EB", "bg-center"],
  ["Right framing", "#1D4ED8", "bg-right"],
  ["Background", "#F7F7F6", "bg-background"],
  ["Border", "#D9DADD", "bg-border"],
  ["Divider", "#E5E7EB", "bg-divider"],
] as const;

const typeRows = [
  ["H1", "Page / screen title", "32px", "700", "1.2", "text-[32px] font-bold leading-[1.2]"],
  ["H2", "Section title", "24px", "600", "1.3", "text-2xl font-semibold leading-[1.3]"],
  ["H3", "Card / module title", "20px", "600", "1.3", "text-xl font-semibold leading-[1.3]"],
  ["H4", "Subheading", "16px", "500", "1.4", "text-base font-medium leading-[1.4]"],
  ["Body large", "Important content", "16px", "400", "1.6", "text-base leading-[1.6]"],
  ["Body medium", "Body text", "14px", "400", "1.6", "text-sm leading-[1.6]"],
  ["Body small", "Supporting text", "13px", "400", "1.6", "text-[13px] leading-[1.6]"],
  ["Caption", "Labels, meta text", "11px", "400", "1.4", "text-[11px] leading-[1.4]"],
] as const;

export default function DesignSystemPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-4 text-foreground sm:px-6 sm:py-6">
      <div className="mx-auto max-w-360">
        <header className="mb-3 flex items-center justify-between rounded-lg border border-border bg-surface px-5 py-4 shadow-soft-sm">
          <Brand />
          <div className="flex items-center gap-4">
            <span className="hidden text-xs text-secondary sm:inline">
              Design system v1.0
            </span>
            <Link
              className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border px-4 text-xs font-semibold transition hover:bg-surface-muted [&_svg]:size-4"
              href="/"
            >
              Back to news
              <ArrowRightIcon />
            </Link>
          </div>
        </header>

        <div className="grid gap-3 lg:grid-cols-12">
          <section className={`${panel} lg:col-span-4`}>
            <h1 className={panelTitle}>Brand</h1>
            <div className="flex min-h-55 flex-col items-center justify-center text-center">
              <div className="scale-150">
                <Brand />
              </div>
              <p className="mt-8 max-w-56 text-sm leading-relaxed text-zinc-700">
                Balanced news coverage,
                <br />
                powered by AI.
              </p>
            </div>
          </section>

          <section className={`${panel} lg:col-span-8`}>
            <h2 className={panelTitle}>Typography</h2>
            <div className="grid gap-6 xl:grid-cols-[0.7fr_1.3fr]">
              <div>
                <span className="text-[11px] font-medium uppercase">
                  Font family
                </span>
                <p className="mt-2 text-[32px] font-bold tracking-[-0.04em]">
                  Poppins
                </p>
                <p className="mt-2 max-w-64 text-xs leading-relaxed text-secondary">
                  A modern geometric sans-serif selected for clarity and
                  excellent readability.
                </p>
              </div>
              <div className="overflow-x-auto">
                <div className="min-w-150">
                  <div className="grid grid-cols-[110px_1fr_55px_55px_65px] gap-3 border-b border-divider pb-2 text-[9px] font-semibold uppercase">
                    <span>Style</span><span>Usage</span><span>Size</span><span>Weight</span><span>Line height</span>
                  </div>
                  {typeRows.map(([name, use, size, weight, lineHeight, className]) => (
                    <div
                      className="grid grid-cols-[110px_1fr_55px_55px_65px] items-center gap-3 border-b border-divider/70 py-2.5 last:border-0"
                      key={name}
                    >
                      <span className={className}>{name}</span>
                      <span className="text-[10px] text-secondary">{use}</span>
                      <span className="text-[10px]">{size}</span>
                      <span className="text-[10px]">{weight}</span>
                      <span className="text-[10px]">{lineHeight}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className={`${panel} lg:col-span-4`}>
            <h2 className={panelTitle}>Colors</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {colors.map(([name, value, className]) => (
                <div key={name}>
                  <div
                    className={`h-16 rounded-md border border-border shadow-soft-sm ${className}`}
                  />
                  <p className="mt-2 text-[10px] font-semibold uppercase">{name}</p>
                  <p className="text-[10px] text-secondary">{value}</p>
                </div>
              ))}
            </div>
          </section>

          <section className={`${panel} lg:col-span-8`}>
            <h2 className={panelTitle}>UI elements</h2>
            <div className="space-y-7">
              <div>
                <h3 className="mb-3 text-[10px] font-semibold uppercase">Buttons</h3>
                <div className="flex flex-wrap gap-3">
                  <button className="min-h-10 rounded-md bg-foreground px-5 text-xs font-semibold text-white hover:bg-zinc-800">
                    Primary
                  </button>
                  <button className="min-h-10 rounded-md border border-border bg-surface px-5 text-xs font-semibold hover:bg-surface-muted">
                    Secondary
                  </button>
                  <button className="min-h-10 rounded-md border border-foreground bg-transparent px-5 text-xs font-semibold">
                    Outline
                  </button>
                  <button className="min-h-10 cursor-not-allowed rounded-md bg-zinc-200 px-5 text-xs font-semibold text-zinc-400" disabled>
                    Disabled
                  </button>
                  <button className="min-h-10 px-3 text-xs font-semibold text-right hover:underline">
                    Text button
                  </button>
                </div>
              </div>
              <div>
                <h3 className="mb-3 text-[10px] font-semibold uppercase">Chip / category</h3>
                <div className="flex flex-wrap gap-2">
                  {["Top stories", "World Cup +", "Business & Markets +", "More +"].map((chip, index) => (
                    <button
                      className={`min-h-9 rounded-full border px-4 text-xs font-medium ${
                        index === 0
                          ? "border-foreground bg-foreground text-white"
                          : "border-border bg-surface-muted"
                      }`}
                      key={chip}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="mb-3 text-[10px] font-semibold uppercase">Bias meter</h3>
                <div className="grid gap-5 md:grid-cols-3">
                  <BiasMeter framing={{ left: 25, center: 50, right: 25 }} />
                  <BiasMeter framing={{ left: 58, center: 30, right: 12 }} />
                  <BiasMeter framing={{ left: 12, center: 33, right: 55 }} />
                </div>
              </div>
            </div>
          </section>

          <section className={`${panel} lg:col-span-5`}>
            <h2 className={panelTitle}>Icons</h2>
            <div className="grid grid-cols-3 gap-8 py-5 sm:grid-cols-6 lg:grid-cols-3 xl:grid-cols-6">
              {[MenuIcon, SearchIcon, BookmarkIcon, ClockIcon, SparkIcon, ArrowRightIcon].map(
                (IconComponent, index) => (
                  <div
                    className="grid min-h-12 place-items-center rounded-md transition hover:bg-surface-muted [&_svg]:size-6 [&_svg]:stroke-2"
                    key={index}
                  >
                    <IconComponent />
                  </div>
                ),
              )}
            </div>
            <p className="mt-6 text-xs text-secondary">
              Line style&nbsp; · &nbsp;2px stroke&nbsp; · &nbsp;Rounded caps
            </p>
          </section>

          <section className={`${panel} lg:col-span-7`}>
            <h2 className={panelTitle}>Card example</h2>
            <NewsCard article={featuredArticle} />
          </section>

          <section className={`${panel} lg:col-span-4`}>
            <h2 className={panelTitle}>Spacing system</h2>
            <div className="flex min-h-44 items-end gap-3 overflow-x-auto pb-2">
              {[4, 8, 16, 24, 32, 40, 64].map((space) => (
                <div className="flex shrink-0 flex-col items-center gap-2" key={space}>
                  <div
                    className="w-9 bg-indigo-100"
                    style={{ height: `${space}px` }}
                  />
                  <span className="text-[10px]">{space}px</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-secondary">
              Consistent spacing based on a 4px base unit.
            </p>
          </section>

          <section className={`${panel} lg:col-span-5`}>
            <h2 className={panelTitle}>Grid system</h2>
            <div className="overflow-x-auto">
              <div className="grid min-w-110 grid-cols-12 gap-2 border-x border-border p-3">
                {Array.from({ length: 12 }, (_, index) => (
                  <div className="h-36 bg-indigo-100" key={index} />
                ))}
              </div>
            </div>
            <div className="mt-3 flex justify-between text-[10px] text-secondary">
              <span>Container 1280px</span>
              <span>12 columns</span>
              <span>24px gutter</span>
            </div>
          </section>

          <section className={`${panel} lg:col-span-3`}>
            <h2 className={panelTitle}>Elevation & radius</h2>
            <div className="grid grid-cols-2 gap-5">
              {[
                ["Small", "shadow-soft-sm"],
                ["Medium", "shadow-soft-md"],
                ["Large", "shadow-soft-lg"],
              ].map(([name, shadow]) => (
                <div className="flex items-center gap-3" key={name}>
                  <div className={`size-10 rounded-sm border border-border bg-white ${shadow}`} />
                  <span className="text-[10px] font-semibold">{name}</span>
                </div>
              ))}
              {[
                ["4px", "rounded-sm"],
                ["8px", "rounded-md"],
                ["12px", "rounded-lg"],
                ["Full", "rounded-full"],
              ].map(([name, radius]) => (
                <div className="flex items-center gap-3" key={name}>
                  <div className={`size-10 border border-border bg-white ${radius}`} />
                  <span className="text-[10px] font-semibold">{name}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <footer className="mt-3 flex flex-col justify-between gap-5 rounded-lg bg-[#15171a] px-6 py-7 text-white sm:flex-row sm:items-center">
          <Brand inverse />
          <span className="text-[11px] text-zinc-400">Design System v1.0</span>
          <span className="text-[11px]">Stay consistent. Stay unbiased.</span>
        </footer>
      </div>
    </main>
  );
}
