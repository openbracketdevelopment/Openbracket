import Icon from "../../components/icon"
import type { Metadata } from "next"
import ContactForm from "../../components/contact-form"
import { site } from "../../data/site"
export const metadata: Metadata = {
  title: "Contact",
  description:
    "Tell OpenBracket about your website or application project. Based in Dallas–Fort Worth.",
  openGraph: {
    description:
      "Tell OpenBracket about your website or application project. Based in Dallas–Fort Worth.",
    title: "Let’s build something useful | OpenBracket",
    url: "/contact",
    images: [
      {
        url: "/contact/opengraph-image",
        width: 1200,
        height: 630,
        alt: "OpenBracket — Let’s build something useful",
      },
    ],
  },
  twitter: {
    description:
      "Tell OpenBracket about your website or application project. Based in Dallas–Fort Worth.",
    card: "summary_large_image",
    images: ["/contact/opengraph-image"],
  },
  alternates: { canonical: "/contact" },
}
export default function Contact() {
  return (
    <main id="main" className="wrap contact-page">
      <div className="contact-copy">
        <p className="eyebrow">OPENBRACKET / START A CONVERSATION</p>
        <h1>
          Big idea?
          <br />
          Small question?
          <br />
          <em>We’re all ears.</em>
        </h1>
        <p className="intro">
          Tell us about your business and what you’d like to make happen. You
          don’t need to have every detail figured out.
        </p>
        <div className="contact-links">
          <a href={`mailto:${site.email}`}>
            {site.email} <Icon name="external" />
          </a>
          <a href={`tel:${site.phone}`}>
            {site.phone} <Icon name="external" />
          </a>
        </div>
        <p className="mono location">DALLAS–FORT WORTH, TEXAS</p>
        <div className="contact-note">
          <span className="mono">WHAT HAPPENS NEXT?</span>
          <p>
            We’ll read your inquiry and get in touch to understand the project,
            discuss fit, and work out a sensible next step.
          </p>
        </div>
      </div>
      <ContactForm />
    </main>
  )
}
