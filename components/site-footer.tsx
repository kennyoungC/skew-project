import { Brand } from "@/components/brand";

const footerGroups = [
  { title: "Company", links: ["About", "Careers", "Press", "Contact"] },
  {
    title: "Help",
    links: ["Help Center", "Guides", "Privacy Policy", "Terms of Service"],
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-[#1b1c1e] text-white">
      <div className="mx-auto grid w-[min(calc(100%-32px),1160px)] grid-cols-2 gap-10 py-10 sm:grid-cols-4">
        <div className="col-span-2 sm:col-span-1">
          <Brand inverse />
          <p className="mt-6 max-w-40 text-[10px] leading-relaxed text-zinc-300">
            Balanced news coverage
            <br />
            powered by AI.
          </p>
        </div>
        {footerGroups.map((group) => (
          <nav className="flex flex-col items-start gap-2" key={group.title}>
            <strong className="mb-1 text-[10px]">{group.title}</strong>
            {group.links.map((link) => (
              <a
                className="text-[10px] text-zinc-300 transition hover:text-white"
                href="#top-news"
                key={link}
              >
                {link}
              </a>
            ))}
          </nav>
        ))}
        <div>
          <strong className="text-[10px]">Connect</strong>
          <div className="mt-4 flex gap-4 text-sm text-zinc-200">
            <a href="#top-news" aria-label="X">𝕏</a>
            <a href="#top-news" aria-label="LinkedIn">in</a>
            <a href="#top-news" aria-label="Instagram">◎</a>
            <a href="#top-news" aria-label="YouTube">▶</a>
          </div>
        </div>
      </div>
      <div className="border-t border-zinc-700">
        <div className="mx-auto w-[min(calc(100%-32px),1160px)] py-4 text-[9px] text-zinc-400">
          © 2026 Biasly News. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
