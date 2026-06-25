# TODO — follow-ups & manual steps

## ⚠️ Required for the contact form to work in production
The form now posts to **`/api/submit`** (your Azure Function). It needs an env var:

- **`RESEND_API_KEY`** — set in the Static Web App → Configuration (Application
  settings). Without it, submissions return a 500.
- Optional: **`CONTACT_EMAIL_TO`** (defaults to `nandansaichigurupati08@gmail.com`).
- Resend's `from` is `onboarding@resend.dev` (sandbox). To send from your own
  domain, verify a domain in Resend and update `from` in `api/src/functions/submit.js`.

**Cannot be tested locally** here — `npx serve` is static only, no Functions
runtime. Verify on the deployed SWA, or run `swa start` + `func start` locally
with the env var set.

## ✅ Resolved: Nova was renamed to PersonalAI
About section now says "building **PersonalAI**" (linked to the repo) instead of Nova.

## Could not complete / out of scope this pass
- **Mobile hamburger full focus-trap** — added `Escape`-to-close + focus return, but
  did not trap Tab inside the open menu. Low risk (menu items are the only focusable
  things below a fixed header); add if you want strict WCAG 2.4.3 containment.
- **Projects-before-Experience reorder** — recommended (projects are stronger than
  2 volunteer entries) but left as-is; it's a content-order call for you.
- **Lighthouse run** — no headless Chrome here. Run it in your browser DevTools;
  CLS should now be near-0 (all images have width/height), perf improved by WebP.

## Nice-to-have (not blocking)
- **`favicon07.png` is 120 KB** — absurd for a favicon. Export a 32×32 / 48×48
  optimized PNG or `.ico` (<10 KB).
- **`tenderwise-screenshot.webp` is 1846px native** but displayed at 800px. Could
  downscale the source to ~800px for a smaller file (currently 73 KB, fine).
- **Vendor skill icons locally** if you want to drop the simpleicons CDN
  dependency (download SVGs to `/icons`, swap `src`).
- **Stray root `package-lock.json`** with no matching `package.json` — likely safe
  to delete (the real Node project is under `api/`). Confirm before removing.
- **`prefers-reduced-motion`** — back-to-top transition and smooth-scroll are not
  yet gated; they're minor, but could honor reduced motion in JS for purity.

## Content you may want to supply
- A real **profile photo** to replace the `NS` initials avatar in the hero.
- Confirm the **dark-mode sage/rust shades** match your taste (tokens in
  `styles.css` under `[data-theme="dark"]`) — easy to tweak.

## Not touched (per constraints)
- `.env`, secrets, `api/local.settings.json`, deploy workflow, color palette, fonts.
