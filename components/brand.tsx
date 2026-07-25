import Link from "next/link";

export function Brand({ inverse = false }: { inverse?: boolean }) {
  return (
    <Link
      className="inline-flex items-end gap-2 text-[27px] leading-none font-bold tracking-[-0.065em]"
      href="/"
      aria-label="Biasly News home"
    >
      <span className="relative after:absolute after:right-0.5 after:bottom-px after:size-[5px] after:rounded-full after:bg-right">
        biasly
      </span>
      <span
        className={`mb-px text-[10px] font-semibold tracking-[0.03em] ${
          inverse ? "text-zinc-400" : "text-secondary"
        }`}
      >
        News
      </span>
    </Link>
  );
}
