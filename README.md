# Kurospace

**Hybrid marketplace + SaaS** for Nigerian vendors (built to expand across Africa).

Vendors sign up, list products and services, manage orders from a dashboard, and publish a **branded storefront** on a subdomain (`yourbrand.kurospace.com`) with custom colours, typography, theme, and layout. Customers discover shops on the marketplace or via each vendor’s storefront, then pay through **Bachs** (platform merchant, one-time checkout for v1).

---

## Table of contents

1. [Product overview](#product-overview)
2. [Tech stack](#tech-stack)
3. [Features (MVP)](#features-mvp)
4. [Architecture](#architecture)
5. [Project structure](#project-structure)
6. [Prerequisites](#prerequisites)
7. [Local setup](#local-setup)
8. [Environment variables](#environment-variables)
9. [Firebase setup](#firebase-setup)
10. [Bachs payments](#bachs-payments)
11. [Running the app](#running-the-app)
12. [Deploying to Netlify](#deploying-to-netlify)
13. [Subdomains](#subdomains)
14. [Scripts](#scripts)
15. [Security notes](#security-notes)
16. [Roadmap](#roadmap)
17. [Troubleshooting](#troubleshooting)

---

## Product overview

| Role | What they get |
|------|----------------|
| **Vendor** | Signup, business onboarding, catalog (products + services), orders, storefront branding, analytics stub, notifications stub |
| **Customer** | Marketplace browse, branded store pages, cart checkout, Bachs hosted payment |
| **Platform (Kurospace)** | Single Bachs merchant for v1; multi-tenant data in Firestore |

**Target market:** Nigeria first (NGN pricing, Nigerian states/categories), then wider Africa.

---

## Tech stack

| Layer | Technology |
|--------|------------|
| App | [Next.js 16](https://nextjs.org/) (App Router) + TypeScript + Tailwind CSS 4 |
| Auth / DB | [Firebase](https://firebase.google.com/) Auth + Firestore (Spark-friendly) |
| Images | [Cloudinary](https://cloudinary.com) free tier (no Firebase Storage / Blaze) |
| Admin (server) | Firebase Admin SDK (webhooks, paid order updates) |
| Payments | [Bachs](https://bachs.io) — hosted checkout redirect, pure NGN amount |
| Serverless | Next.js Route Handlers + optional Netlify Functions |
| Hosting | [Netlify](https://www.netlify.com/) (`@netlify/plugin-nextjs`) |

> **Note on local speed:** On some Windows machines Next falls back to WASM SWC. Turbopack is the default (`npm run dev`); if first compiles are slow, use `npm run dev:webpack`. **Production on Netlify is a pre-built app** and does not behave like that.

---

## Features (MVP)

### Vendor SaaS

- Email/password signup & login (Firebase Auth)
- Business onboarding (name, category, city/state, unique store slug)
- Products & services CRUD with image upload (Cloudinary)
- Orders list + status updates
- Storefront branding: colours, fonts, theme, layout + live preview
- Publish / unpublish store
- Analytics & notifications UI (scaffolded)

### Marketplace & storefront

- Public marketplace of published vendors
- Path-based store: `/store/[slug]`
- Subdomain rewrite: `slug.yourdomain.com` → `/store/slug` (middleware)
- Cart + customer details → Bachs payment

### Payments (v1)

- **Merchant:** Kurospace platform account (not per-vendor Bachs yet)
- **Mode:** one-time product/service orders
- **UX:** hosted **redirect** (not popup) for reliability
- **Truth:** `collection.succeeded` webhook marks order `paid`

---

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Browser        │────▶│  Next.js (Netlify)│────▶│  Firebase       │
│  Vendor / Buyer │     │  App + API routes │     │  Auth + Firestore│
└─────────────────┘     └────────┬─────────┘     └─────────────────┘
                                 │
                    ┌────────────┼────────────┐
                    ▼                         ▼
             ┌─────────────┐          ┌──────────────┐
             │ Bachs API   │          │ Bachs webhook│
             │ checkout    │          │ → Admin SDK  │
             │ sessions    │          │ → mark paid  │
             └─────────────┘          └──────────────┘
```

**Checkout flow**

1. Customer places order → Firestore `orders` (`paymentStatus: pending`)
2. `POST /api/payments/create-checkout` → Bachs pure NGN session
3. Redirect to `checkout_url`
4. Success/cancel return URLs under `/store/[slug]/order/...`
5. Webhook `POST /api/payments/webhook` → order `paid` + vendor notification doc

---

## Project structure

```
kurospace/
├── src/
│   ├── app/
│   │   ├── (auth)/login|signup     # Auth pages
│   │   ├── api/payments/           # create-checkout, webhook
│   │   ├── dashboard/              # Vendor SaaS UI
│   │   ├── marketplace/            # Public discovery
│   │   ├── onboarding/             # First-time business setup
│   │   ├── store/[slug]/           # Public storefront + order result
│   │   ├── page.tsx                # Marketing home
│   │   └── providers.tsx           # Auth provider
│   ├── components/                 # UI, layout, catalog, storefront
│   ├── contexts/auth-context.tsx
│   ├── lib/
│   │   ├── bachs/                  # Client, config, webhook verify
│   │   └── firebase/               # Client + Admin + domain APIs
│   ├── middleware.ts               # Subdomain → /store/[slug]
│   └── types/                      # Shared domain types
├── netlify/
│   └── functions/                  # Optional (health, notify, webhook alias)
├── firestore.rules
├── firestore.indexes.json
├── storage.rules
├── netlify.toml
├── .env.example
└── README.md
```

---

## Prerequisites

- **Node.js 20 or 22 LTS** recommended (Node 24 can break native Next SWC on Windows)
- npm 10+
- A [Firebase](https://console.firebase.google.com/) project
- A [Bachs](https://app.bachs.io) account (sandbox key for testing)
- (Deploy) Netlify account + GitHub repo

---

## Local setup

### 1. Clone

```bash
git clone https://github.com/Azeru548/kurospace.git
cd kurospace
```

### 2. Install

```bash
npm install
```

### 3. Environment

```bash
copy .env.example .env.local
```

Fill values (see [Environment variables](#environment-variables)).  
**Never commit** `.env.local` or `*firebase-adminsdk*.json`.

### 4. Firebase Console

See [Firebase setup](#firebase-setup).

### 5. Run

```bash
npm run dev
```

Open the URL printed in the terminal (often `http://localhost:3000`).

---

## Environment variables

Copy from `.env.example`.

### Public (browser)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_ROOT_DOMAIN` | Root domain for subdomains (e.g. `kurospace.com`) |
| `NEXT_PUBLIC_APP_URL` | Canonical app URL (local: `http://localhost:3000`) |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase web API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | e.g. `project.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Storage bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Messaging sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Web app ID |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | Optional Analytics |

### Server only (never expose to client)

| Variable | Description |
|----------|-------------|
| `BACHS_API_KEY` | `sk_sandbox_...` or `sk_live_...` |
| `BACHS_WEBHOOK_SECRET` | Signing secret from Bachs webhook endpoint |
| `BACHS_API_BASE` | Optional; auto from key prefix |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | Local path to service account JSON |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Full JSON string (preferred on Netlify) |
| `FIREBASE_ADMIN_PROJECT_ID` / `CLIENT_EMAIL` / `PRIVATE_KEY` | Alternate Admin credentials |
| `EMAIL_*` | Reserved for custom email provider |

---

## Firebase setup

1. **Authentication** → Sign-in method → enable **Email/Password**
2. **Firestore** → Create database
3. **Rules** → publish `firestore.rules`  
   *(Images use Cloudinary — you do **not** need Firebase Storage / Blaze.)*
4. **Indexes** → import `firestore.indexes.json` or accept console prompts when queries fail
5. **Service account** → Project settings → Service accounts → Generate key  
   - Local: place JSON in project root, set `FIREBASE_SERVICE_ACCOUNT_PATH=./your-file.json`  
   - File is gitignored via `*firebase-adminsdk*.json`

Without published Firestore rules, signup will fail after Auth succeeds with a permission error.

---

## Images (Cloudinary)

Firebase Storage is **not** used (often blocked or requires paid Blaze). Uploads go to **Cloudinary** free tier.

1. Create a free account at [cloudinary.com](https://cloudinary.com)
2. Dashboard → copy **Cloud name**
3. **Settings → Upload → Add upload preset**
   - **Signing mode: Unsigned**
   - Optional folder: `kurospace`
4. Add to `.env.local` (and Netlify):

```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_unsigned_preset
```

5. Restart `npm run dev`

Product, service, and logo uploads store under  
`kurospace/vendors/{vendorId}/catalog|logo|...` and return a public `secure_url`.

## Bachs payments

### Model (v1)

- One platform merchant (Kurospace)
- One-time orders only
- Pure checkout: `pricing: { currency: "NGN", amount: "..." }` (no per-SKU Bachs products)
- Minimum **₦1,000** (Bachs NGN floor)
- Customer **email required** at checkout

### Endpoints

| Route | Purpose |
|-------|---------|
| `POST /api/payments/create-checkout` | Create session, return `checkoutUrl` |
| `POST /api/payments/webhook` | Verify signature, mark order paid |

### Webhook (production)

In Bachs Developer Portal:

- URL: `https://<your-domain>/api/payments/webhook`
- Events: `collection.succeeded`, `collection.failed`, `checkout.expired`
- Copy signing secret → `BACHS_WEBHOOK_SECRET`

Localhost can create checkouts; webhooks need a public URL (deploy or tunnel).

Docs: [docs.bachs.io](https://docs.bachs.io)

---

## Running the app

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server (Turbopack) |
| `npm run dev:webpack` | Dev server fallback (webpack) |
| `npm run build` | Production build |
| `npm run start` | Serve production build locally (closest to Netlify speed) |
| `npm run lint` | ESLint |

### Happy path (manual test)

1. Sign up → complete onboarding (business + slug)
2. Add products/services → publish store in Settings
3. Open `/store/your-slug` or Marketplace
4. Add to cart → Pay with Bachs (sandbox)
5. Confirm order appears in vendor dashboard

---

## Deploying to Netlify

1. Push this repo to GitHub (see below).
2. Netlify → **Add new site** → Import from Git.
3. Build settings (usually auto from `netlify.toml`):
   - **Build command:** `npm run build`
   - **Publish:** handled by `@netlify/plugin-nextjs`
4. **Site settings → Environment variables** — set all `NEXT_PUBLIC_*`, `BACHS_*`, and Firebase Admin (`FIREBASE_SERVICE_ACCOUNT_JSON` as one-line JSON is easiest on Netlify).
5. Set `NEXT_PUBLIC_APP_URL` to your production URL (success/cancel redirects).
6. Deploy. Register Bachs webhook against the production URL.

```toml
# netlify.toml (already in repo)
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

---

## Subdomains

Middleware rewrites `vendor.ROOT_DOMAIN` → `/store/vendor`.

| Environment | Example |
|-------------|---------|
| Local | `http://adanna.localhost:3000` (if supported) or use `/store/adanna` |
| Production | `https://adanna.kurospace.com` |

Requires DNS wildcard (`*.kurospace.com`) and Netlify domain config when you go live.

---

## Scripts

```json
{
  "dev": "next dev --turbopack",
  "build": "next build --turbopack",
  "start": "next start",
  "lint": "eslint"
}
```

`--turbopack` is the default for speed. If native SWC/Turbopack fails on a Windows setup, use the webpack fallbacks (`npm run dev:webpack` / `npm run build:webpack`); Netlify Linux builds use full native tooling.

---

## Security notes

- `.env*` and `*firebase-adminsdk*.json` are **gitignored**
- Firebase web API keys are public by design; protect data with **Auth + rules**
- Bachs secret keys and webhook secrets are **server-only**
- Webhook signatures: HMAC-SHA256 over `{timestamp}.{rawBody}` (`X-Bachs-*` headers)
- Rotate any secret that was ever pasted into chat or a public place

---

## Email (SendLib)

Provider docs: [Basic Send](https://sendlib.samueltuoyo.com/docs/send)

```http
POST https://sendlib.samueltuoyo.com/api/send
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
```

| Env | Purpose |
|-----|---------|
| `SENDLIB_API_KEY` | API key from SendLib |
| `SENDLIB_BASE_URL` | Default `https://sendlib.samueltuoyo.com` |
| `EMAIL_FROM` / `SENDLIB_FROM` | Optional connected Gmail to send from |
| `EMAIL_REPLY_TO` | Optional reply-to |

**Triggers**

1. Checkout started → email vendor + customer (payment pending)
2. Bachs payment succeeded → email vendor + customer (paid)

**Dev test:** `POST /api/email/test` with `{ "to": "you@example.com" }`

## Roadmap

- [x] Order / payment emails via SendLib
- [ ] Vendor payouts / multi-merchant Bachs
- [ ] Rich analytics charts
- [ ] In-app notifications realtime
- [ ] Custom domains per vendor
- [ ] SaaS subscription plans for vendors

---

## Troubleshooting

| Symptom | Likely fix |
|---------|------------|
| Signup shows only “Error” | Update to latest code (errors are mapped); enable Email/Password Auth |
| “Firestore blocked this write” | Publish `firestore.rules` |
| Dashboard Router setState warning | Fixed via redirects in `useEffect` only |
| Port 3000 in use | Use the port Next prints, or kill the other process |
| Slow local compile | Expected with WASM SWC; use `npm run build && npm run start` to preview prod speed |
| Bachs 503 / not configured | Set `BACHS_API_KEY` and restart |
| Webhook never marks paid | Public URL + `BACHS_WEBHOOK_SECRET` + Admin credentials |

---

## License

Private — Kurospace. All rights reserved unless otherwise stated by the owner.

---

## Credits

Built for African vendors. Payments via [Bachs](https://bachs.io). Hosting-ready for Netlify + Firebase.
