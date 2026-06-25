# CHANGES — Portfolio update & UX improvement pass

Scope executed: **high-value subset** of the 4-phase brief, adapted to the real
stack (static HTML/CSS/JS on Azure Static Web Apps — not Next.js). Every code
change carries a `// IMPROVED:` or `<!-- IMPROVED -->` marker in source.

## Files modified

### `index.html`
- **Contact form → own backend.** `fetch` now hits **`/api/submit`** (deployed
  Azure Function: Resend, server-side rate-limit, spam filter, branded email)
  instead of `formsubmit.co`. Payload changed to `{name,email,subject,message,
  botcheck}`; success check `data.success === true` (boolean, was string).
- **Dark/light toggle.** Added sun/moon icon button in nav (`#themeToggle`,
  `aria-label` updates on toggle). Anti-FOUC inline script in `<head>` sets
  `data-theme` before CSS loads (reads `localStorage`, falls back to
  `prefers-color-scheme`). Toggle JS persists choice to `localStorage`.
- **Back-to-top button** (`#backToTop`) — appears after ~0.9 viewport scroll,
  smooth-scrolls to top, `aria-label`.
- **Skills section rebuilt** — replaced 6 flat toolkit cards with **4 grouped
  blocks** (Languages / Frameworks & Libraries / Data & Cloud / Tools & DevOps),
  23 pill badges, each with a simple-icons logo (rust-tinted, theme-safe, lazy,
  `onerror` hides a missing icon so the text label survives).
- **Dynamic copyright year** — `<span id="footerYear">` set via `Date.getFullYear()`.
- **WebP images** — NovaSync, TenderWise, GitGraph visuals wrapped in `<picture>`
  with a WebP `<source>` and the original GIF/PNG as fallback. Added explicit
  `width`/`height` to the GitGraph image (was missing → CLS).
- Nav markup: theme toggle + Hire grouped in a `.nav-actions` cell so the nav
  grid stays 3 columns.

### `styles.css`
- **`[data-theme="dark"]` block** — full token override (same forest-green / rust
  hues, inverted lightness). Plus a targeted override so green-*filled* controls
  (primary/outline buttons, Hire, submit, OSS banner, resume-hover, mobile menu
  active) flip to dark text on the light-sage fill, and OSS banner copy stays
  readable. `color-scheme: dark` set; background texture dimmed.
- **`:focus-visible`** global ring (2px rust, 2px offset) — keyboard focus was
  invisible everywhere except form inputs (WCAG 2.4.7).
- **`.theme-toggle`, `.nav-actions`, `.back-to-top`** component styles (incl. dark
  variants and sun/moon icon swap).
- **`.skills-groups` / `.skill-group` / `.skill-pills` / `.skill-pill`** styles +
  per-pill staggered fade-up (50ms steps) wrapped in
  `@media (prefers-reduced-motion: no-preference)`.
- Responsive: skill groups collapse to 1 column at ≤640px.

### New binary assets
- `novasync-demo.webp` (24 KB, was 93 KB GIF)
- `gitgraph-demo.webp` (56 KB, was 198 KB GIF)
- `tenderwise-screenshot.webp` (73 KB, was 195 KB PNG)
- **~330 KB saved** across the three; originals kept as `<picture>` fallbacks.

### New docs
- `AUDIT.md` (Phase 0 read-only audit)
- `CHANGES.md`, `TODO.md` (this pass)

## Verified in preview (npx serve, 1280×900)
- Dark theme renders correctly (sage headings, rust accents, dark text on filled
  controls); light theme unchanged from before.
- Toggle flips theme, persists to `localStorage` (`light`/`dark`), aria-label updates.
- 4 skill groups, 23 icon pills all load from simple-icons CDN.
- All three project visuals serve `.webp` (`currentSrc` confirmed).
- Back-to-top + theme toggle present; footer year = 2026 (current).
- Console: no warnings or errors.

## Decisions made (review & override if you disagree)

1. **Skill icon color is fixed rust `#904b36`, not each brand's color.** Brand
   colors (e.g. near-black Express/Next.js) vanish in dark mode; a single accent
   keeps every icon visible in both themes and on-palette. // REVIEW if you'd
   rather have full-color brand logos (light mode only).
2. **Skill icons load from `cdn.simpleicons.org` (external).** No inline SVG
   blobs, lazy-loaded, `onerror` degrades gracefully to text. Trade-off: ~20
   small external requests. Alternative = vendor SVGs locally (see TODO).
3. **GTM/gtag left in `<head>`** — both already load `async` (not render-blocking);
   Google recommends head placement. Only the tiny anti-FOUC theme script was
   added there (must run before paint).
4. **Section order unchanged** (Hero → Achievements → About → Skills → Experience
   → Projects → Contact). Brief's canonical order omits Achievements and puts
   Projects before Experience; current order is intentional (achievements-high for
   recruiters). // REVIEW: moving Projects above Experience is still worth doing.
5. **`api/` backend, deploy workflow, secrets untouched** per constraints.

---

# Pass 2 — Brief Phases 1–3

## Phase 1 — content from GitHub
- Fetched `users/Nandansai08/repos`. Two strong, recent AI repos were **not** on the
  site: **PersonalAI** (`personal-ai`) and **Whetstone** (`whetstone`).
- **Added both as OSS project cards** (numbers 04 & 05; existing OSS cards renumbered
  to 06–08). First-person blurbs synthesized from their READMEs; tags from
  topics/language. No live demo → links omitted (CLI/local tools), GitHub + good-
  first-issues kept.
- Wired both into the live GitHub issue-count script (`personalai-issues`,
  `whetstone-issues`). Improved the script to **hide the "open issues" line when a
  repo has 0** (avoids "0 open issues — pick one").
- Updated `README.md` (added both projects) and `sitemap.xml` `lastmod`.
- Added inline `<code>` styling for the `npx` mention in the PersonalAI blurb.

## Phase 2 — accessibility (remaining items)
- `aria-labelledby` now on **every** section, including Hero (`#hero-name` on the H1).
- `aria-label` added to **all** remaining glyph links (`↗ ⌥ ✦ 📄`) across TenderWise,
  Data Lens, MomentsAI, GitGraph, TerraFlow (NovaSync + the 2 new cards already had
  them). Screen readers now read a clear name instead of "Option/up-right-arrow".
- Confirmed every `<img>` has `alt`; icon-only buttons (theme, back-to-top,
  hamburger) all have accessible names; tab order follows DOM/visual order.

## Phase 3 — mobile (375px)
- Verified **no horizontal overflow**; project/OSS/skills grids all collapse to 1
  column; primary CTA full-width (327px).
- **Theme toggle 40→44px** (touch-target minimum).
- **Mobile nav fixed:** brand · theme-toggle · hamburger now share one row (the
  toggle was wrapping to a second row / floating over the hero badge).
- **Hamburger keyboard support:** `Escape` closes the menu and returns focus to the
  toggle; `aria-expanded` updated. (Full focus-trap not added — see TODO.)

## Pass-2 decisions
6. **PersonalAI / Whetstone placed as OSS cards 04–05** (most recent, flagship AI
   work leads the OSS grid). // REVIEW: PersonalAI looks like the public form of the
   **Nova** assistant named in the About section — confirm, and I can link About →
   that repo if so.
7. **No-demo cards omit the live link** rather than show a dead `#` (per brief).
