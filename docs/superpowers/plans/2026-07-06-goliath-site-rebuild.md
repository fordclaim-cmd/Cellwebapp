# Goliath Site Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild goliath.solutions as an Astro + TypeScript static site centered on one flagship done-for-you bundle ("The Goliath Growth System") for blue collar service businesses, absorbing sitelee.io's transparent-pricing, founder-led positioning.

**Architecture:** Astro static output (`build.format: 'file'`) deployed on Vercel. Root `/api` directory holds Vercel Node functions: existing untouched `api/qbo/*` plus a new `api/lead.ts` for the quote form. The contact form is the only client-side JS on the site (an inline TS `<script>` in an Astro component). Tailwind CSS v4 via the Vite plugin.

**Tech Stack:** Astro 5, TypeScript (strict), Tailwind CSS 4 (`@tailwindcss/vite`), zod, `@astrojs/sitemap`, Vitest (API unit tests), Playwright (smoke tests), sharp (one-off OG image generation), Resend HTTP API (no SDK).

## Global Constraints

- Brand: **Goliath Solutions**. Founder: **Joe Ford**. No bear mascot.
- Offer name: **The Goliath Growth System**.
- Published pricing (draft, editable in one file `src/config.ts`): **$1,500 one-time build + $397/mo**.
- Accent color `#0071e3`, dark `#1d1d1f`, light bg `#f5f5f7` (carried from current site).
- `/bookkeeper/*` pages must remain byte-identical and reachable at the same URLs (Intuit QBO app requirement). `api/qbo/*.js` must not be modified.
- Fonts: system font stack only. No web font downloads.
- Near-zero JS: no framework runtime; only the quote-form inline script ships JS.
- Site URL: `https://goliath.solutions`.
- Placeholders Joe fills later: `RESEND_API_KEY` env var, booking URL in `src/config.ts`, phone number in `src/config.ts`, founder photo.
- Node 20+ assumed locally. All commands run from repo root `/Users/joeford/projects/Cellwebapp`.

---

### Task 1: Astro scaffold, Tailwind v4, file moves

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `.gitignore`, `src/styles/global.css`, `src/pages/index.astro` (stub, replaced in Task 3)
- Move: `bookkeeper/` → `public/bookkeeper/` (git mv, no content edits)
- Delete: `index.html`, `about.html`, `contact.html`, `services.html`, `work.html`, `css/style.css`, `js/main.js`
- Leave untouched: `api/qbo/connect.js`, `api/qbo/callback.js`, `vercel.json` (edited later in Task 7)

**Interfaces:**
- Produces: working `npm run build` → `dist/`; `src/styles/global.css` imported by Layout in Task 2; theme tokens `--color-accent`, `--color-ink`, `--color-paper` usable as Tailwind classes `accent`, `ink`, `paper`.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "goliath-solutions",
  "type": "module",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "test": "vitest run",
    "test:e2e": "playwright test"
  },
  "dependencies": {
    "@astrojs/sitemap": "^3.4.0",
    "@tailwindcss/vite": "^4.1.0",
    "astro": "^5.10.0",
    "tailwindcss": "^4.1.0",
    "zod": "^3.25.0"
  },
  "devDependencies": {
    "@playwright/test": "^1.53.0",
    "@vercel/node": "^5.3.0",
    "sharp": "^0.34.0",
    "vitest": "^3.2.0"
  }
}
```

- [ ] **Step 2: Create `astro.config.mjs`**

```js
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://goliath.solutions',
  output: 'static',
  trailingSlash: 'never',
  build: { format: 'file' },
  integrations: [sitemap()],
  vite: { plugins: [tailwindcss()] },
});
```

- [ ] **Step 3: Create `tsconfig.json`**

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "src/**/*", "api/**/*.ts", "e2e/**/*", "scripts/**/*"],
  "exclude": ["dist", "node_modules"]
}
```

- [ ] **Step 4: Create `.gitignore`**

```
node_modules/
dist/
.astro/
.vercel/
.DS_Store
test-results/
playwright-report/
```

- [ ] **Step 5: Create `src/styles/global.css`**

```css
@import "tailwindcss";

@theme {
  --color-accent: #0071e3;
  --color-accent-soft: #4ea3f5;
  --color-ink: #1d1d1f;
  --color-paper: #f5f5f7;
  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

html {
  scroll-behavior: smooth;
}
```

- [ ] **Step 6: Create stub `src/pages/index.astro`**

```astro
---
import '../styles/global.css';
---
<html lang="en">
  <head><meta charset="utf-8" /><title>Goliath Solutions</title></head>
  <body><h1>Stub — replaced in Task 3</h1></body>
</html>
```

- [ ] **Step 7: Move bookkeeper, delete old site files**

```bash
mkdir -p public
git mv bookkeeper public/bookkeeper
git rm index.html about.html contact.html services.html work.html css/style.css js/main.js
```

- [ ] **Step 8: Install and build to verify**

Run: `npm install && npm run build`
Expected: build succeeds; `dist/index.html` exists; `dist/bookkeeper/index.html` exists (public passthrough).

Run: `git diff --stat HEAD -- public/bookkeeper`
Expected: only renames, zero content changes.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: scaffold Astro + Tailwind v4, move bookkeeper to public, remove old static site"
```

---

### Task 2: Config constants, Layout, Nav, Footer

**Files:**
- Create: `src/config.ts`, `src/layouts/Layout.astro`, `src/components/Nav.astro`, `src/components/Footer.astro`, `public/favicon.svg`

**Interfaces:**
- Produces: `Layout` props `{ title: string; description: string; withSchema?: boolean }`; named exports from `src/config.ts`: `PRICING = { setup: 1500, monthly: 397 }`, `BOOKING_URL: string`, `CONTACT_EMAIL: string`, `CONTACT_PHONE: string`, `CONTACT_PHONE_DISPLAY: string`. All page tasks consume these exact names.

- [ ] **Step 1: Create `src/config.ts`**

```ts
// Joe: edit these values — the whole site reads from here.
export const PRICING = {
  setup: 1500,
  monthly: 397,
} as const;

