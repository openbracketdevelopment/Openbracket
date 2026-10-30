import Link from "next/link"
export default function NotFound() {
  return (
    <main id="main" className="wrap section not-found">
      <p className="eyebrow">ERROR 404 / FILE NOT FOUND</p>
      <div className="error-code" aria-hidden="true">
        [404]
      </div>
      <h1>
        A little off track.
        <br />
        <em>Still in good company.</em>
      </h1>
      <p>This page may have moved, or the address may be incomplete.</p>
      <div className="hero-actions">
        <Link className="button" href="/">
          Back to home ↗
        </Link>
        <a className="text-link" href="/sitemap">
          Browse the sitemap ↗
        </a>
      </div>
    </main>
  )
}
