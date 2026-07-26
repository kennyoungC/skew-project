import Image from "next/image";
import Link from "next/link";
import { BiasMeter } from "@/components/bias-meter";
import { InfoIcon } from "@/components/icons";
import { formatConfidence, type ArticleCardView } from "@/lib/news/presentation";

export function CompactNewsCard({ article }: { article: ArticleCardView }) {
  return (
    <article className="group flex min-h-full flex-col overflow-hidden rounded-lg border border-border bg-surface transition hover:-translate-y-0.5 hover:shadow-soft-md">
      <Link
        className="relative block aspect-video overflow-hidden bg-center"
        href={`/news/${article.id}`}
        tabIndex={-1}
      >
        <Image
          className="object-cover transition-transform duration-500 group-hover:scale-[1.025]"
          src={article.image}
          alt=""
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <span className="absolute top-3 right-3 grid size-5 place-items-center rounded-full bg-black/60 text-white backdrop-blur-sm">
          <InfoIcon className="size-4 stroke-[1.7]" />
        </span>
      </Link>
      <div className="flex flex-1 flex-col p-3.5">
        <p className="text-[10px] leading-tight text-zinc-600">
          <strong className="font-semibold text-foreground">
            {article.source}
          </strong>
          <span className="mx-1">·</span>
          {article.published}
        </p>
        <h2 className="mt-2 mb-3 line-clamp-3 text-base leading-[1.28] font-semibold tracking-[-0.025em]">
          <Link href={`/news/${article.id}`}>{article.title}</Link>
        </h2>
        <div className="mt-auto">
          <BiasMeter framing={article.framing} compact />
          <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-divider pt-3 text-[9px]">
            <div>
              <dt className="text-secondary">Sentiment</dt>
              <dd className="mt-0.5 font-semibold">{article.sentimentLabel}</dd>
            </div>
            <div>
              <dt className="text-secondary">AI framing</dt>
              <dd className="mt-0.5 font-semibold">{article.framingLabel}</dd>
            </div>
            <div>
              <dt className="text-secondary">Confidence</dt>
              <dd className="mt-0.5 font-semibold">
                {formatConfidence(article.confidence)}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </article>
  );
}