export const BOOKING_URL = 'https://cal.com/REPLACE-ME'; // TODO(Joe): real booking link
export const CONTACT_EMAIL = 'hello@goliathsolutions.ai';
export const CONTACT_PHONE = '+15555550199'; // TODO(Joe): real number
export const CONTACT_PHONE_DISPLAY = '(555) 555-0199';
```

- [ ] **Step 2: Create `public/favicon.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#1d1d1f"/><text x="12" y="17" text-anchor="middle" font-family="Helvetica" font-size="14" font-weight="700" fill="white">G</text></svg>
```

- [ ] **Step 3: Create `src/components/Nav.astro`**

```astro
---
import { BOOKING_URL } from '../config';
---
<nav class="sticky top-0 z-50 border-b border-ink/10 bg-white/80 backdrop-blur">
  <div class="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
    <a href="/" class="flex items-center gap-2 font-bold text-ink">
      <span class="grid size-7 place-items-center rounded-md bg-ink text-sm text-white">G</span>
      Goliath Solutions
    </a>
    <div class="hidden items-center gap-7 text-sm text-ink/80 sm:flex">
      <a href="/#included" class="hover:text-ink">The System</a>
      <a href="/#pricing" class="hover:text-ink">Pricing</a>
      <a href="/work" class="hover:text-ink">Work</a>
      <a href="/about" class="hover:text-ink">About</a>
    </div>
    <a href={BOOKING_URL} class="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent/90">
      Book a free call
    </a>
  </div>
</nav>
```

- [ ] **Step 4: Create `src/components/Footer.astro`**

```astro
---
import { CONTACT_EMAIL, CONTACT_PHONE, CONTACT_PHONE_DISPLAY } from '../config';
const year = new Date().getFullYear();
---
<footer class="bg-ink text-white/70">
  <div class="mx-auto grid max-w-6xl gap-8 px-5 py-14 sm:grid-cols-3">
    <div>
      <div class="mb-2 flex items-center gap-2 font-bold text-white">
        <span class="grid size-7 place-items-center rounded-md bg-white text-sm text-ink">G</span>
        Goliath Solutions
      </div>
      <p class="text-sm">The Goliath Growth System — website, local SEO, and marketing, done for you. Based in Florida. Working everywhere.</p>
    </div>
    <div class="text-sm">
      <h5 class="mb-2 font-semibold text-white">Site</h5>
      <ul class="space-y-1">
        <li><a href="/#included" class="hover:text-white">The System</a></li>
        <li><a href="/#pricing" class="hover:text-white">Pricing</a></li>
        <li><a href="/work" class="hover:text-white">Work</a></li>
        <li><a href="/about" class="hover:text-white">About</a></li>
        <li><a href="/contact" class="hover:text-white">Contact</a></li>
      </ul>
    </div>
    <div class="text-sm">
      <h5 class="mb-2 font-semibold text-white">Get in touch</h5>
      <ul class="space-y-1">
        <li><a href={`mailto:${CONTACT_EMAIL}`} class="hover:text-white">{CONTACT_EMAIL}</a></li>
        <li><a href={`tel:${CONTACT_PHONE}`} class="hover:text-white">{CONTACT_PHONE_DISPLAY}</a></li>
      </ul>
    </div>
  </div>
  <div class="border-t border-white/10 py-5 text-center text-xs">
    © {year} Goliath Solutions. Made for builders, doers, and operators.
  </div>
</footer>
```

- [ ] **Step 5: Create `src/layouts/Layout.astro`**

```astro
---
import '../styles/global.css';
import Nav from '../components/Nav.astro';
import Footer from '../components/Footer.astro';
import { CONTACT_EMAIL, CONTACT_PHONE, PRICING } from '../config';

interface Props {
  title: string;
  description: string;
  withSchema?: boolean;
}
const { title, description, withSchema = false } = Astro.props;
const canonical = new URL(Astro.url.pathname, Astro.site);
const schema = {
  '@context': 'https://schema.org',
  '@type': 'ProfessionalService',
  name: 'Goliath Solutions',
  url: 'https://goliath.solutions',
  email: CONTACT_EMAIL,
  telephone: CONTACT_PHONE,
  founder: { '@type': 'Person', name: 'Joe Ford' },
  areaServed: 'US',
  description,
  offers: {
    '@type': 'Offer',
    name: 'The Goliath Growth System',
    price: String(PRICING.monthly),
    priceCurrency: 'USD',
  },
};
---
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonical} />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:type" content="website" />
    <meta property="og:url" content={canonical} />
    <meta property="og:image" content="/og.png" />
    <link rel="sitemap" href="/sitemap-index.xml" />
    {withSchema && <script type="application/ld+json" set:html={JSON.stringify(schema)} />}
  </head>
  <body class="bg-white font-sans text-ink antialiased">
    <Nav />
    <slot />
    <Footer />
  </body>
</html>
```

- [ ] **Step 6: Point stub index at Layout to verify wiring**

Replace `src/pages/index.astro` with:

```astro
---
import Layout from '../layouts/Layout.astro';
---
<Layout title="Goliath Solutions" description="Stub" withSchema>
  <h1>Stub — replaced in Task 3</h1>
</Layout>
```

- [ ] **Step 7: Build to verify**

Run: `npm run build`
Expected: success. `grep -c 'ProfessionalService' dist/index.html` → `1`. `grep -c '<nav' dist/index.html` → `1`.

- [ ] **Step 8: Commit**

```bash
git add src public/favicon.svg
git commit -m "feat: add config constants, Layout, Nav, Footer"
```

---

### Task 3: Home page (long-form landing) + PricingCard, CaseCard, FAQ

**Files:**
- Create: `src/components/PricingCard.astro`, `src/components/CaseCard.astro`, `src/components/FAQ.astro`
- Modify: `src/pages/index.astro` (full replace)

**Interfaces:**
- Consumes: `Layout` props from Task 2; `PRICING`, `BOOKING_URL` from `src/config.ts`.
- Produces: `CaseCard` props `{ tag: string; title: string; blurb: string; stats: { n: string; l: string }[]; href: string; theme: 'ocean' | 'pool' }` (reused by Task 4); `FAQ` props `{ items: { q: string; a: string }[] }`; section ids `#included` and `#pricing` on the home page (nav + redirects depend on them).

- [ ] **Step 1: Create `src/components/PricingCard.astro`**

```astro
---
import { PRICING, BOOKING_URL } from '../config';
---
<div class="mx-auto max-w-lg rounded-3xl border border-ink/10 bg-white p-8 shadow-xl shadow-ink/5">
  <p class="text-sm font-semibold uppercase tracking-wide text-accent">The Goliath Growth System</p>
  <div class="mt-4 flex items-baseline gap-2">
    <span class="text-5xl font-bold">${PRICING.setup.toLocaleString()}</span>
    <span class="text-ink/60">one-time build</span>
  </div>
  <div class="mt-1 flex items-baseline gap-2">
    <span class="text-3xl font-bold">${PRICING.monthly}</span>
    <span class="text-ink/60">/month, done for you</span>
  </div>
  <ul class="mt-6 space-y-2 text-sm">
    {[
      'Custom website built to book jobs',
      'Local SEO + Google Business Profile, managed monthly',
      'Review generation + referral automation',
      'Lead capture with fast follow-up',
      'Monthly marketing + a plain-English report',
    ].map((item) => (
      <li class="flex gap-2"><span class="text-accent">✓</span>{item}</li>
    ))}
  </ul>
  <a href={BOOKING_URL} class="mt-8 block rounded-full bg-accent py-3 text-center font-semibold text-white hover:bg-accent/90">
    Book a free call
  </a>
  <p class="mt-3 text-center text-xs text-ink/50">Month to month. No long contracts. Cancel anytime.</p>
</div>
```

