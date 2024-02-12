import * as React from "react"
import { Link } from "gatsby"
import { StaticImage } from "gatsby-plugin-image"

import Layout from "../components/layout"
import Seo from "../components/seo"
import * as styles from "../components/index.module.css"

const links = [
  {
    text: "Tutorial",
    url: "https://www.gatsbyjs.com/docs/tutorial",
    description:
      "A great place to get started if you're new to web development. Designed to guide you through setting up your first Gatsby site.",
  },
  {
    text: "Examples",
    url: "https://github.com/gatsbyjs/gatsby/tree/master/examples",
    description:
      "A collection of websites ranging from very basic to complex/complete that illustrate how to accomplish specific tasks within your Gatsby sites.",
  },
  {
    text: "Plugin Library",
    url: "https://www.gatsbyjs.com/plugins",
    description:
      "Learn how to add functionality and customize your Gatsby site or app with thousands of plugins built by our amazing developer community.",
  },
  {
    text: "Build and Host",
    url: "https://www.gatsbyjs.com/cloud",
    description:
      "Now you’re ready to show the world! Give your Gatsby site superpowers: Build and host on Gatsby Cloud. Get started for free!",
  },
]

const samplePageLinks = [
  {
    text: "Page 2",
    url: "page-2",
    badge: false,
    description:
      "A simple example of linking to another page within a Gatsby site",
  },
  { text: "TypeScript", url: "using-typescript" },
  { text: "Server Side Rendering", url: "using-ssr" },
  { text: "Deferred Static Generation", url: "using-dsg" },
]

const moreLinks = [
  { text: "Join us on Discord", url: "https://gatsby.dev/discord" },
  {
    text: "Documentation",
    url: "https://gatsbyjs.com/docs/",
  },
  {
    text: "Starters",
    url: "https://gatsbyjs.com/starters/",
  },
  {
    text: "Showcase",
    url: "https://gatsbyjs.com/showcase/",
  },
  {
    text: "Contributing",
    url: "https://www.gatsbyjs.com/contributing/",
  },
  { text: "Issues", url: "https://github.com/gatsbyjs/gatsby/issues" },
]

const utmParameters = `?utm_source=starter&utm_medium=start-page&utm_campaign=default-starter`

const IndexPage = () => (
  <Layout>
    <div className={`${styles.textCenter} ${styles.contentCenter}`}>
      <h1>
        <StaticImage
          src="../images/ob-logo-reversed.png"
          loading="eager"
          width={300}
          quality={95}
          formats={["auto", "webp", "avif"]}
          alt="OpenBracket Development"
          style={{
            marginBottom: `var(--space-5)`,
            marginTop: `var(--space-3)`,
          }}
        />
      </h1>
      <p>
        Please bear with us while we make updates to our new site to better
        serve you and give you a better and fun experience.
      </p>
      <p>
        If it's your first time here, I'd like to thank you stopping by and
        checking us out.
      </p>
      <p>
        A little about us... We are a small web studio based in Dallas/Fort
        Worth who builds really cool, engaging and unique web experiences. We
        are in the business of helping you build and grow your business on the
        net.
      </p>
      <h2>Services We Offer</h2>
      <ul>
        <li>Custom Website Design and Development</li>
        <li>UI/UX Design & Prototyping</li>
        <li>Wireframing and Sitemaps</li>
        <li>Bespoke Theme & Plugin development</li>
        <li>Strategy & Planning</li>
        <li>Branding & Logo Design</li>
        <li>Content Management Systems</li>
        <li>API Integration</li>
        <li>Search Engine Optimization (SEO)</li>
        <li>Web Hosting & Deployment</li>
        <li>Server management</li>
        <li>Email Set Up</li>
        <li>Custom HTML Emailer Design</li>
        <li>Responsive Optimization</li>
        <li>Cross-Browser Testing</li>
        <li>Performance Optimizations</li>
        <li>Content Delivery Network (CDN)</li>
        <li>Security Audits & Enhancements</li>
        <li>Analytics & Tracking</li>
        <li>Website Maintenance and Monitoring</li>
        <li>E-Commerce</li>
        <li>CMS Training</li>
        <li>Video Production & Animation</li>
        <li>Photography</li>
      </ul>
    </div>
  </Layout>
)

/**
 * Head export to define metadata for the page
 *
 * See: https://www.gatsbyjs.com/docs/reference/built-in-components/gatsby-head/
 */
export const Head = () => <Seo title="Home" />

export default IndexPage
