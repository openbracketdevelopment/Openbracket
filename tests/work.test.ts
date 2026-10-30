import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync, existsSync } from "node:fs"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { JSDOM } from "jsdom"
import Work from "../app/work/page"
import Footer from "../components/footer"
import Directory from "../app/sitemap/page"
import sitemap from "../app/sitemap"
import { projects, workBrands } from "../data/work"
import { navigation } from "../data/site"

test("Work appears in shared navigation and both sitemaps; contact remains available", () => {
  assert.ok(
    navigation.some(link => link.href === "/work" && link.label === "Work"),
  )
  assert.ok(!navigation.some(link => link.href === "/contact"))
  assert.ok(
    sitemap().some(entry => entry.url === "https://openbracket.io/work"),
  )
  assert.ok(
    sitemap().some(entry => entry.url === "https://openbracket.io/contact"),
  )
  for (const component of [Footer, Directory]) {
    const doc = new JSDOM(renderToStaticMarkup(createElement(component))).window
      .document
    assert.ok(doc.querySelector('a[href="/work"]'))
    assert.ok(doc.querySelector('a[href="/contact"]'))
  }
  const header = readFileSync("components/header.tsx", "utf8")
  assert.ok(
    header.indexOf('className="button header-cta" href="/contact"') <
      header.indexOf("<ThemeToggle />"),
  )
})

test("Work renders original case-study links, credits and proportioned local assets", () => {
  const doc = new JSDOM(renderToStaticMarkup(createElement(Work))).window
    .document
  assert.match(
    doc.querySelector(".work-attribution")!.textContent!,
    /not presented as direct OpenBracket client engagements/,
  )
  assert.equal(doc.querySelectorAll(".work-project").length, 5)
  assert.equal(doc.querySelectorAll(".work-logo").length, 5)
  for (const project of projects) {
    const article = doc.getElementById(project.id)!
    assert.ok(article.querySelector(`a[href="${project.caseStudy}"]`))
    assert.ok(project.caseStudy.startsWith("https://tampham.io/"))
    assert.ok(existsSync(`public${project.image}`))
    const image = article.querySelector("img")!
    assert.equal(image.alt, project.imageAlt)
    assert.equal(
      Number(image.width) / Number(image.height),
      project.width / project.height,
    )
    assert.ok(
      article
        .querySelector(".project-contribution")!
        .textContent!.includes(project.role),
    )
  }
  assert.match(doc.getElementById("fidium")!.textContent!, /Amdocs/)
  for (const id of ["toro", "earthx"])
    assert.match(doc.getElementById(id)!.textContent!, /Agency collaboration/)
  for (const brand of workBrands) {
    assert.ok(existsSync(`public${brand.image}`))
    assert.ok(doc.querySelector(`img[alt="${brand.alt}"]`))
  }
  assert.ok(doc.querySelector('a[href="/contact"]'))
})
