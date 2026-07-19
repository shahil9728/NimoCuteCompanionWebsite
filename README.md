# Nimo — AI Car‑Dashboard Companion (Landing Page)

## Website link - https://nimo-cute-companion.onrender.com

A premium, dark‑mode, motion‑driven landing page for **Nimo**, an emotionally intelligent AI companion that rides on your car dashboard. Optimised for one conversion: **Join the Waitlist**.

Built as a lightweight **Vite + TypeScript** static site — no framework runtime, fast to build, trivial to deploy on Render.

---

## ✨ Features

- Full‑bleed cinematic hero (car‑dashboard shot) with an **inline, above‑the‑fold waitlist form**
- Frictionless waitlist everywhere: hero form, sticky nav CTA, slide‑in bar, and a climax section — all email‑only with inline success
- Scroll storytelling (GSAP + ScrollTrigger), smooth scroll (Lenis), ambient particle field, magnetic buttons, cursor spotlight
- Interactive **emotions** module — Nimo's eyes track the cursor, blink, and morph through Happy / Sleepy / Angry / Lonely
- Sections: Hero · What is Nimo · Features (bento) · How it works · Ride‑along · Emotions · Before/After · Colorways · Testimonials · FAQ · Waitlist · Footer
- SEO: meta + Open Graph + Twitter + canonical + JSON‑LD (Organization, WebSite, Product, FAQ) · `robots.txt` · `sitemap.xml`
- Analytics: **Google Analytics 4** (`G-3C9Z4YQVRT`) + **Google Tag** (`GT-WF4ZWBSR`) via `gtag.js`, with custom events
- Accessibility: semantic HTML, ARIA, focus states, full `prefers-reduced-motion` support

---

## 🧱 Tech stack

| | |
|---|---|
| Build | Vite 5 |
| Language | TypeScript (bundled with esbuild — no blocking type‑check) |
| Animation | GSAP + ScrollTrigger, Lenis (loaded from CDN) |
| Data | Supabase (`@supabase/supabase-js`) |
| Analytics | Google `gtag.js` (GA4 + Google Tag) |
| Hosting | Render.com static site |

> The verified visual design is ported 1:1 from the approved single‑file build. Images are embedded as optimised data‑URIs in `src/styles/main.css`, so the site is fully self‑contained (no external image hosting).

---

## 📁 Project structure

```
.
├── index.html            # markup + <head> (SEO, gtag.js, JSON-LD)
├── public/
│   ├── favicon.svg
│   ├── robots.txt
│   └── sitemap.xml
├── src/
│   ├── main.ts           # all interactions (imports styles + lib modules)
│   ├── vite-env.d.ts
│   ├── styles/
│   │   └── main.css      # design system + embedded imagery (data-URIs)
│   └── lib/
│       ├── analytics.ts  # gtag event helpers (track.*)
│       └── supabase.ts   # Supabase client + joinWaitlist()
├── render.yaml           # Render Blueprint (static site)
├── .env.example
├── vite.config.ts
├── tsconfig.json
└── package.json
```


## 📝 Notes

- Testimonials and FAQ copy are tasteful, product‑faithful placeholders — swap in real ones anytime.
- The OG/social image currently points at a hosted concept render; replace with a self‑hosted `og-image.jpg` for full independence.
- Want a full **React + React‑Three‑Fiber** version with a real interactive 3D Nimo? That path is available on request.
