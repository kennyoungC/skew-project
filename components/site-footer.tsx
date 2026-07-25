import { Brand } from "@/components/brand";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        <div>
          <Brand />
          <p className="site-footer__tagline">
            Balanced news coverage, powered by AI.
          </p>
        </div>
        <nav className="site-footer__column" aria-label="News links">
          <strong>Explore</strong>
          <a href="#latest">Latest news</a>
          <a href="#top-story">Featured story</a>
          <a href="#latest">Topics</a>
        </nav>
        <nav className="site-footer__column" aria-label="About links">
          <strong>About</strong>
          <a href="#methodology">Our methodology</a>
          <a href="#methodology">Editorial principles</a>
          <a href="#methodology">Contact</a>
        </nav>
      </div>
      <div className="container site-footer__bottom">
        <span>© 2026 Biasly News</span>
        <span>Stay curious. Stay informed.</span>
      </div>
    </footer>
  );
}