- [ ] **Step 2: Create `src/components/CaseCard.astro`**

```astro
---
interface Props {
  tag: string;
  title: string;
  blurb: string;
  stats: { n: string; l: string }[];
  href: string;
  theme: 'ocean' | 'pool';
}
const { tag, title, blurb, stats, href, theme } = Astro.props;
const bg = theme === 'ocean'
  ? 'bg-gradient-to-br from-[#0a1929] to-[#0b3a63]'
  : 'bg-gradient-to-br from-[#053b3a] to-[#0a6e63]';
---
<a href={href} class={`block rounded-3xl p-8 text-white transition hover:-translate-y-1 ${bg}`}>
  <span class="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">{tag}</span>
  <h3 class="mt-4 text-2xl font-bold">{title}</h3>
  <p class="mt-2 text-white/80">{blurb}</p>
  <div class="mt-6 flex gap-8">
    {stats.map((s) => (
      <div><div class="text-2xl font-bold">{s.n}</div><div class="text-xs text-white/70">{s.l}</div></div>
    ))}
  </div>
</a>
```

- [ ] **Step 3: Create `src/components/FAQ.astro`**

```astro
---
interface Props {
  items: { q: string; a: string }[];
}
const { items } = Astro.props;
---
<div class="mx-auto max-w-2xl divide-y divide-ink/10">
  {items.map((item) => (
    <details class="group py-4">
      <summary class="flex cursor-pointer list-none items-center justify-between font-semibold">
        {item.q}
        <span class="text-accent transition group-open:rotate-45">+</span>
      </summary>
      <p class="mt-2 text-ink/70">{item.a}</p>
    </details>
  ))}
</div>
```

- [ ] **Step 4: Replace `src/pages/index.astro` with the full landing page**

