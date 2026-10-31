import Icon from "../../components/icon"
import type { CSSProperties } from "react"
import type { Metadata } from "next"
import Image from "next/image"
import { projects, workBrands } from "../../data/work"
import ClosingCta from "../../components/closing-cta"
export const metadata: Metadata = {
  title: "Work & professional experience",
  description:
    "Selected websites, e-commerce experiences, and interface design from Tam Pham’s professional portfolio, with individual roles and collaboration credits.",
  openGraph: {
    description:
      "Selected websites, e-commerce experiences, and interface design from Tam Pham’s professional portfolio, with individual roles and collaboration credits.",
    title: "Selected websites & digital experiences | OpenBracket",
    url: "/work",
    images: [
      {
        url: "/work/opengraph-image",
        width: 1200,
        height: 630,
        alt: "OpenBracket — Selected websites & digital experiences",
      },
    ],
  },
  twitter: {
    description:
      "Selected websites, e-commerce experiences, and interface design from Tam Pham’s professional portfolio, with individual roles and collaboration credits.",
    card: "summary_large_image",
    images: ["/work/opengraph-image"],
  },
  alternates: { canonical: "/work" },
}
export default function Work() {
  return (
    <main id="main">
      <section className="page-intro wrap work-intro">
        <p className="eyebrow">OPENBRACKET / SELECTED EXPERIENCE</p>
        <h1>
          Different challenges.
          <br />
          <em>The same care.</em>
        </h1>
        <div className="work-intro-bottom">
          <p className="intro">
            From connected content platforms and online stores to product
            launches and mobile interfaces. A selection of websites and digital
            experiences I’ve helped build.
          </p>
          <aside className="work-attribution">
            <span className="mono">A NOTE ON THE CREDITS</span>
            <p>
              I’m Tam Pham. These projects come from my professional experience,
              including employment and agency collaborations. They are not
              presented as direct OpenBracket client engagements. My
              contribution and the available credits are noted below.
            </p>
          </aside>
        </div>
        <nav className="anchor-links" aria-label="Featured projects">
          {projects.map(project => (
            <a key={project.id} href={`#${project.id}`}>
              {project.name} <Icon name="down" />
            </a>
          ))}
        </nav>
      </section>
      <section
        className="wrap work-selection"
        aria-labelledby="selection-title"
      >
        <div className="work-section-label">
          <h2 className="eyebrow" id="selection-title">
            01 / SELECTED PROJECTS
          </h2>
          <span className="mono">
            {String(projects.length).padStart(2, "0")} ENTRIES
          </span>
        </div>
        <div className="work-grid">
          {projects.map((project, index) => (
            <article className="work-project" id={project.id} key={project.id}>
              <div className="project-window">
                <div className="window-bar">
                  <span>
                    <span className="window-dots" aria-hidden="true">
                      <Icon name="dots" />
                    </span>{" "}
                    {String(index + 1).padStart(2, "0")} /{" "}
                    {project.category.toUpperCase()}
                  </span>
                  <span aria-hidden="true">
                    <Icon name="external" />
                  </span>
                </div>
                <a
                  href={project.caseStudy}
                  className="project-image-link"
                  aria-label={`Read ${project.name} case study on Tam’s portfolio`}
                >
                  <Image
                    src={project.image}
                    alt={project.imageAlt}
                    width={project.width}
                    height={project.height}
                    sizes="(max-width: 760px) 100vw, 50vw"
                    priority={index < 2}
                  />
                </a>
              </div>
              <div className="project-copy">
                <p className="eyebrow">{project.context}</p>
                <h2>{project.name}</h2>
                <p className="project-purpose">{project.purpose}</p>
                <div className="project-contribution">
                  <h3 className="mono">MY CONTRIBUTION</h3>
                  <p>{project.contribution}</p>
                  <p className="project-role">{project.role}</p>
                </div>
                <ul
                  className="project-technologies"
                  aria-label={`${project.name} technologies`}
                >
                  {project.technologies.map(technology => (
                    <li key={technology}>{technology}</li>
                  ))}
                </ul>
                {"gallery" in project && project.gallery && (
                  <details className="project-gallery">
                    <summary>View desktop + mobile screens</summary>
                    {project.gallery.map(screen => (
                      <a
                        key={screen.image}
                        href={project.caseStudy}
                        aria-label={`Read ${project.name} case study`}
                      >
                        <Image
                          src={screen.image}
                          alt={screen.alt}
                          width={screen.width}
                          height={screen.height}
                          sizes="(max-width: 760px) 100vw, 50vw"
                        />
                      </a>
                    ))}
                  </details>
                )}
                <div className="project-links">
                  <a className="text-link" href={project.caseStudy}>
                    Read the original case study <Icon name="external" />
                  </a>
                  {project.live && (
                    <a className="text-link" href={project.live}>
                      {project.id === "toro" ? "Visit Toro" : "Visit website"}{" "}
                      <Icon name="external" />
                    </a>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="work-brands section">
        <div className="wrap">
          <p className="eyebrow">02 / ACROSS MY PROFESSIONAL EXPERIENCE</p>
          <h2>
            Brands I’ve <em>worked with.</em>
          </h2>
          <p className="brands-caption">
            Through individual projects, employment, and team collaborations.
            Original brand marks from my portfolio.
          </p>
          <svg
            className="brand-color-filters"
            aria-hidden="true"
            focusable="false"
          >
            <defs>
              <filter
                id="brand-white-knockout"
                colorInterpolationFilters="sRGB"
              >
                <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  .2126 .7152 .0722 0 0" />
                <feComponentTransfer>
                  <feFuncA type="linear" slope="2" intercept="-1" />
                </feComponentTransfer>
                <feComposite in2="SourceAlpha" operator="in" />
              </filter>
            </defs>
          </svg>
          <div className="work-logo-grid">
            {workBrands.map(brand => (
              <div
                className={`work-logo${brand.knockout ? " work-logo-knockout" : ""}`}
                key={brand.name}
              >
                <div
                  className="work-logo-art"
                  style={{ "--logo-scale": brand.scale } as CSSProperties}
                >
                  <Image
                    src={brand.image}
                    alt={brand.alt}
                    width={brand.width}
                    height={brand.height}
                    sizes="(max-width: 760px) 40vw, 16vw"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <ClosingCta />
    </main>
  )
}
