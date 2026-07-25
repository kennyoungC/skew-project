import { ArrowRightIcon } from "@/components/icons"

export function SectionHeading({
  eyebrow,
  title,
  id,
  action,
}: {
  eyebrow: string
  title: string
  id: string
  action?: string
}) {
  return (
    <div className="mb-7 flex items-end justify-between gap-8 border-b border-border pb-5">
      <div>
        <span className="text-[11px] font-semibold tracking-[0.08em] text-secondary uppercase">{eyebrow}</span>
        <h2 className="mt-1.5 text-[clamp(23px,3vw,32px)] leading-tight font-semibold tracking-[-0.035em]" id={id}>
          {title}
        </h2>
      </div>
      {action ? (
        <a className="hidden shrink-0 items-center gap-2 text-xs font-semibold group sm:inline-flex" href="#latest">
          {action}
          <ArrowRightIcon className="size-4.5 stroke-2 transition-transform group-hover:translate-x-1" />
        </a>
      ) : null}
    </div>
  )
}