```astro
---
import Layout from '../layouts/Layout.astro';
import PricingCard from '../components/PricingCard.astro';
import CaseCard from '../components/CaseCard.astro';
import FAQ from '../components/FAQ.astro';
import { PRICING, BOOKING_URL } from '../config';

const faqItems = [
  { q: 'What exactly do I get?', a: `A custom website built to turn visitors into booked jobs, ongoing local SEO and Google Business Profile management, automated review collection, lead capture with fast follow-up, and monthly marketing — all handled for you for $${PRICING.monthly}/month after a $${PRICING.setup.toLocaleString()} build.` },
  { q: 'How fast will my site launch?', a: 'Most sites launch within two weeks of our kickoff call. SEO and reviews start working from day one after launch.' },
  { q: 'Do I own my website?', a: 'Yes. Your domain, your content, your data. If you ever leave, the site goes with you.' },
  { q: 'Is there a contract?', a: 'Month to month. We keep your business by earning it, not by locking you in.' },
  { q: 'What trades do you work with?', a: 'Plumbers, roofers, pool service, HVAC, electricians, landscapers, contractors, adjusters — if you run crews and answer phones, this is built for you.' },
  { q: 'What if I need something bigger?', a: 'We also build custom apps, AI agents, and automations for operators who want more. Book a call and tell us where it hurts.' },
];
---
<Layout
  title="Goliath Solutions — Website, SEO & Marketing for the Trades, Done For You"
  description={`The Goliath Growth System: a fast website, local SEO, Google Business Profile, reviews, and marketing — done for you for $${PRICING.monthly}/mo. Built for blue collar service businesses.`}
  withSchema
>
  <!-- HERO -->
  <section class="bg-paper">
    <div class="mx-auto max-w-6xl px-5 py-20 text-center sm:py-28">
      <p class="font-semibold text-accent">For plumbers, roofers, pool techs, HVAC, contractors — every trade.</p>
      <h1 class="mx-auto mt-4 max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
        Your whole online presence. Handled.
      </h1>
      <p class="mx-auto mt-5 max-w-2xl text-lg text-ink/70">
        One package: a fast website, top-of-Google local SEO, reviews on autopilot, and marketing that gets your
        phone ringing — done for you, for less than a part-time office hire.
      </p>
      <div class="mt-8 flex flex-wrap justify-center gap-3">
        <a href={BOOKING_URL} class="rounded-full bg-accent px-6 py-3 font-semibold text-white hover:bg-accent/90">Book a free call →</a>
        <a href="#included" class="rounded-full border border-ink/20 px-6 py-3 font-semibold hover:bg-ink/5">See the system</a>
      </div>
      <p class="mt-6 text-sm text-ink/50">Built by Joe Ford — 14 years running real businesses, not slide decks.</p>
    </div>
  </section>

  <!-- PAIN -->
  <section class="mx-auto max-w-6xl px-5 py-20">
    <h2 class="text-center text-3xl font-bold sm:text-4xl">Great work isn't enough anymore.</h2>
    <div class="mt-10 grid gap-6 sm:grid-cols-3">
      <div class="rounded-2xl bg-paper p-6">
        <h3 class="font-bold">Invisible on Google</h3>
        <p class="mt-2 text-sm text-ink/70">The guy with worse work but a better Google profile is taking your calls. Ranking is a system, not luck.</p>
      </div>
      <div class="rounded-2xl bg-paper p-6">
        <h3 class="font-bold">Missed calls, missed jobs</h3>
        <p class="mt-2 text-sm text-ink/70">Every unanswered lead calls the next name on the list. Capture and follow-up shouldn't depend on whoever's near the phone.</p>
      </div>
      <div class="rounded-2xl bg-paper p-6">
        <h3 class="font-bold">Agency games</h3>
        <p class="mt-2 text-sm text-ink/70">$5,000+ builds, $2,000/mo retainers, jargon reports, and a site that still doesn't ring the phone. You deserve straight talk and a straight price.</p>
      </div>
    </div>
  </section>

  <!-- INCLUDED -->
  <section id="included" class="bg-ink text-white">
    <div class="mx-auto max-w-6xl px-5 py-20">
      <p class="font-semibold text-accent-soft">The Goliath Growth System</p>
      <h2 class="mt-2 max-w-2xl text-3xl font-bold sm:text-4xl">Everything your business needs to win online. One system. One price.</h2>
      <div class="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[
          ['Website that books jobs', 'Fast, clean, and built around one goal: turning visitors into calls and booked work. Loads in under a second.'],
          ['Local SEO, managed', 'Neighborhood-level targeting so you show up when someone searches "your trade near me." Managed every month, not set-and-forget.'],
          ['Google Business Profile', 'Optimized, posted to, and maintained — the map pack is where local jobs come from.'],
          ['Reviews on autopilot', 'Every finished job triggers a review ask that doesn’t feel spammy. Your rating climbs while you work.'],
          ['Lead capture + follow-up', 'Quote forms and call tracking wired so no lead slips. Fast follow-up wins the job.'],
          ['Plain-English reporting', 'One monthly report: calls, leads, rankings, reviews. No jargon, no vanity metrics.'],
        ].map(([title, body]) => (
          <div class="rounded-2xl bg-white/5 p-6">
            <h3 class="font-bold">{title}</h3>
            <p class="mt-2 text-sm text-white/70">{body}</p>
          </div>
        ))}
      </div>
    </div>
  </section>

  <!-- PRICING -->
  <section id="pricing" class="bg-paper">
    <div class="mx-auto max-w-6xl px-5 py-20">
      <h2 class="text-center text-3xl font-bold sm:text-4xl">Simple, honest pricing.</h2>
      <p class="mx-auto mt-3 max-w-xl text-center text-ink/70">
        Agencies charge $5,000+ to build and $2,000+/month to "manage." We built a leaner system and pass the savings to you.
      </p>
      <div class="mt-10"><PricingCard /></div>
      <p class="mt-8 text-center text-sm text-ink/60">
        Bigger project? We also build custom apps, AI agents, and automation. <a href="/contact" class="font-semibold text-accent">Talk to us →</a>
      </p>
    </div>
  </section>

  <!-- PROOF -->
  <section class="mx-auto max-w-6xl px-5 py-20">
    <h2 class="text-3xl font-bold sm:text-4xl">Real work for real operators.</h2>
    <div class="mt-10 grid gap-6 sm:grid-cols-2">
      <CaseCard
        tag="Insurance Tech"
        title="Dolphin Claims"
        blurb="An AI claims assistant and ops platform that cuts policyholder intake from hours to minutes."
        stats={[{ n: '4x', l: 'Faster intake' }, { n: '24/7', l: 'Response' }, { n: '100%', l: 'Logged' }]}
        href="/work#dolphin"
        theme="ocean"
      />
      <CaseCard
        tag="Home Services"
        title="Florida's Best Pools"
        blurb="Website, booking, and an AI receptionist that answers every lead — day or night."
        stats={[{ n: '3x', l: 'Lead capture' }, { n: '#1', l: 'Local rank' }, { n: '0', l: 'Missed calls' }]}
        href="/work#pools"
        theme="pool"
      />
    </div>
  </section>

  <!-- FOUNDER TEASER -->
  <section class="bg-paper">
    <div class="mx-auto flex max-w-4xl flex-col items-center gap-6 px-5 py-20 text-center">
      <div class="grid size-24 place-items-center rounded-full bg-ink text-3xl font-bold text-white">JF</div>
      <blockquote class="max-w-2xl text-xl font-medium">
        "I've run businesses for 14 years. I know what it's like to lose a job because your website looks like 2009
        and your phone rang while you were on a roof. That's why this exists."
      </blockquote>
      <p class="text-sm text-ink/60">Joe Ford, founder — Goliath Solutions</p>
      <a href="/about" class="font-semibold text-accent">Read the story →</a>
    </div>
  </section>

  <!-- PROCESS -->
  <section class="mx-auto max-w-6xl px-5 py-20">
    <h2 class="text-center text-3xl font-bold sm:text-4xl">How it works.</h2>
    <div class="mt-10 grid gap-6 sm:grid-cols-4">
      {[
        ['01', 'Call', 'A free 30-minute call. Your business, your market, your bottlenecks.'],
        ['02', 'Build', 'We build your site and set up the system. About two weeks.'],
        ['03', 'Launch', 'Site live, Google profile tuned, reviews and lead capture switched on.'],
        ['04', 'Grow', 'We run it monthly — SEO, reviews, marketing — and report in plain English.'],
      ].map(([num, title, body]) => (
        <div class="rounded-2xl border border-ink/10 p-6">
          <div class="text-sm font-bold text-accent">{num}</div>
          <h3 class="mt-1 font-bold">{title}</h3>
          <p class="mt-2 text-sm text-ink/70">{body}</p>
        </div>
      ))}
    </div>
  </section>

  <!-- FAQ -->
  <section class="bg-paper">
    <div class="mx-auto max-w-6xl px-5 py-20">
      <h2 class="text-center text-3xl font-bold sm:text-4xl">Questions, answered straight.</h2>
      <div class="mt-10"><FAQ items={faqItems} /></div>
    </div>
  </section>

  <!-- CTA -->
  <section class="bg-ink text-center text-white">
    <div class="mx-auto max-w-3xl px-5 py-20">
      <h2 class="text-3xl font-bold sm:text-4xl">Let's make your business hard to beat.</h2>
      <p class="mt-3 text-white/70">Free call. No pressure. If we're not the right fit, we'll point you to someone who is.</p>
      <div class="mt-8 flex flex-wrap justify-center gap-3">
        <a href={BOOKING_URL} class="rounded-full bg-accent px-6 py-3 font-semibold text-white hover:bg-accent/90">Book a free call →</a>
        <a href="/contact" class="rounded-full border border-white/30 px-6 py-3 font-semibold hover:bg-white/10">Get a quote</a>
      </div>
    </div>
  </section>
</Layout>
```

- [ ] **Step 5: Build to verify**

Run: `npm run build`
Expected: success. `grep -c 'id="included"' dist/index.html` → `1`. `grep -c 'id="pricing"' dist/index.html` → `1`. `grep -c '\$1,500' dist/index.html` → at least `1`.

- [ ] **Step 6: Commit**

```bash
git add src
git commit -m "feat: build long-form landing page with pricing, proof, FAQ"
```

---

### Task 4: Work and About pages

**Files:**
- Create: `src/pages/work.astro`, `src/pages/about.astro`

**Interfaces:**
- Consumes: `Layout`, `CaseCard` (Task 3 props), `BOOKING_URL`.
- Produces: anchors `#dolphin` and `#pools` on `/work` (home page cards link to them).

