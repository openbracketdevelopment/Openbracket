import Icon from "../../components/icon"
import type { Metadata } from "next"
import { site } from "../../data/site"
export const metadata: Metadata = {
  title: "Privacy information",
  description:
    "How OpenBracket handles information submitted through this website.",
  openGraph: {
    description:
      "How OpenBracket handles information submitted through this website.",
    title: "Your privacy, clearly explained | OpenBracket",
    url: "/privacy",
    images: [
      {
        url: "/privacy/opengraph-image",
        width: 1200,
        height: 630,
        alt: "OpenBracket — Your privacy, clearly explained",
      },
    ],
  },
  twitter: {
    description:
      "How OpenBracket handles information submitted through this website.",
    card: "summary_large_image",
    images: ["/privacy/opengraph-image"],
  },
  alternates: { canonical: "/privacy" },
}
export default function Privacy() {
  return (
    <main id="main" className="wrap legal section">
      <p className="eyebrow">OPENBRACKET / PRIVACY</p>
      <h1>
        Your inquiry.
        <br />
        <em>Handled with care.</em>
      </h1>
      <p>
        This page describes the current website implementation. Contact{" "}
        <a href={`mailto:${site.email}`}>{site.email}</a> with questions about
        your information.
      </p>
      <h2>Information you choose to send</h2>
      <p>
        The contact form asks for your name, email address, phone number,
        project type, and project description. Company, budget range, and timing
        are optional. We use these details to respond to your inquiry and
        discuss potential work. Please avoid sending passwords or sensitive
        personal information.
      </p>
      <h2>Email delivery</h2>
      <p>
        Form messages are transmitted to our email provider, Resend, for
        delivery to the studio inbox and a confirmation to you. Your address is
        used as the reply address. Our application does not keep a separate
        database of inquiries or log message content. Email services and the
        receiving mailbox process and store messages as part of delivery.{" "}
        <a href="https://resend.com/legal/privacy-policy">
          Read Resend’s privacy policy <Icon name="external" />
        </a>
        .
      </p>
      <h2>Technical information and spam prevention</h2>
      <p>
        The hosting provider may process IP addresses and request information to
        operate and secure the site. When the form is enabled in production, a
        hashed identifier derived from your IP address is sent to Upstash Redis
        to limit repeated requests. Rate-limit counters expire after ten
        minutes. A hash of inquiry fields and submission state is retained for
        24 hours to prevent duplicate emails; the form fields themselves are not
        stored in Redis. The form also includes an automated-spam trap.
      </p>
      <h2>Analytics and cookies</h2>
      <p>
        No analytics, advertising trackers, or marketing cookies are configured
        in this application. Your browser stores your theme preference locally.
        Sound starts automatically when browser playback permissions allow it;
        your explicit sound preference is saved locally. These settings are not
        sent to an analytics service. Hosting infrastructure may process
        technical request data. This description will need updating if
        additional services are introduced.
      </p>
      <h2>Questions and requests</h2>
      <p>
        To ask about information you have submitted or request its deletion,
        email <a href={`mailto:${site.email}`}>{site.email}</a>. We do not
        publish a fixed message-retention period here; contact the studio for
        details about an inquiry.
      </p>
    </main>
  )
}
