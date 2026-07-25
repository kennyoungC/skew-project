import { Brand } from "@/components/brand";
import { MenuIcon, SearchIcon } from "@/components/icons";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Brand />
        <nav className="site-nav" aria-label="Primary navigation">
          <a href="#latest">Latest</a>
          <a href="#top-story">Politics</a>
          <a href="#latest">World</a>
          <a href="#latest">Business</a>
          <a href="#latest">Technology</a>
        </nav>
        <div className="site-header__actions">
          <button className="icon-button" type="button" aria-label="Search news">
            <SearchIcon />
          </button>
          <a className="button button--quiet" href="#latest">
            Sign in
          </a>
          <button
            className="icon-button"
            type="button"
            aria-label="Open navigation menu"
          >
            <MenuIcon />
          </button>
        </div>
      </div>
    </header>
  );
}