- [ ] **Step 1: Create `src/pages/work.astro`**

```astro
---
import Layout from '../layouts/Layout.astro';
import { BOOKING_URL } from '../config';

const cases = [
  {
    id: 'dolphin',
    tag: 'Insurance Tech',
    title: 'Dolphin Claims',
    problem: 'Policyholder intake took hours of phone tag and manual data entry, and after-hours leads went cold.',
    built: 'An AI claims assistant and ops platform: guided intake, document collection, and status updates — all logged automatically.',
    results: [
      ['4x', 'Faster intake'],
      ['24/7', 'Response, even at 2 a.m.'],
      ['100%', 'Of interactions logged'],
    ],
  },
  {
    id: 'pools',
    tag: 'Home Services',
    title: "Florida's Best Pools",
    problem: 'Great service, invisible online. Missed calls during service hours meant missed customers.',
    built: 'A fast website with booking, local SEO and Google Business management, and an AI receptionist that answers every lead — day or night.',
    results: [
      ['3x', 'Lead capture'],
      ['#1', 'Local ranking'],
      ['0', 'Missed calls'],
    ],
  },
];
---
<Layout
  title="Work — Goliath Solutions"
  description="Case studies: how Goliath Solutions builds websites, SEO, and AI systems that win jobs for real operators."
>
  <section class="bg-paper px-5 py-16 text-center">
    <h1 class="text-4xl font-bold sm:text-5xl">Proof, not promises.</h1>
    <p class="mx-auto mt-4 max-w-xl text-ink/70">Real work for real operators. Here's what happened when they switched their online presence on.</p>
  </section>

  {cases.map((c) => (
    <section id={c.id} class="mx-auto max-w-4xl px-5 py-16">
      <span class="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">{c.tag}</span>
      <h2 class="mt-3 text-3xl font-bold">{c.title}</h2>
      <div class="mt-6 grid gap-8 sm:grid-cols-2">
        <div>
          <h3 class="font-semibold text-ink/50">The problem</h3>
          <p class="mt-1">{c.problem}</p>
          <h3 class="mt-5 font-semibold text-ink/50">What we built</h3>
          <p class="mt-1">{c.built}</p>
        </div>
        <div class="grid grid-cols-3 content-start gap-4">
          {c.results.map(([n, l]) => (
            <div class="rounded-2xl bg-paper p-4 text-center">
              <div class="text-2xl font-bold text-accent">{n}</div>
              <div class="mt-1 text-xs text-ink/60">{l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  ))}

  <section class="bg-ink px-5 py-16 text-center text-white">
    <h2 class="text-3xl font-bold">Want results like these?</h2>
    <a href={BOOKING_URL} class="mt-6 inline-block rounded-full bg-accent px-6 py-3 font-semibold hover:bg-accent/90">Book a free call →</a>
  </section>
</Layout>
```

- [ ] **Step 2: Create `src/pages/about.astro`**

```astro
---
import Layout from '../layouts/Layout.astro';
import { BOOKING_URL } from '../config';
---
<Layout
  title="About — Goliath Solutions"
  description="Joe Ford spent 14 years running real businesses before building Goliath Solutions — websites, SEO, and marketing systems for the trades."
>
  <section class="bg-paper px-5 py-16 text-center">
    <div class="mx-auto grid size-28 place-items-center rounded-full bg-ink text-4xl font-bold text-white">JF</div>
    <!-- TODO(Joe): replace the JF badge above with a real photo in src/assets and <Image /> -->
    <h1 class="mt-6 text-4xl font-bold sm:text-5xl">Built by an operator,<br />not an agency.</h1>
  </section>

  <section class="mx-auto max-w-2xl space-y-5 px-5 py-16 text-lg leading-relaxed">
    <p>I'm Joe Ford. I've spent the last 14 years running real businesses — hiring crews, chasing invoices, answering phones at dinner, and learning the hard way what actually brings work in the door.</p>
    <p>Along the way I got deep into the other side: building websites, ranking on Google, wiring up automations, and putting AI to work. I built these systems for my own companies first. Then friends in the trades started asking for the same thing.</p>
    <p>That became Goliath Solutions. One package that handles the whole online side of a service business — website, local SEO, Google Business, reviews, marketing — for a price a working company can actually justify.</p>
    <p>No account managers. No jargon reports. No $2,000/month retainers for two blog posts. You deal with me, you see the numbers, and if we're not earning our keep, you leave — month to month.</p>
    <p class="font-semibold">Great work deserves to be found. Let's make sure yours is.</p>
  </section>

  <section class="bg-ink px-5 py-16 text-center text-white">
    <h2 class="text-3xl font-bold">Tell me where it hurts.</h2>
    <p class="mt-2 text-white/70">The first call is free and useful — even if you never hire us.</p>
    <a href={BOOKING_URL} class="mt-6 inline-block rounded-full bg-accent px-6 py-3 font-semibold hover:bg-accent/90">Book a free call →</a>
  </section>
</Layout>
```

- [ ] **Step 3: Build to verify**

Run: `npm run build`
Expected: success. `dist/work.html` and `dist/about.html` exist. `grep -c 'id="dolphin"' dist/work.html` → `1`.

- [ ] **Step 4: Commit**

```bash
git add src/pages/work.astro src/pages/about.astro
git commit -m "feat: add work case studies and founder about page"
```

---

### Task 5: Contact page with QuoteForm island

**Files:**
- Create: `src/components/QuoteForm.astro`, `src/pages/contact.astro`

**Interfaces:**
- Consumes: `Layout`, `BOOKING_URL`, `CONTACT_EMAIL`, `CONTACT_PHONE`, `CONTACT_PHONE_DISPLAY`.
- Produces: form POSTs JSON `{ name, trade, phone, city, message, website }` to `/api/lead` (Task 6 implements the endpoint; the `website` field is the hidden honeypot and must be sent, empty, for legitimate users). Success/failure text rendered into `[data-status]`.

- [ ] **Step 1: Create `src/components/QuoteForm.astro`**

