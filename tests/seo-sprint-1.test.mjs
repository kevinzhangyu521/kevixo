import { readFileSync } from "node:fs";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

function assertIncludes(source, expected, context) {
  assert(source.includes(expected), `${context} should include ${expected}.`);
}

const homepage = read("app/page.tsx");
const footer = read("components/site-footer.tsx");
const blogData = read("lib/blog.ts");
const seoLandingData = read("lib/seo-landing-pages.ts");
const seoLandingPage = read("app/(seo)/[slug]/page.tsx");
const sitemap = read("app/sitemap.ts");
const robots = read("app/robots.ts");
const header = read("components/site-header.tsx");

const commercialPages = [
  "/poker-hand-analyzer",
  "/ai-poker-coach",
  "/poker-review-tool",
  "/hand-history-review",
  "/gto-poker-coach",
  "/poker-leak-finder",
];

for (const href of commercialPages) {
  assertIncludes(homepage, `href: "${href}"`, "Homepage learning tools");
  assertIncludes(footer, `href: "${href}"`, "Shared footer navigation");
}

assertIncludes(blogData, 'href: "/poker-review-tool"', "Blog product links");
assertIncludes(blogData, 'href: "/hand-history-review"', "Blog product links");
assertIncludes(blogData, 'href: "/ai-poker-coach"', "Blog product links");
assertIncludes(blogData, 'href: "/gto-poker-coach"', "Blog product links");
assertIncludes(blogData, 'href: "/poker-leak-finder"', "Blog product links");

assertIncludes(seoLandingData, '"how-to-review-poker-hands"', "Landing page article links");
assertIncludes(seoLandingData, '"poker-hand-history-guide"', "Landing page article links");
assertIncludes(seoLandingData, '"gto-poker-strategy"', "Landing page article links");
assertIncludes(seoLandingData, '"poker-mistakes-beginners"', "Landing page article links");
assertIncludes(
  seoLandingPage,
  "getRelatedArticles(page.slug)",
  "Landing page template",
);

assert(
  !sitemap.includes("const lastModified = new Date()"),
  "Sitemap should not generate a dynamic current date for static pages.",
);
assertIncludes(
  sitemap,
  "lastModified: new Date(article.updatedAt)",
  "Sitemap blog entries",
);
assertIncludes(sitemap, "https://www.kevixo.com/", "Sitemap canonical domain");
assertIncludes(robots, 'allow: "/"', "Robots rules");
assertIncludes(robots, "https://www.kevixo.com/sitemap.xml", "Robots sitemap");
assert(!seoLandingPage.includes("noindex"), "SEO landing page template should not noindex pages.");

assertIncludes(header, "aria-hidden={!isOpen}", "Header More dropdown");
assertIncludes(header, "pointer-events-none", "Header More dropdown");

console.log("seo sprint 1 tests passed");
