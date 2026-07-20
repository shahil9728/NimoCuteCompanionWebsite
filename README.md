# Nimo — AI Car‑Dashboard Companion (Landing Page)

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

---

## 🚀 Local development

```bash
npm install
cp .env.example .env       # then paste your Supabase anon key
npm run dev                # http://localhost:5173
npm run build              # outputs ./dist
npm run preview            # serve the production build
```

---

## 🔑 Environment variables

| Variable | Required | Default | Notes |
|---|---|---|---|
| `VITE_SUPABASE_URL` | no | `https://ymzdchbgtkoiokgoqkdc.supabase.co` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | **yes** (to persist) | — | Supabase → Project Settings → API → **anon public** |
| `VITE_WAITLIST_TABLE` | no | `waitlist` | Destination table name |

Until the anon key is set, the form still works — emails are cached in `localStorage` and the success state shows. Once the key is present, submissions are written to Supabase.

---

## 🗄️ Supabase setup

1. Open your project → **SQL Editor** → run:

```sql
-- Waitlist table + anonymous-insert policy
create extension if not exists "pgcrypto";

create table if not exists public.waitlist (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  source     text default 'website',
  created_at timestamptz not null default now()
);

alter table public.waitlist enable row level security;

-- Anonymous visitors may INSERT (join) but cannot read the list.
create policy "anon can join waitlist"
  on public.waitlist
  for insert
  to anon
  with check (true);
```

2. Copy your **anon public** key (Project Settings → API) into `VITE_SUPABASE_ANON_KEY` (locally in `.env`, and in Render → Environment).

That's all the client needs — RLS lets anonymous users insert only, so nobody can read other people's emails from the browser. View signups in the Supabase Table Editor.

---

## 📈 Google Analytics / Tag

`gtag.js` is bootstrapped in `index.html` and configured for both IDs:

- `G-3C9Z4YQVRT` — GA4 Measurement ID
- `GT-WF4ZWBSR` — Google Tag

Custom events (in `src/lib/analytics.ts`, fired throughout the UI): `waitlist_click`, `form_submit`, `cta_click`, `button_click`, `scroll_depth`. To change IDs, edit the two `gtag('config', …)` lines in `index.html`.

---

## ☁️ Deploy to Render

**Option A — Blueprint (recommended):** push this repo, then in Render click **New + → Blueprint** and select it. `render.yaml` provisions a static site with:

- Build: `npm install && npm run build`
- Publish dir: `./dist`

After the first deploy, add `VITE_SUPABASE_ANON_KEY` under the service's **Environment** tab and redeploy.

**Option B — Manual static site:** New + → **Static Site** → connect this repo →
Build Command `npm install && npm run build`, Publish Directory `dist`, add the env vars.

> Update `SITE` references (`canonical`, `og:url`, `sitemap.xml`, `robots.txt`) to your final domain once known.

---

## 📝 Notes

- Testimonials and FAQ copy are tasteful, product‑faithful placeholders — swap in real ones anytime.
- The OG/social image currently points at a hosted concept render; replace with a self‑hosted `og-image.jpg` for full independence.
- Want a full **React + React‑Three‑Fiber** version with a real interactive 3D Nimo? That path is available on request.