```astro
<form id="quote-form" class="space-y-4" novalidate>
  <div class="grid gap-4 sm:grid-cols-2">
    <label class="block text-sm font-semibold">
      Name
      <input name="name" required minlength="2" maxlength="100" class="mt-1 w-full rounded-lg border border-ink/20 px-3 py-2 font-normal" />
    </label>
    <label class="block text-sm font-semibold">
      Trade
      <input name="trade" required minlength="2" maxlength="100" placeholder="Plumbing, roofing, pools…" class="mt-1 w-full rounded-lg border border-ink/20 px-3 py-2 font-normal" />
    </label>
    <label class="block text-sm font-semibold">
      Phone
      <input name="phone" type="tel" required minlength="7" maxlength="25" class="mt-1 w-full rounded-lg border border-ink/20 px-3 py-2 font-normal" />
    </label>
    <label class="block text-sm font-semibold">
      City
      <input name="city" required minlength="2" maxlength="100" class="mt-1 w-full rounded-lg border border-ink/20 px-3 py-2 font-normal" />
    </label>
  </div>
  <label class="block text-sm font-semibold">
    What do you need? <span class="font-normal text-ink/50">(optional)</span>
    <textarea name="message" maxlength="2000" rows="4" class="mt-1 w-full rounded-lg border border-ink/20 px-3 py-2 font-normal"></textarea>
  </label>
  <!-- Honeypot: hidden from humans, bots fill it -->
  <input name="website" tabindex="-1" autocomplete="off" aria-hidden="true" class="hidden" />
  <button type="submit" class="rounded-full bg-accent px-6 py-3 font-semibold text-white hover:bg-accent/90">
    Send my quote request →
  </button>
  <p data-status role="status" class="text-sm font-medium"></p>
</form>

<script>
  const form = document.getElementById('quote-form') as HTMLFormElement;
  const status = form.querySelector('[data-status]') as HTMLElement;
  const button = form.querySelector('button[type="submit"]') as HTMLButtonElement;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    button.disabled = true;
    status.textContent = 'Sending…';
    const data = Object.fromEntries(new FormData(form));
    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(String(res.status));
      form.reset();
      status.textContent = "Got it — we'll call you within one business day.";
    } catch {
      status.textContent = 'Something went wrong — call or email us instead.';
    } finally {
      button.disabled = false;
    }
  });
</script>
```

- [ ] **Step 2: Create `src/pages/contact.astro`**

```astro
---
import Layout from '../layouts/Layout.astro';
import QuoteForm from '../components/QuoteForm.astro';
import { BOOKING_URL, CONTACT_EMAIL, CONTACT_PHONE, CONTACT_PHONE_DISPLAY } from '../config';
---
<Layout
  title="Contact — Goliath Solutions"
  description="Get a quote for the Goliath Growth System or book a free call. Website, local SEO, and marketing for the trades — done for you."
>
  <section class="bg-paper px-5 py-16 text-center">
    <h1 class="text-4xl font-bold sm:text-5xl">Tell us where it hurts.</h1>
    <p class="mx-auto mt-4 max-w-xl text-ink/70">Two ways in: grab a time on the calendar, or send the form and we'll call you.</p>
    <a href={BOOKING_URL} class="mt-6 inline-block rounded-full bg-accent px-6 py-3 font-semibold text-white hover:bg-accent/90">
      Book a free 30-minute call →
    </a>
  </section>

  <section class="mx-auto max-w-2xl px-5 py-16">
    <h2 class="text-2xl font-bold">Or request a quote</h2>
    <p class="mt-2 text-ink/70">Takes 30 seconds. We reply within one business day.</p>
    <div class="mt-8"><QuoteForm /></div>
    <p class="mt-10 text-sm text-ink/60">
      Prefer direct? <a href={`mailto:${CONTACT_EMAIL}`} class="font-semibold text-accent">{CONTACT_EMAIL}</a>
      · <a href={`tel:${CONTACT_PHONE}`} class="font-semibold text-accent">{CONTACT_PHONE_DISPLAY}</a>
    </p>
  </section>
</Layout>
```

- [ ] **Step 3: Build to verify**

