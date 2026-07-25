import { ArrowRightIcon, SparkIcon } from "@/components/icons";
import { NewsCard } from "@/components/news-card";
import { SectionHeading } from "@/components/section-heading";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { categories, featuredArticle, latestArticles } from "@/lib/demo-news";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="hero">
          <div className="container">
            <div className="hero__content">
              <div className="eyebrow">
                <SparkIcon />
                News with more context
              </div>
              <h1>See the story.<br />Understand the framing.</h1>
              <p className="hero__lede">
                Balanced news coverage, powered by AI. Compare how stories are
                framed and make up your own mind.
              </p>
              <a className="button button--primary" href="#latest">
                Explore today&apos;s stories
                <ArrowRightIcon />
              </a>
            </div>
            <div className="hero__note">
              <span className="hero__note-index">01</span>
              <p>
                Every analysis separates article sentiment from political
                framing, with confidence and evidence shown clearly.
              </p>
            </div>
          </div>
        </section>

        <nav className="category-bar" aria-label="News categories">
          <div className="container category-bar__inner">
            {categories.map((category, index) => (
              <a
                className={`chip${index === 0 ? " chip--active" : ""}`}
                href="#latest"
                key={category}
              >
                {category}
              </a>
            ))}
          </div>
        </nav>

        <section className="section container" aria-labelledby="top-story">
          <SectionHeading
            eyebrow="Featured"
            id="top-story"
            title="The story shaping the conversation"
          />
          <NewsCard article={featuredArticle} featured />
        </section>

        <section
          className="section section--latest container"
          id="latest"
          aria-labelledby="latest-heading"
        >
          <SectionHeading
            eyebrow="Latest"
            id="latest-heading"
            title="Today’s essential stories"
            action="View all news"
          />
          <div className="news-grid">
            {latestArticles.map((article) => (
              <NewsCard article={article} key={article.id} />
            ))}
          </div>
        </section>

        <section className="methodology" id="methodology">
          <div className="container methodology__inner">
            <div>
              <span className="eyebrow eyebrow--light">Our approach</span>
              <h2>Clarity without claiming certainty.</h2>
            </div>
            <p>
              Biasly uses AI to estimate sentiment and political framing from
              an article&apos;s language—not its publisher. Scores are signals
              for comparison, not declarations of objective truth.
            </p>
            <a className="text-link text-link--light" href="#top-story">
              How our analysis works
              <ArrowRightIcon />
            </a>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
