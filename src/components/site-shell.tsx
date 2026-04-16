"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { siteContent } from "@/content/site";

type SiteShellProps = {
  children: React.ReactNode;
};

export function SiteShell({ children }: SiteShellProps) {
  const pathname = usePathname();

  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="site-header__inner">
          <Link className="site-brand" href="/">
            {siteContent.site.name}
          </Link>

          <nav className="site-nav" aria-label="Primary">
            {siteContent.navItems.map((item) => {
              const isActive =
                item.href === "/" ? pathname === item.href : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  className={isActive ? "site-nav__link is-active" : "site-nav__link"}
                  href={item.href}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main>{children}</main>

      <footer className="site-footer">
        <div className="site-footer__inner">
          <div>
            <p className="site-footer__brand">{siteContent.site.name}</p>
            <p className="site-footer__text">{siteContent.site.description}</p>
          </div>

          <div className="site-footer__links">
            <Link href="/cottage-disclosure">Cottage Disclosure</Link>
            <a href={siteContent.site.orderUrl}>Order Inquiry</a>
            <a href={`mailto:${siteContent.site.email}`}>{siteContent.site.email}</a>
          </div>
        </div>

        <div className="site-footer__bar">
          <div className="site-footer__disclosure">
            <p>
              <strong>{siteContent.disclosure.title}:</strong>
            </p>
            <p>{siteContent.disclosure.body}</p>
            <p>{siteContent.disclosure.storage}</p>
            <p>{siteContent.disclosure.pets}</p>
          </div>
          <p>{new Date().getFullYear()} Hadley&apos;s Kitchen</p>
        </div>
      </footer>
    </div>
  );
}
