import Icon from "../../components/icon"
import type { Metadata } from "next"
import ClosingCta from "../../components/closing-cta"
export const metadata: Metadata = {
  title: "About the studio",
  description:
    "Meet OpenBracket, a small Dallas–Fort Worth studio bringing design and development together.",
  openGraph: {
    description:
      "Meet OpenBracket, a small Dallas–Fort Worth studio bringing design and development together.",
    title: "An independent development studio | OpenBracket",
    url: "/about",
    images: [
      {
        url: "/about/opengraph-image",
        width: 1200,
        height: 630,
        alt: "OpenBracket — An independent development studio",
      },
    ],
  },
  twitter: {
    description:
      "Meet OpenBracket, a small Dallas–Fort Worth studio bringing design and development together.",
    card: "summary_large_image",
    images: ["/about/opengraph-image"],
  },
  alternates: { canonical: "/about" },
}
const principles = [
  [
    "Direct communication",
    "Talk through the decisions with the people doing the work. Ask questions, share feedback, and stay part of the process.",
    "conversation",
  ],
  [
    "Practical problem-solving",
    "Start with what your business needs. Choose a sensible approach that fits the problem and can grow with you.",
    "puzzle",
  ],
  [
    "Design and development, together",
    "Think about how it looks and how it works at the same time. The details are better when both sides inform each other.",
    "layers",
  ],
  [
    "Care beyond the surface",
    "Accessibility, performance, and maintainability belong in the conversation from the beginning, alongside the visual design.",
    "shield",
  ],
] as const
export default function About() {
  return (
    <main id="main">
      <section className="page-intro wrap">
        <p className="eyebrow">OPENBRACKET / THE STUDIO</p>
        <h1>
          Small by design.
          <br />
          <em>Open to possibilities.</em>
        </h1>
        <p className="intro">
          A Dallas–Fort Worth development studio for businesses that value
          thoughtful work and a straightforward relationship.
        </p>
      </section>
      <section className="paper section">
        <div className="wrap split">
          <div className="bracket-poster ink" aria-hidden="true">
            <span>[</span>
            <div>
              IDEAS IN.
              <br />
              <b>
                GOOD
                <br />
                THINGS OUT.
              </b>
            </div>
            <span>]</span>
          </div>
          <div>
            <p className="eyebrow">A LITTLE ABOUT US</p>
            <h2>
              Creative thinking.
              <br />
              Technical know-how.
            </h2>
            <p className="large-copy">
              OpenBracket brings an advertising and web development background
              to useful, well-crafted websites and applications.
            </p>
            <p>
              We help business owners and founders work through the questions
              between an idea and a finished product. What should it do? Who is
              it for? How can it be easier to use?
            </p>
            <p>
              Working with a small studio means direct collaboration, thoughtful
              decisions, and practical delivery. We keep the conversation
              focused on what suits your business.
            </p>
          </div>
        </div>
      </section>
      <section className="section wrap">
        <p className="eyebrow">WHAT GUIDES THE WORK</p>
        <div className="principles">
          {principles.map(([title, text, icon], i) => (
            <article key={title}>
              <div className="principle-heading">
                <Icon name={icon} className="feature-icon" />
                <span className="mono">0{i + 1} /</span>
              </div>
              <h2>{title}</h2>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>
      <ClosingCta />
    </main>
  )
}
