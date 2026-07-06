# Goliath Solutions Site Rebuild — Design Spec

**Date:** 2026-07-06
**Status:** Approved by Joe

## Goal

Merge sitelee.io into goliath.solutions as one site. Rebuild the static-HTML site in Astro + TypeScript. Position around a single flagship done-for-you bundle for blue collar service businesses, with Sitelee's transparent-pricing and founder-led DNA. Site must be extremely fast — it is itself the sales demo.

## The Offer

**The Goliath Growth System** — one done-for-you package:

- Custom fast website built to convert visitors into booked jobs
- Local SEO + Google Business Profile management
- Review generation + referral automation
- Lead capture (quote form, missed-call follow-up positioning)
- Monthly marketing + plain-English reporting

**Pricing (published on site, draft numbers Joe may adjust):**

- $1,500 one-time build
- $397/mo done-for-you plan
- Anchored on-page against typical agency cost ($5,000+ builds, $2,000+/mo retainers)

Secondary CTA for larger custom work (apps, AI agents, automation): "Bigger project? Talk to us" → contact page. No separate services menu; the nine old services collapse into bundle components + custom-work CTA.

**Brand:** Goliath Solutions name and clean premium aesthetic. Founder-led credibility from Sitelee: Joe Ford, 14-year operator, real face, plain talk. Bear mascot retired.

## Sitemap

| Route | Content |
|---|---|
| `/` | Long-form landing: hero, pain points, what's included, pricing, proof, founder teaser, process, FAQ, CTA |
| `/work` | Case studies: Dolphin Claims, Florida's Best Pools |
| `/about` | Founder story |
| `/contact` | Quote form + booking calendar link |
| `/bookkeeper/*` | Existing static pages, byte-identical, served from `public/` (Intuit QBO app requires these URLs) |
| `/api/qbo/*` | Existing Vercel functions, untouched |

**Redirects (301):**

- `/services`, `/services.html` → `/#included`
- `/index.html`, `/about.html`, `/work.html`, `/contact.html` → clean equivalents
- sitelee.io (entire domain) → goliath.solutions — configured in Vercel dashboard by Joe; documented as a manual step in the repo README

## Architecture

- **Astro + TypeScript**, static output (`output: 'static'`), deployed on Vercel (same project as today)
- **Tailwind CSS v4** for styling
- Root `/api` directory keeps existing QBO Vercel functions; new `POST /api/lead` function added alongside them
- Components: `Layout.astro`, `Nav.astro`, `Footer.astro`, `Hero.astro`, `PricingCard.astro`, `CaseCard.astro`, `FAQ.astro` (native `<details>`, zero JS), `QuoteForm` (the only client-side JS island, TypeScript)
- Fonts: system font stack (zero font download); a single preloaded variable font may be added later only if the design demands it and perf targets still hold
- Images through `astro:assets`

## Lead Pipeline

- Quote form fields: name, trade, phone, city, short message
- `POST /api/lead`: zod validation, honeypot field + basic spam defense, email notification via Resend
- Resend API key supplied by Joe later; until then the endpoint logs and returns success with a clearly marked TODO env var (`RESEND_API_KEY`), and the README documents setup
- Booking: plain link to Cal.com/Calendly (no embedded widget — protects page speed); Joe supplies booking URL, placeholder until then

## Performance Targets

- Lighthouse 95+ (performance, accessibility, best practices, SEO)
- LCP < 1s on landing
- Near-zero JS shipped on all pages except the contact form island

## SEO

- Per-page title/meta/OG tags, OG image
- `sitemap.xml`, `robots.txt`
- `ProfessionalService` JSON-LD schema
- Semantic HTML, single h1 per page
- Redirect map above preserves existing URL equity

## Testing

- `astro build` passes clean with TypeScript strict
- Playwright smoke: each page renders, quote form submits and hits `/api/lead`
- Lighthouse run against preview deploy before ship

## Out of Scope

- Client portals, dashboards, or app features
- SMS notifications (email only for now)
- Blog/content marketing section (future)
- Migrating or rewriting `/bookkeeper` or QBO functions
