# SEO — what's implemented, and what you need to do

**Canonical domain:** `https://www.heynimo.in` (the apex `heynimo.in` 301-redirects to `www`, so `www` is the real address and everything points there.)

---

## 1. What changed in this pass

### Domain migration
Every hardcoded reference to `nimo-cute-companion.onrender.com` was pointing search engines at the old Render subdomain. All of it now points at `https://www.heynimo.in`:

- `<link rel="canonical">`
- `og:url`, `og:image`, `twitter:image`
- the whole JSON-LD graph
- `public/sitemap.xml`
- `public/robots.txt`

The Render subdomain stays publicly reachable and served an identical copy of the site — classic duplicate content. A small host-guard script at the top of `index.html` now redirects `nimo-cute-companion.onrender.com` to the real domain, and the canonical tag backs it up.

### Performance (Core Web Vitals)
The three product photos were embedded as base64 data-URIs inside `src/styles/main.css`. CSS is render-blocking, so the browser had to download **422 KB of stylesheet before it could paint anything**, and those bytes could never be cached separately or served in a modern format.

- Images extracted to `public/images/` as **WebP with JPEG fallbacks** (~30% smaller)
- `main.css` went from **422 KB → 37 KB** (8.4 KB gzipped)
- Hero image is `preload`ed with `fetchpriority="high"` — directly improves Largest Contentful Paint
- Below-the-fold images are `loading="lazy"`
- All images carry explicit `width`/`height` so nothing shifts while loading (Cumulative Layout Shift)
- Long-lived `Cache-Control` headers for `/assets/*` and `/images/*` in `render.yaml`

### Images are now indexable
The photos were CSS backgrounds on empty `<div>`s — invisible to Google Images. They're now real `<picture>`/`<img>` elements with descriptive alt text and keyword-bearing filenames, plus an image sitemap.

### Soft 404 fixed
`render.yaml` had a catch-all `/* → /index.html` rewrite, so **every** wrong URL returned the homepage with HTTP 200. Google flags that as a soft 404 and it wastes crawl budget. The rewrite is gone from `render.yaml` and a branded `404.html` now ships with the build.

> ⚠️ **Still outstanding:** the same rule also exists in the Render dashboard, and this service does not sync `routes` from `render.yaml` — so the catch-all is still live and unknown URLs still return the homepage. Fix: Render → the service → **Redirects/Rewrites** → delete the `/*  →  /index.html` row. Takes effect immediately, no redeploy. Until then `/privacy/` (with a trailing slash) and `/privacy-policy` also land on the homepage; the canonical `/privacy` and `/terms` are unaffected because they are real files.

### Real pages instead of dead links
The footer's Privacy, Terms, Cookies, About, Careers and Contact links all pointed at `#top` — dead links that hurt trust signals and give crawlers nothing. Now:

- `/privacy` — a genuine privacy policy covering the waitlist, feedback box, Google Analytics, Supabase, Web3Forms, retention, and GDPR/India DPDP rights
- `/terms` — waitlist terms, pre-production disclaimers, IP, liability
- Contact is a real `mailto:`, and the remaining links go to real sections

These two pages ship as **extensionless files** (`public/privacy`, `public/terms`) rather than as `privacy/index.html`. That is deliberate: this Render service syncs `headers` from `render.yaml` but not `routes`, so the dashboard's `/* -> /index.html` catch-all swallows any path that is not a real file — which made `/privacy` serve the homepage. Real files are matched before any rewrite, so the extensionless form works regardless. `render.yaml` sets their `Content-Type`, since Render cannot infer it without a file extension. `/privacy.html` and `/terms.html` are emitted alongside as aliases.

Both new pages are in the sitemap, canonicalised, and have their own JSON-LD.

### Structured data hardened
- Proper `@graph` with `@id` cross-references (Organization → WebSite → WebPage → Product → FAQPage)
- FAQ schema now matches all six visible questions — previously it listed five and omitted one, which is a schema-mismatch warning
- `ImageObject` for the share image, `ContactPoint` for support
- **Removed the fake `price: 0` Offer.** Claiming a $0 price for an unreleased product is a Google Merchant policy risk. Pricing can be added the moment it's real.
- No `Review`/`AggregateRating` schema, deliberately — the on-page testimonials are placeholders, and marking up invented reviews is a manual-action risk.

### Crawling and indexing
- `robots.txt` rewritten: explicit allowances for Googlebot and Bingbot, plus AI crawlers (GPTBot, PerplexityBot, ClaudeBot, OAI-SearchBot, Google-Extended) so Nimo can be cited by AI assistants
- Sitemap now lists all three pages, with `lastmod` and image entries
- `max-image-preview:large` in the robots meta — bigger image thumbnails in Google results
- `/sitemap`, `/robots`, `/privacy-policy` and `/terms-of-service` all resolve as aliases

### Metadata
- Title tightened to 48 characters (was 68 and truncating in results), description to 172
- Added `og:locale`, `og:image:alt`, `og:image:type`, `twitter:image:alt`
- Removed `<meta name="keywords">` — ignored by Google for two decades
- Added `favicon.ico`, `apple-touch-icon.png`, `icon-192/512.png`, maskable icon and `site.webmanifest`

### Security headers
`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` and HSTS, set in `render.yaml`. Not a direct ranking factor, but they clear common site-audit findings.

---

## 2. Still worth doing (content, not code)

1. **Replace the placeholder testimonials.** Six invented quotes ("Maya", "Deepak", "Lauren", "Theo", "Priya", "Sam") and the "#128 on the list" numbers are presented as real feedback. That's a credibility and consumer-protection risk, and it's the single biggest remaining issue on the page. Either collect real quotes or reframe the section honestly.
2. **The "642 friends waiting" figure is static text**, not a live count. Make it real or soften the claim.
3. **Verify the FAQ answers** match reality on shipping, WiFi and driving safety before launch.
4. **Swap in real product photography** when the device exists — the current imagery is concept art.
5. **Add content depth.** A single landing page ranks for very little. Two or three genuinely useful articles (for example "are dashboard robots safe to drive with?", "AI companion robots compared") would give the domain something to rank for beyond its own brand name.
6. **Build a few real backlinks** — Product Hunt, BetaList, relevant subreddits, robotics newsletters. For a brand-new domain this matters more than anything on this page.
