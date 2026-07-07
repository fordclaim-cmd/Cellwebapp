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
3. **Booking:** All "Book a free call" CTAs route to the on-site quote form (`BOOKING_URL = '/contact#quote'`). To use a calendar instead, set `BOOKING_URL` in `src/config.ts` to a Cal.com/Calendly URL.
4. **Phone:** Replace `CONTACT_PHONE` / `CONTACT_PHONE_DISPLAY` in `src/config.ts`.

## Do not touch

- `public/bookkeeper/` — Intuit QBO app pages, URLs must not change
- `api/qbo/` — QBO OAuth functions