Run: `npm run build`
Expected: success. `dist/contact.html` exists. `grep -c 'quote-form' dist/contact.html` → at least `1`. Confirm the only page pulling a script bundle is contact: `grep -l '<script' dist/*.html` → only `dist/contact.html` (Layout's JSON-LD `<script type="application/ld+json">` on index is inline data, not JS — if grep matches it, refine to `grep -l 'script type="module"' dist/*.html`).

- [ ] **Step 4: Commit**

```bash
git add src/components/QuoteForm.astro src/pages/contact.astro
git commit -m "feat: add contact page with quote form island"
```

---

### Task 6: Lead API — validation (TDD) + handler

**Files:**
- Create: `api/_lib/validate.ts`, `api/_lib/validate.test.ts`, `api/lead.ts`, `api/lead.test.ts`
- Do NOT touch: `api/qbo/*`

**Interfaces:**
- Consumes: JSON body shape from Task 5's form.
- Produces: `parseLead(body: unknown): { ok: true; lead: Lead } | { ok: false; reason: 'spam' | 'invalid' }` and `type Lead = { name: string; trade: string; phone: string; city: string; message: string }` from `api/_lib/validate.ts`; default-export Vercel handler at `POST /api/lead` returning `200 { ok: true }` on success and spam, `400 { error }` on invalid, `405` on non-POST. Env vars: `RESEND_API_KEY` (optional — logs when absent), `LEAD_TO_EMAIL` (default `fordclaim@gmail.com`).

- [ ] **Step 1: Write failing tests `api/_lib/validate.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { parseLead } from './validate';

const valid = {
  name: 'Mike Rowe',
  trade: 'Plumbing',
  phone: '(561) 555-0100',
  city: 'West Palm Beach',
  message: 'Need a new site',
  website: '',
};

describe('parseLead', () => {
  it('accepts a valid lead', () => {
    const r = parseLead(valid);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.lead.name).toBe('Mike Rowe');
  });

  it('accepts a lead with message omitted', () => {
    const { message, ...rest } = valid;
    expect(parseLead(rest).ok).toBe(true);
  });

  it('rejects missing phone as invalid', () => {
    const { phone, ...rest } = valid;
    const r = parseLead(rest);
    expect(r).toEqual({ ok: false, reason: 'invalid' });
  });

  it('rejects a phone with letters as invalid', () => {
    const r = parseLead({ ...valid, phone: 'call me maybe' });
    expect(r).toEqual({ ok: false, reason: 'invalid' });
  });

  it('flags filled honeypot as spam', () => {
    const r = parseLead({ ...valid, website: 'https://spam.example' });
    expect(r).toEqual({ ok: false, reason: 'spam' });
  });

  it('rejects oversized message as invalid', () => {
    const r = parseLead({ ...valid, message: 'x'.repeat(2001) });
    expect(r).toEqual({ ok: false, reason: 'invalid' });
  });

  it('rejects non-object body as invalid', () => {
    expect(parseLead('nope')).toEqual({ ok: false, reason: 'invalid' });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run api/_lib/validate.test.ts`
Expected: FAIL — cannot resolve `./validate`.

- [ ] **Step 3: Implement `api/_lib/validate.ts`**

```ts
import { z } from 'zod';

const leadSchema = z.object({
  name: z.string().trim().min(2).max(100),
  trade: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(7).max(25).regex(/^[0-9+().\-\s]+$/),
  city: z.string().trim().min(2).max(100),
  message: z.string().trim().max(2000).optional().default(''),
});

export type Lead = z.infer<typeof leadSchema>;

export function parseLead(
  body: unknown,
): { ok: true; lead: Lead } | { ok: false; reason: 'spam' | 'invalid' } {
  if (typeof body !== 'object' || body === null) return { ok: false, reason: 'invalid' };
  const honeypot = (body as Record<string, unknown>).website;
  if (typeof honeypot === 'string' && honeypot.length > 0) return { ok: false, reason: 'spam' };
  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) return { ok: false, reason: 'invalid' };
  return { ok: true, lead: parsed.data };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run api/_lib/validate.test.ts`
Expected: 7 passing.

- [ ] **Step 5: Write failing handler tests `api/lead.test.ts`**

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import handler from './lead';

function mockRes() {
  const res: any = {};
  res.statusCode = 0;
  res.body = undefined;
  res.status = vi.fn((code: number) => ((res.statusCode = code), res));
  res.json = vi.fn((payload: unknown) => ((res.body = payload), res));
  return res;
}

const valid = {
  name: 'Mike Rowe',
  trade: 'Plumbing',
  phone: '(561) 555-0100',
  city: 'West Palm Beach',
  message: '',
  website: '',
};

describe('POST /api/lead', () => {
  beforeEach(() => {
    delete process.env.RESEND_API_KEY;
    vi.restoreAllMocks();
  });

  it('rejects non-POST with 405', async () => {
    const res = mockRes();
    await handler({ method: 'GET', body: {} } as any, res);
    expect(res.statusCode).toBe(405);
  });

  it('returns 400 for invalid body', async () => {
    const res = mockRes();
    await handler({ method: 'POST', body: { name: 'x' } } as any, res);
    expect(res.statusCode).toBe(400);
  });

  it('returns 200 ok for spam without sending email', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const res = mockRes();
    await handler({ method: 'POST', body: { ...valid, website: 'spam' } } as any, res);
    expect(res.statusCode).toBe(200);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('returns 200 and logs when RESEND_API_KEY is unset', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const res = mockRes();
    await handler({ method: 'POST', body: valid } as any, res);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ok: true });
    expect(logSpy).toHaveBeenCalled();
  });

  it('sends via Resend when RESEND_API_KEY is set', async () => {
    process.env.RESEND_API_KEY = 're_test_123';
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('{}', { status: 200 }));
    const res = mockRes();
    await handler({ method: 'POST', body: valid } as any, res);
    expect(res.statusCode).toBe(200);
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.resend.com/emails',
      expect.objectContaining({ method: 'POST' }),
    );
  });
});
```

- [ ] **Step 6: Run tests to verify they fail**

Run: `npx vitest run api/lead.test.ts`
Expected: FAIL — cannot resolve `./lead`.

- [ ] **Step 7: Implement `api/lead.ts`**

```ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { parseLead, type Lead } from './_lib/validate';

async function sendEmail(lead: Lead): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    // TODO(Joe): set RESEND_API_KEY in Vercel env to enable email delivery
    console.log('[lead] RESEND_API_KEY not set — lead received:', JSON.stringify(lead));
    return;
  }
  const to = process.env.LEAD_TO_EMAIL ?? 'fordclaim@gmail.com';
  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Goliath Leads <leads@goliath.solutions>',
      to: [to],
      subject: `New lead: ${lead.name} — ${lead.trade} (${lead.city})`,
      text: `Name: ${lead.name}\nTrade: ${lead.trade}\nPhone: ${lead.phone}\nCity: ${lead.city}\n\n${lead.message}`,
    }),
  });
  if (!resp.ok) {
    console.error('[lead] Resend error', resp.status, await resp.text());
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const result = parseLead(req.body);
  if (!result.ok) {
    if (result.reason === 'spam') return res.status(200).json({ ok: true }); // don't tip off bots
    return res.status(400).json({ error: 'Invalid submission' });
  }
  await sendEmail(result.lead);
  return res.status(200).json({ ok: true });
}
```

- [ ] **Step 8: Run all unit tests**

Run: `npm test`
Expected: 12 passing (7 validate + 5 handler), zero failures.

- [ ] **Step 9: Commit**

```bash
git add api/_lib api/lead.ts api/lead.test.ts
git commit -m "feat: add /api/lead with zod validation, honeypot, Resend delivery"
```

---

### Task 7: vercel.json redirects, robots.txt, OG image, README

**Files:**
- Modify: `vercel.json` (full replace)
- Create: `public/robots.txt`, `scripts/generate-og.mjs`, `public/og.png` (generated), `README.md`

**Interfaces:**
- Consumes: section ids `#included`/`#pricing` (Task 3); `/og.png` referenced by Layout (Task 2).
- Produces: 301s from every old URL; documented manual steps for Joe.

