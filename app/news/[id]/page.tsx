import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { cache } from "react";

import { BiasMeter, type Framing } from "@/components/bias-meter";
import { CompactNewsCard } from "@/components/compact-news-card";
import { ArrowRightIcon, InfoIcon } from "@/components/icons";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import {
  articleParagraphs,
  estimateReadTime,
  formatArticleDate,
  formatConfidence,
  formatLabel,
  formatScore,
  toRelatedArticleCardView,
} from "@/lib/news/presentation";
import {
  getAnalyzedArticleById,
  getRelatedArticles,
  type AnalyzedArticle,
  type RelatedArticle,
} from "@/lib/supabase/queries/articles";

const getArticle = cache(getAnalyzedArticleById);
const panelClass = "rounded-lg border border-border bg-surface p-5";

export async function generateMetadata(
  props: PageProps<"/news/[id]">,
): Promise<Metadata> {
  const { id } = await props.params;
  const article = await getArticle(id);
  return article
    ? {
        description: article.analysis.summary,
        title: `${article.title} — Biasly News`,
      }
    : { title: "Story not found — Biasly News" };
}

export default async function NewsDetailsPage(
  props: PageProps<"/news/[id]">,
) {
  const { id } = await props.params;
  const article = await getArticle(id);
  if (!article) notFound();
  const relatedArticles = await getRelatedArticles(
    article.id,
    article.analysis.embedding,
  );

  const framing: Framing = {
    center: article.analysis.center_percentage,
    left: article.analysis.left_percentage,
    right: article.analysis.right_percentage,
  };
  const paragraphs = articleParagraphs(article.raw_text);

  return (
    <>
      <SiteHeader showTopics={false} />
      <main className="mx-auto w-[min(calc(100%-32px),1160px)] py-10 md:py-12">
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_310px] lg:gap-10">
          <article>
            <ArticleHeader article={article} />
            <figure className="mt-6">
              <div className="relative aspect-[16/8.5] overflow-hidden rounded-lg bg-zinc-200">
                <Image
                  alt={article.title}
                  className="object-cover"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 800px"
                  src={article.image_url}
                />
              </div>
              <figcaption className="mt-3 text-[10px] leading-relaxed text-secondary">
                Image published with the original article by {article.source.name}.
              </figcaption>
            </figure>

            <section className="mt-6 rounded-lg border border-border bg-surface p-4">
              <div className="mb-4 flex items-center gap-2 text-xs font-semibold">
                AI-estimated framing
                <InfoIcon className="size-4" />
              </div>
              <BiasMeter framing={framing} compact />
              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-divider pt-4 text-[10px]">
                <span>
                  Label: <strong>{formatLabel(article.analysis.bias_label)}</strong>
                </span>
                <span>
                  Confidence:{" "}
                  <strong>{formatConfidence(article.analysis.confidence)}</strong>
                </span>
              </div>
            </section>

            <div className="mt-8 space-y-5 text-[15px] leading-[1.72] text-zinc-900">
              {paragraphs.map((paragraph, index) => (
                <p key={`${index}-${paragraph.slice(0, 32)}`}>{paragraph}</p>
              ))}
            </div>

            <a
              className="mt-8 inline-flex min-h-11 items-center gap-2 rounded-md border border-foreground px-5 text-xs font-semibold transition hover:bg-foreground hover:text-white"
              href={article.canonical_url ?? article.original_url}
              rel="noopener noreferrer"
              target="_blank"
            >
              Read original at {article.source.name}
              <ArrowRightIcon className="size-4" />
            </a>

            <RelatedArticles articles={relatedArticles} />
          </article>

          <aside className="space-y-5 lg:sticky lg:top-5">
            <AnalysisPanel article={article} framing={framing} />
            <SummaryPanel article={article} />
            <ArticleInfoPanel article={article} />
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function RelatedArticles({ articles }: { articles: RelatedArticle[] }) {
  if (articles.length === 0) return null;

  return (
    <section className="mt-10 border-t border-border pt-8">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold tracking-wider text-secondary uppercase">
            Semantic similarity
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em]">
            Related Articles
          </h2>
        </div>
        <p className="max-w-64 text-right text-[9px] leading-relaxed text-secondary">
          Ranked by similarity to this article&apos;s embedding.
        </p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        {articles.map((related) => (
          <div className="relative" key={related.id}>
            <span className="absolute top-3 left-3 z-10 rounded-full bg-black/70 px-2.5 py-1 text-[9px] font-semibold text-white backdrop-blur-sm">
              {Math.round(related.similarity * 100)}% similar
            </span>
            <CompactNewsCard article={toRelatedArticleCardView(related)} />
          </div>
        ))}
      </div>
    </section>
  );
}

