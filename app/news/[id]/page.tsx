import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BiasMeter } from "@/components/bias-meter";
import {
  ArrowRightIcon,
  BookmarkIcon,
  InfoIcon,
} from "@/components/icons";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import {
  getDemoArticleDetail,
  type DemoArticleDetail,
  type SourceItem,
} from "@/lib/demo-article-detail";

type DetailPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: DetailPageProps): Promise<Metadata> {
  const article = getDemoArticleDetail((await params).id);
  return article
    ? {
        title: `${article.title} — Biasly News`,
        description: article.paragraphs[0],
      }
    : { title: "Story not found — Biasly News" };
}

export default async function NewsDetailsPage({ params }: DetailPageProps) {
  const article = getDemoArticleDetail((await params).id);
  if (!article) notFound();

  return (
    <>
      <SiteHeader showTopics={false} />
      <main className="mx-auto w-[min(calc(100%-32px),1160px)] py-10 md:py-12">
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_310px] lg:gap-10">
          <article>
            <ArticleHeader article={article} />
            <figure className="mt-6">
              <div className="relative aspect-[16/8.5] overflow-hidden rounded-lg bg-center">
                <Image
                  src={article.image}
                  alt="Donald Trump seated in the White House Cabinet Room"
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 800px"
                />
              </div>
              <figcaption className="mt-3 text-[9px] leading-relaxed text-secondary">
                {article.caption}
                <br />
                Photo: {article.credit}
              </figcaption>
            </figure>

            <section className="mt-6 rounded-lg border border-border bg-surface p-4">
              <div className="mb-4 flex items-center gap-2 text-xs font-semibold">
                Bias Distribution
                <InfoIcon className="size-4" />
              </div>
              <BiasMeter framing={article.framing} compact />
              <p className="mt-3 text-[10px] font-semibold">
                {article.sourceCount} sources
              </p>
            </section>

            <div className="mt-8 space-y-5 text-[15px] leading-[1.72] text-zinc-900">
              {article.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>

            <RelatedStories stories={article.related} />
          </article>

          <aside className="space-y-5 lg:sticky lg:top-5">
            <AnalysisPanel article={article} />
            <SummaryPanel article={article} />
            <SourcesPanel article={article} />
          </aside>
        </div>

        <NewsletterBand />
      </main>
      <SiteFooter />
    </>
  );
}

function ArticleHeader({ article }: { article: DemoArticleDetail }) {
  return (
    <header>
      <p className="text-xs font-medium">
        {article.category} <span className="text-secondary">·</span>{" "}
        {article.region}
      </p>
      <h1 className="mt-3 max-w-200 text-[clamp(30px,4vw,42px)] leading-[1.16] font-semibold tracking-[-0.045em]">
        {article.title}
      </h1>
      <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-4 text-[10px]">
        <strong>By {article.author}</strong>
        <span className="h-3 w-px bg-border" />
        <time>{article.date}</time>
        <span className="h-3 w-px bg-border" />
        <span>{article.readTime} read</span>
        <div className="flex items-center gap-1 sm:ml-auto">
          <ActionButton label="Save">
            <BookmarkIcon />
          </ActionButton>
          <ActionButton label="Share">
            <ArrowRightIcon className="-rotate-45" />
          </ActionButton>
          <button
            className="grid size-10 place-items-center rounded-full text-lg transition hover:bg-surface-muted"
            aria-label="More article actions"
          >
            ···
          </button>
        </div>
      </div>
    </header>
  );
}

function ActionButton({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button className="inline-flex min-h-10 items-center gap-2 rounded-md px-3 text-[10px] transition hover:bg-surface-muted">
      {label}
      <span className="[&_svg]:size-4">{children}</span>
    </button>
  );
}

const panelClass = "rounded-lg border border-border bg-surface p-5";

function AnalysisPanel({ article }: { article: DemoArticleDetail }) {
  return (
    <section className={panelClass}>
      <PanelTitle>AI Framing Analysis</PanelTitle>
      <p className="mt-6 text-[10px] font-medium">Overall framing</p>
      <p className="mt-1 text-2xl font-semibold text-[#1d4ed8]">
        Right {article.framing.right}%
      </p>
      <p className="mt-1 text-[10px] text-secondary">
        Based on {article.sourceCount} balanced sources
      </p>
      <div className="my-5 border-t border-divider" />
      <FramingRows framing={article.framing} />
      <p className="mt-6 border-t border-divider pt-5 text-[10px] leading-relaxed">
        This AI estimate compares political framing across sources. Sources are
        weighted by reliability and recency; results are not objective truth.
      </p>
      <button className="mt-4 min-h-10 w-full rounded-md border border-zinc-500 text-[10px] font-semibold transition hover:bg-surface-muted">
        How We Analyze Framing
      </button>
    </section>
  );
}

