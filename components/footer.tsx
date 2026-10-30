import Link from "next/link"
import Image from "next/image"
import { navigation, site } from "../data/site"
export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap footer-top">
        <div>
          <Link
            className="brand brand-horizontal"
            href="/"
            aria-label="OpenBracket home"
          >
            <Image
              className="logo-on-dark"
              src="/brand/openbracket-horizontal-dark.svg"
              alt="OpenBracket Development"
              width={700}
              height={150}
            />
            <Image
              className="logo-on-light"
              src="/brand/openbracket-horizontal-light.svg"
              alt="OpenBracket Development"
              width={700}
              height={150}
            />
          </Link>
          <p>
            A small studio for thoughtful websites
            <br />
            and useful digital tools.
          </p>
          <span className="mono">{site.location}</span>
        </div>
        <nav aria-label="Footer navigation">
          {[...navigation, { href: "/contact", label: "Contact" }].map(link => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
        <div>
          <p className="mono">START A CONVERSATION</p>
          <a className="footer-email" href={`mailto:${site.email}`}>
            {site.email} ↗
          </a>
          <a className="phone" href={`tel:${site.phone}`}>
            {site.phone}
          </a>
        </div>
      </div>
      <div className="wrap footer-bottom">
        <span>© {new Date().getFullYear()} OpenBracket Development</span>
        <div>
          <a href="/privacy">Privacy</a>
          <a href="/sitemap">Sitemap</a>
          <a href="#main">Back to top ↑</a>
        </div>
      </div>
    </footer>
  )
}
