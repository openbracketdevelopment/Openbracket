import { test } from "node:test"
import assert from "node:assert/strict"
import robots from "../app/robots"
import { metadata as services } from "../app/services/page"
import { metadata as about } from "../app/about/page"
import { metadata as work } from "../app/work/page"
import { metadata as contact } from "../app/contact/page"
import { metadata as privacy } from "../app/privacy/page"
import { metadata as sitemap } from "../app/sitemap/page"

test("public pages have distinct metadata, canonical paths, and matching sharing images", () => {
  const pages = { services, about, work, contact, privacy, sitemap }
  assert.equal(new Set(Object.values(pages).map(page => page.title)).size, 6)
  for (const [path, page] of Object.entries(pages)) {
    assert.ok(page.description)
    assert.equal(page.alternates?.canonical, `/${path}`)
    assert.ok(
      JSON.stringify(page.openGraph?.images).includes(
        `/${path}/opengraph-image`,
      ),
    )
    assert.ok(JSON.stringify(page.twitter).includes(`/${path}/opengraph-image`))
  }
})
test("preview robots prevent crawling while production retains the sitemap", () => {
  const old = process.env.CONTEXT
  try {
    process.env.CONTEXT = "deploy-preview"
    assert.deepEqual(robots().rules, { userAgent: "*", disallow: "/" })
    process.env.CONTEXT = "production"
    assert.deepEqual(robots().rules, {
      userAgent: "*",
      allow: "/",
      disallow: "/api/",
    })
    assert.equal(robots().sitemap, "https://openbracket.io/sitemap.xml")
  } finally {
    if (old === undefined) delete process.env.CONTEXT
    else process.env.CONTEXT = old
  }
})
