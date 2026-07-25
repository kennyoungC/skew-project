import { CompactNewsCard } from "@/components/compact-news-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { featuredArticle, latestArticles } from "@/lib/demo-news";

const topNews = [
  {
    ...featuredArticle,
    source: "Capitol Report",
    category: "Politics",
    region: "United States",
    title:
      "Trump Sends Iran Revised Peace Proposal With Tougher Terms: Report",
    image:
      "https://images.unsplash.com/photo-1569285645462-a3f9c6332d56?auto=format&fit=crop&w=1000&q=80",
    framing: { left: 20, center: 31, right: 49 },
  },
  {
    ...latestArticles[4],
    id: "grapes-superfood",
    sourceCount: 7,
    category: "Health",
    region: "United States",
    title:
      "Researchers Make Case for Grapes as a ‘Superfood’ After Review of Health Evidence",
    image:
      "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=1000&q=80",
    framing: { left: 18, center: 42, right: 40 },
  },
  {
    ...latestArticles[1],
    id: "cern-physics",
    sourceCount: 8,
    category: "Science",
    region: "Switzerland",
    title: "CERN Finds High-Significance Hint of Physics Beyond Standard Model",
    image:
      "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1000&q=80",
    framing: { left: 16, center: 62, right: 22 },
  },
  ...latestArticles.slice(6),
  {
    ...latestArticles[3],
    id: "oil-prices-opec",
    title: "Oil Prices Dip as OPEC+ Considers Output Increase Amid Weak Demand",
    sourceCount: 11,
    image:
      "https://images.unsplash.com/photo-1545459720-aac8509eb02c?auto=format&fit=crop&w=1000&q=80",
    framing: { left: 22, center: 50, right: 28 },
  },
  ...latestArticles.slice(0, 1).map((article) => ({
    ...article,
    id: "extreme-heat",
    sourceCount: 14,
    category: "Climate",
    region: "Global",
    title:
      "2025 on Track to Be Among Top 3 Hottest Years, EU Climate Service Says",
    image:
      "https://images.unsplash.com/photo-1561470508-fd4df1ed90b2?auto=format&fit=crop&w=1000&q=80",
    framing: { left: 33, center: 34, right: 33 },
  })),
  {
    ...latestArticles[2],
    id: "fed-rates",
    sourceCount: 13,
    category: "Economy",
    region: "United States",
    title: "Fed Holds Rates Steady, Signals Caution on Inflation and Growth Outlook",
    image:
      "https://images.unsplash.com/photo-1589994965851-a8f479c573a9?auto=format&fit=crop&w=1000&q=80",
    framing: { left: 30, center: 45, right: 25 },
  },
].slice(0, 12);

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main
        className="mx-auto w-[min(calc(100%-32px),1160px)] py-8 sm:py-10"
        id="top-news"
      >
        <h1 className="mb-5 text-2xl font-semibold tracking-[-0.04em] sm:text-[28px]">
          Top News
        </h1>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {topNews.map((article) => (
            <CompactNewsCard article={article} key={article.id} />
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