function FramingRows({ framing }: { framing: DemoArticleDetail["framing"] }) {
  return (
    <div className="space-y-4">
      {(
        [
          ["Left", framing.left, "bg-left"],
          ["Center", framing.center, "bg-zinc-300 text-foreground"],
          ["Right", framing.right, "bg-right"],
        ] as const
      ).map(([label, value, color]) => (
        <div className="grid grid-cols-[52px_38px_1fr] items-center gap-2 text-[10px]" key={label}>
          <span>{label}</span>
          <strong className={label === "Left" ? "text-left" : label === "Right" ? "text-right" : ""}>
            {value}%
          </strong>
          <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
            <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function SummaryPanel({ article }: { article: DemoArticleDetail }) {
  return (
    <section className={panelClass}>
      <PanelTitle>AI Summary</PanelTitle>
      <p className="mt-3 text-[9px] text-secondary">
        Generated May 31, 2026 &nbsp;·&nbsp; 3 min read
      </p>
      <ul className="mt-5 list-disc space-y-4 pl-4 text-[11px] leading-relaxed">
        {article.summary.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
      <p className="mt-6 text-[9px] text-secondary">
        AI summaries can make mistakes.
      </p>
      <button className="mt-3 min-h-9 rounded-md border border-zinc-500 px-5 text-[10px] font-semibold hover:bg-surface-muted">
        Provide Feedback
      </button>
    </section>
  );
}

function SourcesPanel({ article }: { article: DemoArticleDetail }) {
  const counts = { Left: 2, Center: 4, Right: 6 };
  return (
    <section className={panelClass}>
      <PanelTitle>Source Breakdown</PanelTitle>
      <p className="mt-4 text-[10px] font-semibold">
        {article.sourceCount} Total Sources
      </p>
      <div className="mt-5">
        <FramingRows framing={article.framing} />
      </div>
      <div className="mt-6 grid grid-cols-[1fr_auto] gap-y-3 text-[9px]">
        <strong>Top Sources</strong>
        <strong>Framing</strong>
        {article.sources.map((source) => (
          <SourceRow source={source} key={source.name} />
        ))}
      </div>
      <p className="sr-only">
        Source counts: {counts.Left} left, {counts.Center} center,{" "}
        {counts.Right} right.
      </p>
      <button className="mt-5 min-h-10 w-full rounded-md border border-zinc-500 text-[10px] font-semibold hover:bg-surface-muted">
        View All Sources
      </button>
    </section>
  );
}

function SourceRow({ source }: { source: SourceItem }) {
  const color =
    source.label === "Left"
      ? "text-[#b42318]"
      : source.label === "Right"
        ? "text-[#1d4ed8]"
        : "text-secondary";
  return (
    <>
      <span>{source.name}</span>
      <span className={color}>{source.label}</span>
    </>
  );
}

function PanelTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-semibold tracking-[-0.025em]">{children}</h2>
      <InfoIcon className="size-4" />
    </div>
  );
}

function RelatedStories({
  stories,
}: {
  stories: DemoArticleDetail["related"];
}) {
  return (
    <section className="mt-8 border-t border-border pt-6">
      <h2 className="mb-5 text-sm font-semibold">Related Stories</h2>
      <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
        {stories.map((story) => (
          <Link className="group flex gap-3" href={`/news/${story.id}`} key={story.id}>
            <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-md bg-center">
              <Image
                src={story.image}
                alt=""
                fill
                className="object-cover transition-transform group-hover:scale-105"
                sizes="96px"
              />
            </div>
            <div>
              <p className="text-[8px] text-secondary">
                {story.category} · {story.region}
              </p>
              <h3 className="mt-1 line-clamp-2 text-[11px] leading-snug font-semibold">
                {story.title}
              </h3>
              <p className="mt-2 text-[8px] text-secondary">
                {story.date} &nbsp;·&nbsp; {story.readTime} read
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function NewsletterBand() {
  return (
    <section className="mt-10 flex flex-col gap-5 rounded-lg border border-border bg-surface p-6 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-lg font-semibold tracking-[-0.025em]">
          Stay Informed. Stay Balanced.
        </h2>
        <p className="mt-2 text-[10px] text-secondary">
          Get the top stories and framing analysis delivered to your inbox.
        </p>
      </div>
      <form className="flex w-full max-w-md flex-col gap-3 sm:flex-row" action="#">
        <label className="sr-only" htmlFor="newsletter-email">
          Email address
        </label>
        <input
          className="min-h-11 min-w-0 flex-1 rounded-md border border-zinc-500 bg-transparent px-4 text-xs"
          id="newsletter-email"
          type="email"
          placeholder="Enter your email"
        />
        <button
          className="min-h-11 rounded-md bg-foreground px-8 text-xs font-semibold text-white hover:bg-zinc-800"
          type="button"
        >
          Subscribe
        </button>
      </form>
    </section>
  );
}
