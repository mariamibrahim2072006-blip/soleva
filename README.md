# SOLEVA — Premium Footwear E-Commerce Platform

A complete bilingual (English / العربية, full RTL) e-commerce experience for a fictional premium footwear brand: cinematic marketing site, full shop with live filtering, product pages with 360° viewer, cart, Cash-on-Delivery checkout, customer accounts, wishlist, order tracking, and a full admin dashboard. Currency: EGP. Delivery: Egyptian governorates with per-governorate shipping fees.

**This is a demo build.** All products, reviews, and contact details are fictional. All imagery is original AI-generated art created for this project.

## Stack

- **Client**: React 18 + TypeScript + Vite + Tailwind CSS v4, GSAP (ScrollTrigger) + Lenis smooth scroll, custom cursor, preloader
- **Server**: Express + TypeScript, JWT auth (customer/admin roles), bcrypt password hashing
- **Database**: PostgreSQL (Neon serverless) — 16 tables: products, variants, categories, coupons, orders, order items, addresses, reviews, wishlists, users, site content
- **Hosting**: Netlify (static frontend + Express API as a serverless function)

## Features

- **Shop**: category / gender / size (EU 36–46) / color / material / price-range / availability filters, sort (newest, price, name), pagination, facet counts from live data
- **Product pages**: image gallery with drag-to-rotate 360° stage, zoom, color + size selectors with sold-out states, size guide modal, reviews (bilingual), related products
- **Cart**: guest cart with merge-on-login, quantity editing, promo codes (WELCOME10, SOLEVA20, FLAT300)
- **Checkout**: guest or signed-in, saved addresses, per-governorate shipping fees, Cash on Delivery; card payments are coded but gated behind Paymob credentials (honestly refused until configured — never faked)
- **Accounts**: profile, order history with live status, addresses, settings; order tracking by code + phone/email
- **Admin dashboard** (`/admin`): KPIs, product CRUD with per-size stock management, order status pipeline, customers, coupons
- **i18n**: full English + Arabic dictionaries, instant toggle, RTL layout flip
- **Motion**: Lenis smooth scroll, GSAP scroll reveals, horizontal-scroll signature section, marquee, mouse-parallax hero, animated preloader

## Demo accounts

| Role | Email | Password |
|---|---|---|
| Admin | admin@soleva-eg.com | *(rotated into the owner's vault at deploy)* |
| Customer | demo@soleva-eg.com | DemoCustomer!2026 |

## Local development

```bash
npm install
echo 'postgresql://...' > .env.db          # Neon connection string
DATABASE_URL="$(cat .env.db)" npx tsx server/seed.ts   # schema + seed
SOLEVA_LOCAL=1 DATABASE_URL="$(cat .env.db)" JWT_SECRET=dev npx tsx server/index.ts   # API on :8787
npm run dev                                # Vite on :5173 (proxies /api)
```

## Deployment (Netlify)

`netlify.toml` builds the frontend (`npm run build` → `dist`) and bundles `netlify/functions/api.ts` (Express wrapped in `serverless-http`). `/api/*` is rewritten to the function; everything else falls back to the SPA.

Required environment variables:

- `DATABASE_URL` — Neon PostgreSQL connection string
- `JWT_SECRET` — session signing secret

```bash
npx netlify deploy --build --prod
```

## Payments

The checkout exposes a card-payment path wired for Paymob (Egypt). It activates only when `PAYMOB_API_KEY`, `PAYMOB_INTEGRATION_ID`, and `PAYMOB_IFRAME_ID` are configured; otherwise card checkout returns an honest "card payments unavailable" response and Cash on Delivery remains fully working.

## Imagery

All 33 images (hero, craft, campaign, and two shots per product) were AI-generated for SOLEVA's monochrome editorial art direction — deep black, ivory, concrete, silver. No stock photography.
