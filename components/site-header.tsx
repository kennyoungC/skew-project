import Link from "next/link";
import { Brand } from "@/components/brand";
import {
  ChevronDownIcon,
  GlobeIcon,
  MenuIcon,
} from "@/components/icons";

const topics = [
  "World Cup",
  "IPL",
  "Social Media",
  "Business & Markets",
  "Health & Medicine",
  "Soccer",
  "Artificial Intelligence",
  "Arsenal FC",
  "Extreme Weather and Disasters",
];

export function SiteHeader() {
  return (
    <header>
      <div className="bg-[#1c1d1f] text-zinc-300">
        <div className="mx-auto flex h-8 w-[min(calc(100%-32px),1160px)] items-center justify-between text-[9px] sm:text-[10px]">
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline">Browser Extension</span>
            <span className="hidden h-3 w-px bg-zinc-700 sm:block" />
            <span>
              Theme: <strong className="ml-1 text-white">Light</strong>
            </span>
            <span className="hidden sm:inline">Dark</span>
            <span className="hidden sm:inline">Auto</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden md:inline">Monday, June 1, 2026</span>
            <span className="hidden h-3 w-px bg-zinc-700 md:block" />
            <span className="hidden sm:inline">Set Location</span>
            <span className="hidden h-3 w-px bg-zinc-700 sm:block" />
            <span className="inline-flex items-center gap-1.5">
              <GlobeIcon className="size-3.5" />
              International Edition
              <ChevronDownIcon className="size-3" />
            </span>
          </div>
        </div>
      </div>

      <div className="border-b border-border bg-surface">
        <div className="mx-auto flex h-[72px] w-[min(calc(100%-32px),1160px)] items-center gap-7">
          <button
            className="grid size-10 place-items-center rounded-full transition hover:bg-surface-muted"
            type="button"
            aria-label="Open navigation menu"
          >
            <MenuIcon className="size-5 stroke-2" />
          </button>
          <Brand />
          <nav
            className="hidden h-full items-center gap-8 md:flex"
            aria-label="Primary navigation"
          >
            <Link
              className="relative flex h-full items-center text-xs font-medium after:absolute after:right-0 after:bottom-0 after:left-0 after:h-px after:bg-foreground"
              href="/"
            >
              Home
            </Link>
            <a className="relative text-xs font-medium" href="#top-news">
              For You
              <span className="absolute -top-0.5 -right-2 size-1.5 rounded-full bg-left" />
            </a>
            <a className="text-xs font-medium" href="#top-news">Local</a>
            <a className="text-xs font-medium" href="#top-news">Blindspot</a>
          </nav>
          <div className="ml-auto flex items-center gap-2.5">
            <button className="hidden min-h-11 rounded-md bg-foreground px-8 text-xs font-semibold text-white transition hover:bg-zinc-800 sm:block">
              Subscribe
            </button>
            <button className="min-h-11 rounded-md border border-zinc-500 bg-transparent px-6 text-xs font-semibold transition hover:bg-surface-muted sm:px-8">
              Login
            </button>
          </div>
        </div>
      </div>

      <nav
        className="border-b border-border bg-surface"
        aria-label="Trending topics"
      >
        <div className="mx-auto flex w-[min(100%,1280px)] gap-2 overflow-x-auto px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            className="grid min-h-8 shrink-0 place-items-center rounded-full bg-surface-muted px-3 text-lg"
            aria-label="Add topic"
          >
            +
          </button>
          {topics.map((topic) => (
            <a
              className="inline-flex min-h-8 shrink-0 items-center gap-3 rounded-full bg-surface-muted px-4 text-[10px] font-semibold transition hover:bg-zinc-200"
              href="#top-news"
              key={topic}
            >
              {topic}
              <span className="text-base leading-none">+</span>
            </a>
          ))}
        </div>
      </nav>
    </header>
  );
}
