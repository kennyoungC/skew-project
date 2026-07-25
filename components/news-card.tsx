import Image from "next/image";
import { BiasMeter } from "@/components/bias-meter";
import { BookmarkIcon, ClockIcon } from "@/components/icons";
import type { DemoArticle } from "@/lib/demo-news";

export function NewsCard({
  article,
  featured = false,
}: {
  article: DemoArticle;
  featured?: boolean;
}) {
  return (
    <article className={`news-card${featured ? " news-card--featured" : ""}`}>
      <a className="news-card__image-wrap" href="#methodology" tabIndex={-1}>
        <Image
          className="news-card__image"
          src={article.image}
          alt=""
          fill
          sizes={
            featured
              ? "(max-width: 960px) 100vw, 60vw"
              : "(max-width: 640px) 100vw, (max-width: 960px) 50vw, 33vw"
          }
          priority={featured}
        />
      </a>
      <div className="news-card__content">
        <div className="news-card__meta">
          <span className="news-card__source">{article.source}</span>
          <span className="news-card__dot" />
          <span>{article.category}</span>
        </div>
        <h3>
          <a href="#methodology">{article.title}</a>
        </h3>
        <p className="news-card__summary">{article.summary}</p>
        <div className="news-card__analysis">
          <BiasMeter framing={article.framing} />
        </div>
        <div className="news-card__footer">
          <span>
            <ClockIcon />
            {article.published}
          </span>
          <span>{article.readTime} read</span>
          <button
            className="icon-button news-card__bookmark"
            type="button"
            aria-label={`Bookmark ${article.title}`}
          >
            <BookmarkIcon />
          </button>
        </div>
      </div>
    </article>
  );
}
