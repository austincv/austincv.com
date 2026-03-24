# austincv.com — Project Context for Claude

Personal website for Austin Chungath Vincent. A single-file static site (`index.html`) with no build step, no framework, no dependencies beyond two Google Fonts.

## Project structure

```
/
├── index.html          # The entire site — HTML, CSS, and JS in one file
├── Dojo_Headshots_Day_010040.jpg   # Headshot photo (circular crop on card)
└── CLAUDE.md           # This file
```

No package.json, no bundler, no node_modules. Open `index.html` directly in a browser or serve with any static server (e.g. `npx serve .` or VS Code Live Server).

---

## What the site does

A minimalist personal CV site with two distinct experiences:

**Desktop (>768px)**
- Fixed left panel: bold serif headline + role description + LinkedIn/GitHub links
- Right side: tall scroll container (~120vh per role × 5 roles)
- A sticky ID card hangs on a lanyard in the centre-right of the screen
- Scrolling triggers a card flip animation (spin out to 90°, swap content, spin in from -90°) revealing each job role
- Left panel copy fades out and in to match the current role
- Card gently swings on its lanyard when idle

**Mobile (≤768px)**
- Single-screen layout, no scroll — everything fits within `100dvh`
- Swipe left/right (or tap arrow buttons) to cycle through role cards
- Progress dots + role copy below the card
- LinkedIn/GitHub buttons at the bottom
- Portrait-only: landscape shows a "Please rotate your device" overlay

---

## Key design decisions to preserve

- **Always light mode** — `color-scheme: only light` on `html` and `<meta name="color-scheme" content="only light">`. Never add dark mode.
- **Portrait-only on mobile** — landscape is blocked via CSS (`body { display: none }` + overlay at `max-width: 768px and orientation: landscape`).
- **No mirroring on card flip** — the flip uses a half-spin-out / content-swap / half-spin-in technique (not CSS `backface-visibility`). The card is always facing forward. Do not revert to a two-face preserve-3d approach.
- **Single HTML file** — keep everything in `index.html`. Don't split into separate CSS/JS files unless Austin explicitly asks.

---

## Colour palette

```css
--black: #0d0d0d
--white: #fafaf8   /* site background — warm off-white, not pure white */
--grey:  #888
--light: #e8e8e4
```

Each role card also has its own `--accent` colour (used for the top stripe, job title text, and company icon background):

| Role | Company | Accent |
|------|---------|--------|
| 0 | DOJO | `#1a1a2e` |
| 1 | Hummingbird | `#1e4d2b` |
| 2 | Think Big | `#2d1b69` |
| 3 | Big Data Partnership | `#7c2d12` |
| 4 | Mu Sigma | `#374151` |

---

## Typography

- **Display / headings**: `Instrument Serif` (Google Fonts) — used for the left-panel headline and card name
- **Body / UI**: `DM Sans` (Google Fonts) — used for everything else
- Never change these to Inter, Roboto, Arial, or system fonts.

---

## Roles data

All role content lives in the `roles` array in the `<script>` block. Each object has:

```js
{
  company:  string,   // shown on card and mobile eyebrow
  title:    string,   // job title on card
  dates:    string,   // date range on card and mobile eyebrow
  accent:   string,   // hex colour for card accent
  icon:     string,   // single character / emoji for company badge
  headline: string,   // desktop left panel — use \n for line breaks
  eyebrow:  string,   // small uppercase label above headline
  sub:      string,   // one-sentence description below headline
}
```

Roles are in reverse-chronological order (most recent first). Role index 0 always gets the photo; others show a placeholder. This is controlled by `buildCardInner(role, includePhoto)`.

---

## Photo

`const PHOTO = './Dojo_Headshots_Day_010040.jpg'`

The `<img>` has an `onerror` fallback that hides it and shows the placeholder `👤` div if the image fails to load. The photo is only shown on the first card (DOJO). All others show the placeholder — this is intentional.

---

## Card flip mechanism (desktop)

The animation in `rotateTo(idx)` works in two phases:

1. **Spin out**: `perspective(900px) rotateY(90deg)` over 0.28s — card becomes edge-on (invisible)
2. **Snap to -90°** (no transition), swap `cardFront.innerHTML`, then **spin in**: `rotateY(0deg)` over 0.32s

The left panel copy updates during the spin-in phase (after the content swap). There is an `animating` flag that blocks new flips while one is in progress — important to keep this, otherwise rapid scrolling causes glitches.

---

## Mobile layout constraints

The mobile layout must fit entirely within `100dvh` (no scroll). Key rules:
- `.mobile` is `height: 100dvh; overflow: hidden`
- `.mobile-swipe-area` uses `flex: 1; min-height: 0` to fill remaining space
- Card dimensions use `min()` to scale down on small screens: `min(260px, 72vw)` × `min(360px, 58vh)`
- Role copy is clamped to 2 lines with `-webkit-line-clamp: 2`
- Bottom links use `env(safe-area-inset-bottom)` for iPhone home indicator

Do not add `min-height` to any mobile flex children — it will break the no-scroll constraint.

---

## Links

- LinkedIn: `https://linkedin.com/in/austincv`
- GitHub: `https://github.com/austincv`

These appear in the desktop left panel and the mobile bottom buttons. Do not add other links without being asked.

---

## What's intentionally absent

- No analytics, no tracking
- No contact form
- No blog / writing section (yet)
- No dark mode
- No landscape mobile view