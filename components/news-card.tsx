import Image from "next/image"
import { BiasMeter } from "@/components/bias-meter"
import { BookmarkIcon, ClockIcon } from "@/components/icons"
import type { DemoArticle } from "@/lib/demo-news"

export function NewsCard({ article, featured = false }: { article: DemoArticle; featured?: boolean }) {
  return (
    <article
      className={`group overflow-hidden rounded-lg border border-border bg-surface shadow-soft-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-soft-md ${
        featured ? "grid lg:grid-cols-[1.45fr_0.9fr]" : ""
      }`}
    >
      <a
        className={`relative overflow-hidden bg-center ${
          featured ? "aspect-video lg:min-h-107.5 lg:aspect-auto" : "aspect-16/10"
        }`}
        href="#methodology"
        tabIndex={-1}
      >
        <Image
          className="object-cover transition-transform duration-500 group-hover:scale-[1.025]"
          src={article.image}
          alt=""
          fill
          sizes={
            featured ? "(max-width: 960px) 100vw, 60vw" : "(max-width: 640px) 100vw, (max-width: 960px) 50vw, 33vw"
          }
          priority={featured}
        />
      </a>
      <div className={`flex flex-col p-5 sm:p-5.5 ${featured ? "justify-center lg:p-[clamp(28px,4vw,52px)]" : ""}`}>
        <div className="flex items-center gap-2 text-[11px] font-medium text-secondary">
          <span className="font-semibold text-foreground">{article.source}</span>
          <span className="size-0.75 rounded-full bg-zinc-400" />
          <span>{article.category}</span>
        </div>
        <h3
          className={`mt-3 mb-2.5 font-semibold tracking-[-0.025em] ${
            featured ? "text-2xl leading-[1.2] sm:text-[clamp(25px,3vw,36px)]" : "text-lg leading-[1.35]"
          }`}
        >
          <a href="#methodology">{article.title}</a>
        </h3>
        <p
          className={`line-clamp-2 text-[13px] leading-relaxed text-zinc-600 ${
            featured ? "sm:line-clamp-3 sm:text-sm" : ""
          }`}
        >
          {article.summary}
        </p>
        <div className="mt-6">
          <BiasMeter framing={article.framing} />
        </div>
        <div className="mt-5 flex items-center gap-4 border-t border-divider pt-4 text-[11px] text-zinc-600">
          <span className="inline-flex items-center gap-1.5">
            <ClockIcon className="size-3.75" />
            {article.published}
          </span>
          <span>{article.readTime} read</span>
          <button
            className="ml-auto grid size-10 cursor-pointer place-items-center rounded-full transition-colors hover:bg-black/5"
            type="button"
            aria-label={`Bookmark ${article.title}`}
          >
            <BookmarkIcon className="size-3.75" />
          </button>
        </div>
      </div>
    </article>
  )
}
