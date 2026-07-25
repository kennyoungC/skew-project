import Image from "next/image";
import Link from "next/link";
import { BiasMeter } from "@/components/bias-meter";
import { InfoIcon } from "@/components/icons";
import type { DemoArticle } from "@/lib/demo-news";

export function CompactNewsCard({ article }: { article: DemoArticle }) {
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
            {article.category}
          </strong>
          <span className="mx-1">·</span>
          {article.region}
        </p>
        <h2 className="mt-2 mb-3 line-clamp-3 text-base leading-[1.28] font-semibold tracking-[-0.025em]">
          <Link href={`/news/${article.id}`}>{article.title}</Link>
        </h2>
        <div className="mt-auto">
          <BiasMeter framing={article.framing} compact />
          <p className="mt-4 text-[10px] font-medium">
            {article.sourceCount} sources
          </p>
        </div>
      </div>
    </article>
  );
}
