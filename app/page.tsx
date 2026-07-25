import { CompactNewsCard } from "@/components/compact-news-card"
import { ArrowRightIcon, SparkIcon } from "@/components/icons"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { featuredArticle, latestArticles } from "@/lib/demo-news"

const topNews = [
  {
    ...featuredArticle,
    source: "Capitol Report",
    category: "Politics",
    region: "United States",
    title: "Trump Sends Iran Revised Peace Proposal With Tougher Terms: Report",
    image: "https://images.unsplash.com/photo-1569285645462-a3f9c6332d56?auto=format&fit=crop&w=1000&q=80",
    framing: { left: 20, center: 31, right: 49 },
  },
  {
    ...latestArticles[4],
    id: "grapes-superfood",
    sourceCount: 7,
    category: "Health",
    region: "United States",
    title: "Researchers Make Case for Grapes as a ‘Superfood’ After Review of Health Evidence",
    image: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=1000&q=80",
    framing: { left: 18, center: 42, right: 40 },
  },
  {
    ...latestArticles[1],
    id: "cern-physics",
    sourceCount: 8,
    category: "Science",
    region: "Switzerland",
    title: "CERN Finds High-Significance Hint of Physics Beyond Standard Model",
    image: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1000&q=80",
    framing: { left: 16, center: 62, right: 22 },
  },
  ...latestArticles.slice(6),
  {
    ...latestArticles[3],
    id: "oil-prices-opec",
    title: "Oil Prices Dip as OPEC+ Considers Output Increase Amid Weak Demand",
    sourceCount: 11,
    image: "https://images.unsplash.com/photo-1545459720-aac8509eb02c?auto=format&fit=crop&w=1000&q=80",
    framing: { left: 22, center: 50, right: 28 },
  },
  ...latestArticles.slice(0, 1).map((article) => ({
    ...article,
    id: "extreme-heat",
    sourceCount: 14,
    category: "Climate",
    region: "Global",
    title: "2025 on Track to Be Among Top 3 Hottest Years, EU Climate Service Says",
    image: "https://images.unsplash.com/photo-1561470508-fd4df1ed90b2?auto=format&fit=crop&w=1000&q=80",
    framing: { left: 33, center: 34, right: 33 },
  })),
  {
    ...latestArticles[2],
    id: "fed-rates",
    sourceCount: 13,
    category: "Economy",
    region: "United States",
    title: "Fed Holds Rates Steady, Signals Caution on Inflation and Growth Outlook",
    image: "https://images.unsplash.com/photo-1589994965851-a8f479c573a9?auto=format&fit=crop&w=1000&q=80",
    framing: { left: 30, center: 45, right: 25 },
  },
].slice(0, 12)

export default function Home() {
  return (
    <>
      <SiteHeader />
      <section className="overflow-hidden border-b border-border">
        <div className="relative mx-auto grid w-[min(calc(100%-32px),1160px)] items-end gap-10 py-14 md:py-18 lg:min-h-107.5 lg:grid-cols-[2fr_0.75fr] lg:gap-16 lg:pt-20 lg:pb-16 before:absolute before:top-14 before:-right-36 before:size-85 before:rounded-full before:border before:border-zinc-200 after:absolute after:top-28 after:-right-14 after:size-52.5 after:rounded-full after:border after:border-zinc-200 lg:before:right-[4%] lg:after:right-[10%]">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.08em] text-zinc-600 uppercase [&_svg]:size-4.5 [&_svg]:stroke-2 [&_svg]:text-right">
              <SparkIcon />
              News with more context
            </div>
            <h1 className="my-5 max-w-200 text-[clamp(40px,12vw,58px)] leading-[1.02] font-bold tracking-[-0.06em] md:text-[clamp(42px,5.8vw,76px)]">
              See the story.
              <br />
              Understand the framing.
            </h1>
            <p className="mb-8 max-w-155 text-[15px] leading-[1.7] text-zinc-600 md:text-[17px]">
              Balanced news coverage, powered by AI. Compare how stories are framed and make up your own mind.
            </p>
            <a
              className="inline-flex min-h-11 items-center justify-center gap-2.5 rounded-md border border-foreground bg-foreground px-5 text-[13px] font-semibold text-white shadow-soft-sm transition hover:-translate-y-px hover:bg-zinc-800 [&_svg]:size-4.5 [&_svg]:stroke-2"
              href="#top-news"
            >
              Explore today&apos;s stories
              <ArrowRightIcon />
            </a>
          </div>
          <div className="relative z-10 max-w-130 border-t border-foreground pt-5.5">
            <span className="text-[11px] font-semibold">01</span>
            <p className="mt-4.5 text-[13px] leading-relaxed text-zinc-600">
              Every analysis separates article sentiment from political framing, with confidence and evidence shown
              clearly.
            </p>
          </div>
        </div>
      </section>
      <main className="mx-auto w-[min(calc(100%-32px),1160px)] py-8 sm:py-10" id="top-news">
        <h1 className="mb-5 text-2xl font-semibold tracking-[-0.04em] sm:text-[28px]">Top News</h1>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {topNews.map((article) => (
            <CompactNewsCard article={article} key={article.id} />
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