- [ ] **Step 1: Replace `vercel.json`**

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "cleanUrls": true,
  "trailingSlash": false,
  "redirects": [
    { "source": "/services", "destination": "/#included", "permanent": true },
    { "source": "/services.html", "destination": "/#included", "permanent": true },
    { "source": "/index.html", "destination": "/", "permanent": true },
    { "source": "/about.html", "destination": "/about", "permanent": true },
    { "source": "/work.html", "destination": "/work", "permanent": true },
    { "source": "/contact.html", "destination": "/contact", "permanent": true }
  ],
  "headers": [
    {
      "source": "/_astro/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
```

- [ ] **Step 2: Create `public/robots.txt`**

```
User-agent: *
Allow: /

Sitemap: https://goliath.solutions/sitemap-index.xml
```

- [ ] **Step 3: Create `scripts/generate-og.mjs` and generate `public/og.png`**

```js
import sharp from 'sharp';

const svg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#1d1d1f"/>
  <rect x="80" y="80" width="96" height="96" rx="20" fill="#ffffff"/>
  <text x="128" y="148" text-anchor="middle" font-family="Helvetica" font-size="60" font-weight="700" fill="#1d1d1f">G</text>
  <text x="80" y="320" font-family="Helvetica" font-size="72" font-weight="700" fill="#ffffff">Goliath Solutions</text>
  <text x="80" y="400" font-family="Helvetica" font-size="36" fill="#a1a1a6">Website, SEO &amp; marketing for the trades.</text>
  <text x="80" y="452" font-family="Helvetica" font-size="36" fill="#4ea3f5">Done for you.</text>
</svg>`;

await sharp(Buffer.from(svg)).png().toFile('public/og.png');
console.log('wrote public/og.png');
```

Run: `node scripts/generate-og.mjs`
Expected: `wrote public/og.png`; file exists and is >5KB.

- [ ] **Step 4: Create `README.md`**

```markdown
# goliath.solutions

Marketing site for Goliath Solutions — Astro + TypeScript + Tailwind v4, deployed on Vercel.

## Commands

- `npm run dev` — local dev server
- `npm run build` — production build to `dist/`
- `npm test` — API unit tests (Vitest)
- `npm run test:e2e` — Playwright smoke tests

## Editing the offer

All pricing, booking, and contact values live in `src/config.ts`. Edit there; every page updates.

## Manual setup (Joe)

1. **sitelee.io redirect:** In the Vercel dashboard, add `sitelee.io` (and `www.sitelee.io`) as domains
   on this project, set them to **Redirect to `goliath.solutions` (308)**.
2. **Lead emails:** Create a [Resend](https://resend.com) API key, verify the `goliath.solutions`
   sending domain, then `vercel env add RESEND_API_KEY`. Optionally `vercel env add LEAD_TO_EMAIL`
   (defaults to fordclaim@gmail.com). Until the key is set, leads are logged in Vercel function
   logs, not emailed.
3. **Booking link:** Replace `BOOKING_URL` in `src/config.ts` with your Cal.com/Calendly URL.
4. **Phone:** Replace `CONTACT_PHONE` / `CONTACT_PHONE_DISPLAY` in `src/config.ts`.
5. **Founder photo:** Replace the "JF" badge in `src/pages/about.astro` and the home founder section.

## Do not touch

- `public/bookkeeper/` — Intuit QBO app pages, URLs must not change
- `api/qbo/` — QBO OAuth functions
```

- [ ] **Step 5: Build to verify**

Run: `npm run build`
Expected: success. `dist/robots.txt`, `dist/og.png`, `dist/sitemap-index.xml` all exist in the output.

- [ ] **Step 6: Commit**

```bash
git add vercel.json public/robots.txt public/og.png scripts/generate-og.mjs README.md
git commit -m "feat: add redirects, robots, sitemap, OG image, README with manual steps"
```

---

### Task 8: Playwright smoke tests

**Files:**
- Create: `playwright.config.ts`, `e2e/smoke.spec.ts`

**Interfaces:**
- Consumes: built site via `astro preview` (port 4321); form contract from Task 5 (`POST /api/lead`, `[data-status]`).

- [ ] **Step 1: Create `playwright.config.ts`**

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: { baseURL: 'http://localhost:4321' },
  webServer: {
    command: 'npm run preview',
    port: 4321,
    reuseExistingServer: true,
  },
});
```

- [ ] **Step 2: Write `e2e/smoke.spec.ts`**

```ts
import { expect, test } from '@playwright/test';

test('home renders offer and pricing', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('Your whole online presence');
  await expect(page.locator('#pricing')).toContainText('$1,500');
  await expect(page.locator('#pricing')).toContainText('$397');
});

test('work page renders case studies', async ({ page }) => {
  await page.goto('/work');
  await expect(page.locator('#dolphin')).toContainText('Dolphin Claims');
  await expect(page.locator('#pools')).toContainText("Florida's Best Pools");
});

test('about page renders founder story', async ({ page }) => {
  await page.goto('/about');
  await expect(page.locator('h1')).toContainText('operator');
});

test('bookkeeper pages still served', async ({ page }) => {
  const resp = await page.goto('/bookkeeper/');
  expect(resp!.status()).toBe(200);
});

test('quote form submits to /api/lead and shows success', async ({ page }) => {
  // astro preview has no /api — stub the endpoint at the network layer
  await page.route('**/api/lead', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }),
  );
  await page.goto('/contact');
  await page.fill('input[name="name"]', 'Mike Rowe');
  await page.fill('input[name="trade"]', 'Plumbing');
  await page.fill('input[name="phone"]', '(561) 555-0100');
  await page.fill('input[name="city"]', 'West Palm Beach');
  await page.click('button[type="submit"]');
  await expect(page.locator('[data-status]')).toContainText("we'll call you");
});

test('quote form shows failure message on API error', async ({ page }) => {
  await page.route('**/api/lead', (route) => route.fulfill({ status: 500, body: '{}' }));
  await page.goto('/contact');
  await page.fill('input[name="name"]', 'Mike Rowe');
  await page.fill('input[name="trade"]', 'Plumbing');
  await page.fill('input[name="phone"]', '(561) 555-0100');
  await page.fill('input[name="city"]', 'West Palm Beach');
  await page.click('button[type="submit"]');
  await expect(page.locator('[data-status]')).toContainText('Something went wrong');
});
```

- [ ] **Step 3: Install browser and run**

Run: `npx playwright install chromium && npm run build && npm run test:e2e`
Expected: 6 passing.

Note: `/bookkeeper/` test expects the directory index. If preview serves it at `/bookkeeper/index.html` only, change the test to `page.goto('/bookkeeper/index.html')` — the production behavior (Vercel `cleanUrls`) is what matters, and it serves both.

- [ ] **Step 4: Commit**

```bash
git add playwright.config.ts e2e
git commit -m "test: add Playwright smoke suite for pages and quote form"
```

---

### Task 9: Final verification

**Files:** none created — verification only.

- [ ] **Step 1: Full clean check**

```bash
rm -rf dist && npm run build && npm test && npm run test:e2e
```
Expected: build clean, 12 unit tests pass, 6 e2e tests pass.

- [ ] **Step 2: Confirm bookkeeper + qbo untouched**

```bash
git log --oneline -- public/bookkeeper api/qbo | head -5
git diff ce1ccc5 --stat -- api/qbo
```
Expected: `api/qbo` diff empty; bookkeeper history shows only the rename commit.

- [ ] **Step 3: Grep for leftover placeholders that must NOT ship silently**

```bash
grep -rn 'REPLACE-ME\|555-0199\|TODO(Joe)' src api README.md
```
Expected: hits only in `src/config.ts`, `src/pages/about.astro`, and README — all documented for Joe. List them in the final report to the user.

- [ ] **Step 4: Commit any stragglers and report**

```bash
git status --short
```
Expected: clean tree. Report to user: done, plus Lighthouse instruction — deploy preview via `vercel`, then run Lighthouse on the preview URL (form endpoint only works on Vercel, not `astro preview`).
