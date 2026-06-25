# Portfolio Audit — Phase 0

_Read-only audit. No source changed in this phase._

## Stack (reality vs. the redesign brief)

The brief assumes a Next.js/React app (`next/image`, `npm run build`, metadata
exports, WebP toolchain). **This site is none of that.** It is:

- **Plain static HTML/CSS/JS** — one `index.html` (~905 lines), one `styles.css`
  (~1660 lines), inline `<script>` blocks. No framework, no bundler, no JSX.
- **Hosting:** Azure Static Web Apps
  (`.github/workflows/azure-static-web-apps-blue-rock-009e22d00.yml`).
- **Backend:** a real Azure Functions API at `api/src/functions/submit.js`
  (Resend email, in-memory rate-limit 3/15min, honeypot, spam keyword filter,
  branded HTML email). Tracked in git, deployed by the SWA workflow.
- **No build step, no lint config, no test suite, no package.json at web root**
  (root `package-lock.json` is a stray — see findings).

**Consequence:** Phase 4's `npm run lint` / `npm run build` do not apply. All
Phase 2 image guidance (`next/image`, `priority`) maps to plain `<img loading>`
+ `<link rel="preload">`. WebP conversion still possible but manual.

## Directory map (source only, excludes .git / node_modules)

```
index.html                  main page, all sections + inline JS
styles.css                  full design system + responsive
README.md                   project readme
sitemap.xml, robots.txt     SEO
googled6e358b53df6b511.html Search Console verification
favicon07.png               favicon (120 KB — oversized for an icon)
og-image.png                76 KB social card
gitgraph-demo.gif           203 KB  ← heaviest asset
novasync-demo.gif           95 KB
tenderwise-screenshot.png   200 KB  ← second heaviest
Nandan_Sai_Resume.pdf       222 KB
package-lock.json           41 KB   ← stray, no matching package.json at root
api/                        Azure Functions backend (submit.js + Resend)
.github/workflows/          SWA deploy
.claude/                    local dev config (gitignored)
```

## Sections present (in current DOM order)

1. **Hero** — H1 name, JetBrains-mono typing role, badge, 4 stat tiles, 2 CTAs
   (View Work / Download CV), NS initials avatar, scroll hint.
2. **Achievements** — 4 stat cards (JEE Main 0.4%, JEE Adv Top 2%, CGPA, 2×
   hackathons). _Deliberately placed 2nd for recruiter impact (prior session)._
3. **About** — bio copy + `nandan.json` terminal card + 2 education cards.
4. **Skills** — 6 toolkit cards (Languages, Backend, Frontend, DSA, Cloud&AI,
   Tools). Flat comma lists, no icons, no category grouping.
5. **Experience** ("Beyond the screen.") — 2 volunteer entries + coursework tags.
6. **Projects** — featured NovaSync (gif) + TenderWise (png) + Data Lens, then an
   OSS banner + 3 OSS cards (MomentsAI, GitGraph Studio, TerraFlow) with live
   GitHub issue counts.
7. **Contact** — copy + GitHub/LinkedIn/email links + full validated form.
8. **Footer** — brand, copyright (hardcoded © 2026), Connect + Navigate columns,
   "Built with" tag bar.

## Existing animations / interactivity

- IntersectionObserver scroll-reveal (`.reveal` + `.delay-1/2`), threshold 0.12.
- Hero typing effect, now capped at 2 cycles, freezes on "Full-Stack Developer".
- Sticky blur nav + active-section highlight (scroll listener).
- Scroll progress bar (`#progress`).
- Mobile hamburger menu with staggered fade-in entries.
- Project-card hover lift + shadow; screenshot grayscale→color on hover.
- `@media (prefers-reduced-motion)` respected for reveals.
- Live GitHub open-issue counts via `api.github.com` fetch.

## Findings — broken / outdated / missing

### High
- **Contact form bypasses its own backend.** Form posts to
  `https://formsubmit.co/ajax/...` while a superior, deployed Azure Function
  (`/api/submit`: Resend, server-side rate-limit, spam filter, branded email)
  sits unused. Third-party dependency + weaker UX for no reason.
- **No keyboard focus ring** anywhere except contact inputs. Tabbing through nav,
  CTAs, project links, and footer shows no visible focus → WCAG 2.4.7 fail.
- **No dark/light mode toggle** (brief requires one).

### Medium
- **Render-blocking scripts in `<head>`:** GTM + gtag load synchronously before
  paint. Should defer / move down.
- **Heavy images:** `gitgraph-demo.gif` 203 KB and `tenderwise-screenshot.png`
  200 KB dominate page weight; no WebP/video alternative. `favicon07.png` 120 KB
  is absurd for a favicon.
- **No "Back to top" control** (brief requires one).
- **Skills are flat text**, no icons, no Languages/Frameworks/Data&Cloud/Tools
  grouping (brief requires grouped pill blocks).
- **Hardcoded copyright year** (`© 2026`) — should derive from `Date`.
- **Section order vs. best practice:** Projects currently come *after* Experience.
  Projects (6 real builds) are far stronger than 2 short volunteer stints — they
  should precede Experience.

### Low / nits
- Stray root `package-lock.json` with no root `package.json`.
- `favicon07.png` could be a tiny optimized .ico/.png set.
- Some decorative glyph links (`⌥`, `↗`, `✦`) lack `aria-label` (partially fixed
  on NovaSync only).
- `og-image` referenced as `https://nandan.engineer/og-image.png` — fine, present.

## Inferred Lighthouse pain points

- **Performance:** render-blocking GTM/gtag in head; 200 KB+ uncompressed images;
  120 KB favicon. LCP likely hurt by hero + first image.
- **Accessibility:** missing focus-visible rings; a few unlabeled glyph links.
- **Best Practices:** third-party form POST (formsubmit.co) vs. own HTTPS API.
- **SEO:** already strong — title, description, canonical, JSON-LD Person+WebSite,
  OG/Twitter tags, sitemap, robots all present.

## How the brief maps onto this stack

| Brief item | Applies? | Adaptation |
|---|---|---|
| Next.js metadata / `next/image` | No | plain `<img>` + `<link rel=preload>` |
| `npm run lint` / `build` | No | none; validate by serving statically |
| Dark/light toggle + localStorage | Yes | vanilla JS + CSS `[data-theme]` vars |
| Back-to-top button | Yes | vanilla |
| Skills grouped + icons + stagger | Yes | simple-icons inline SVG |
| Focus rings, aria, landmarks | Yes | CSS `:focus-visible` + audit pass |
| WebP conversion | Partial | manual convert big PNG/GIF |
| GitHub fetch / curate projects | Yes | content already curated; refresh blurbs |
| Don't change palette/fonts | Honored | dark mode = inverted tokens, same hues |
| Don't touch secrets/deploy | Honored | `api/`, workflow, env untouched |

_Phase 0 complete._
