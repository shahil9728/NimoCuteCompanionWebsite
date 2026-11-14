# Nimo design system

Calm, cozy and product-first. The real Nimo (glossy white shell, blue inner ears, black screen face,
white eyes, pink blush) is the hero of every page; the site around him stays quiet. Light theme only.
Tokens live as CSS variables at the top of `src/styles/main.css`; pages use the names, never raw values.

## Color

| Token | Value | Role |
|---|---|---|
| `--paper` | `#F5F2EC` | Page background. Warm, so white Nimo never melts into a white page. |
| `--paper-2` | `#EDE8DF` | Alternate section bands, table header cells, quiet fills. |
| `--card` | `#FFFFFF` | Cards, inputs, dialogs, the sticky bar. |
| `--ink` | `#111318` | Text and headings; the footer and closing waitlist band. |
| `--muted` | `#565B66` | Secondary text (6:1 on paper). |
| `--faint` | `#666B76` | Hints and captions (4.8:1 on paper). |
| `--line` / `--line-strong` | `#E2DCD1` / `#CFC8BB` | Borders and dividers / input borders. |
| `--blue` | `#2F5F9E` | The one action color: buttons, links, focus ring, selected states. White text on it is 6.3:1. |
| `--blue-ink` / `--blue-soft` | `#244B7E` / `#E4ECF7` | Hover / selected chip and table highlight fills. |
| `--ear` | `#A9C8EE` | Nimo's inner-ear blue. Decorative only (playground disc, small accents), never text. |
| `--blush` | `#F28EA0` | Nimo's cheeks. Tiny accents (hearts, the live dot), never text. |
| `--ok` / `--err` | `#2E7D57` / `#A63A35` | Success and error text, each on its own soft tint. |

No gradients on text, no neon, no glass blur.

## Typography

- **Quicksand** (self-hosted variable, 600–700) for headings: geometric and monoline like the wordmark.
- **Inter** (self-hosted variable, 400–600) for everything else.

| Style | Size / line height | Font |
|---|---|---|
| Display (h1) | clamp(42px, 6vw, 80px) / 1.04 | Quicksand 700 |
| h2 | clamp(32px, 4.2vw, 52px) / 1.08 | Quicksand 700 |
| h3 | 21–22px / 1.25 | Quicksand 700 |
| Lead | clamp(17px, 1.5vw, 20px) / 1.6 | Inter 400 |
| Body | 17px / 1.65 (16px on phones) | Inter 400 |
| Small | 15px / 1.55 | Inter 400 |
| Caption | 13px / 1.45 | Inter 500 |

Sentence case everywhere. Small labels are plain Inter in `--muted`, never monospace or all caps.
Body lines stay under about 65 characters.

## Spacing and layout

8-based scale: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128. Sections pad `clamp(72px, 9vw, 128px)`
top and bottom. Content width 1200px with `clamp(20px, 5vw, 48px)` side gutters. Most sections are
left-aligned splits or grids; only the closing waitlist is centered.

## Shape and depth

Radius: 10px (small chips), 18px (cards), 28px (photos and large panels), pill for buttons and inputs.
One shadow, `--shadow`, only on things that float: dropdowns, the sticky bar, dialogs.

## Components

- **Buttons:** primary = blue pill with white text, darker on hover; secondary = white pill with an ink
  label and a line border. Visible 3px focus ring in `--blue`. Disabled at 45% opacity.
- **Links:** `--blue`, underlined in body text.
- **Inputs:** white pill, `--line-strong` border, blue border and ring on focus, error text in `--err`.
- **Cards:** white, 1px `--line`, 18px radius, no hover lift. Link cards turn their border blue on hover.
- **Navigation:** logo left, links centered, waitlist button right; solid paper bar with a hairline
  once scrolled. Collapses to a menu button under 960px.
- **Footer:** ink background, paper text, the white wordmark.

## Imagery and icons

- Real product photos only (desk, bedside, car, backpack), WebP, rounded 28px, no color filters,
  explicit width and height, lazy except the hero.
- One line-icon style: 24px grid, 2px stroke, round caps (Lucide-like). No emoji as icons.
- The logo: lowercase monoline "nimo" with a cat smile ("ω") under it. The favicon and app icon are
  Nimo's screen face. Masters in `public/brand/`.

## Motion

One fade-in (opacity plus 14px) as blocks enter the viewport, plus a short CSS intro on the hero.
Playground interactions animate with GSAP. Answers in the FAQ open and close with a short height
animation; the phone menu slides in. Two deliberate pieces of character, both transform/opacity
only: the guide-page timeline fills its line as you scroll and lights each Nimo, and a little
Nimo rolls along the top of the footer (stare, wink, "pop pop" with confetti, sad) only while the
footer is on screen. Everything respects `prefers-reduced-motion`. No backdrop-filter.