function ArticleHeader({ article }: { article: AnalyzedArticle }) {
  return (
    <header>
      <p className="text-xs font-medium text-secondary">{article.source.name}</p>
      <h1 className="mt-3 max-w-200 text-[clamp(30px,4vw,42px)] leading-[1.16] font-semibold tracking-[-0.045em]">
        {article.title}
      </h1>
      <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-[10px]">
        <time dateTime={article.published_at}>
          {formatArticleDate(article.published_at)}
        </time>
        <span className="h-3 w-px bg-border" />
        <span>{estimateReadTime(article.raw_text)} read</span>
      </div>
    </header>
  );
}

function AnalysisPanel({
  article,
  framing,
}: {
  article: AnalyzedArticle;
  framing: Framing;
}) {
  return (
    <section className={panelClass}>
      <PanelTitle>AI Analysis</PanelTitle>
      <dl className="mt-5 grid grid-cols-2 gap-4 text-[10px]">
        <div>
          <dt className="text-secondary">Political framing</dt>
          <dd className="mt-1 text-xl font-semibold">
            {formatLabel(article.analysis.bias_label)}
          </dd>
        </div>
        <div>
          <dt className="text-secondary">Confidence</dt>
          <dd className="mt-1 text-xl font-semibold">
            {formatConfidence(article.analysis.confidence)}
          </dd>
        </div>
        <div>
          <dt className="text-secondary">Sentiment</dt>
          <dd className="mt-1 font-semibold">
            {formatLabel(article.analysis.sentiment_label)}
          </dd>
        </div>
        <div>
          <dt className="text-secondary">Sentiment score</dt>
          <dd className="mt-1 font-semibold">
            {formatScore(article.analysis.sentiment_score)}
          </dd>
        </div>
      </dl>
      <div className="my-5 border-t border-divider" />
      <FramingRows framing={framing} />
      <div className="mt-5 border-t border-divider pt-5">
        <p className="text-[10px] font-semibold">Framing notes</p>
        <p className="mt-2 text-[10px] leading-relaxed text-zinc-700">
          {article.analysis.framing_notes}
        </p>
      </div>
      <p className="mt-5 border-t border-divider pt-5 text-[9px] leading-relaxed text-secondary">
        {article.analysis.disclaimer}
      </p>
    </section>
  );
}

function SummaryPanel({ article }: { article: AnalyzedArticle }) {
  return (
    <section className={panelClass}>
      <PanelTitle>AI Summary</PanelTitle>
      <p className="mt-4 text-[11px] leading-relaxed">
        {article.analysis.summary}
      </p>
      <p className="mt-5 text-[9px] text-secondary">
        AI summaries can contain mistakes.
      </p>
    </section>
  );
}

function ArticleInfoPanel({ article }: { article: AnalyzedArticle }) {
  return (
    <section className={panelClass}>
      <PanelTitle>Article information</PanelTitle>
      <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 text-[10px]">
        <dt className="text-secondary">Source</dt>
        <dd className="text-right font-semibold">{article.source.name}</dd>
        <dt className="text-secondary">Published</dt>
        <dd className="text-right font-semibold">
          {formatArticleDate(article.published_at)}
        </dd>
        <dt className="text-secondary">Model</dt>
        <dd className="text-right font-semibold">{article.analysis.model}</dd>
      </dl>
      <div className="mt-5 border-t border-divider pt-5">
        <p className="text-[10px] font-semibold">Loaded terms</p>
        {article.analysis.loaded_terms.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-2">
            {article.analysis.loaded_terms.map((term) => (
              <li
                className="rounded-full border border-border bg-surface-muted px-2.5 py-1 text-[9px]"
                key={term}
              >
                {term}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-[10px] text-secondary">None identified.</p>
        )}
      </div>
    </section>
  );
}

function FramingRows({ framing }: { framing: Framing }) {
  return (
    <div className="space-y-4">
      {(
        [
          ["Left", framing.left, "bg-left"],
          ["Center", framing.center, "bg-zinc-300"],
          ["Right", framing.right, "bg-right"],
        ] as const
      ).map(([label, value, color]) => (
        <div
          className="grid grid-cols-[52px_38px_1fr] items-center gap-2 text-[10px]"
          key={label}
        >
          <span>{label}</span>
          <strong>{value}%</strong>
          <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
            <div
              className={`h-full rounded-full ${color}`}
              style={{ width: `${value}%` }}
            />
          </div>
        </div>
      ))}
    </div>
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
