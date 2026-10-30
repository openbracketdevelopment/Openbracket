import type { Metadata } from "next"
import { navigation } from "../../data/site"
export const metadata: Metadata = {
  title: "Sitemap",
  description: "Find your way around the OpenBracket website.",
  alternates: { canonical: "/sitemap" },
}
export default function SitemapPage() {
  return (
    <main id="main" className="wrap section sitemap-page">
      <p className="eyebrow">OPENBRACKET / DIRECTORY</p>
      <h1>
        Everything
        <br />
        <em>in its place.</em>
      </h1>
      <nav aria-label="Site directory">
        {[
          ...navigation,
          { href: "/contact", label: "Contact" },
          { href: "/privacy", label: "Privacy information" },
          { href: "/sitemap", label: "Sitemap" },
        ].map((link, i) => (
          <a href={link.href} key={link.href}>
            <span className="mono">0{i + 1}</span>
            {link.label}
            <span>↗</span>
          </a>
        ))}
      </nav>
    </main>
  )
}
