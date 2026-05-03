# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Repo layout

This repo contains **two separate apps** that share a domain (B2B pharma) but currently do not share code or types:

- **Root (`/`, `src/`)** — Next.js 16 admin dashboard (web). React 19, Tailwind v4, shadcn/ui (`base-nova` style, neutral base color, lucide icons). Path alias `@/*` → `src/*`. Components live under `src/components/ui/`; helpers under `src/lib/`.
- **`mobile/`** — Expo SDK 54 React Native app (Expo managed, RN 0.81, React 19). Navigation via `@react-navigation/native-stack` + `bottom-tabs` v7. State via `zustand`. Single-file UI in `mobile/App.tsx`.

Both apps currently read from a **duplicated `data.json`** at the root and `mobile/data.json` (users + products). There is no backend yet — auth is a phone-number lookup against `data.json`. Any change to the data shape must be made in **both** copies.

## Common commands

Web (run from repo root):
- `npm run dev` — start Next dev server on :3000
- `npm run build` — production build
- `npm run lint` — ESLint via flat config (`eslint.config.mjs`, extends `next/core-web-vitals` + `next/typescript`)

Mobile (run from `mobile/`):
- `npm start` — Expo dev server
- `npm run android` / `npm run ios` / `npm run web` — start with platform target

Tests: none configured. Don't fabricate a test command — verify changes by running the app.

## Domain rules (from `clients_requirements.md`)

These are business invariants — do not weaken them without checking with the user:

- **Private B2B app**: signup requires admin approval before catalog/cart access. The mobile app routes unapproved users to `PendingApproval` and blocks back navigation.
- **Minimum order value: ₹2000** — hardcoded in `mobile/App.tsx` `CartScreen`. Place-order button disables below this.
- **Catalog target: 3000–4000 SKUs**, scaling to ~1000 users — design lists/search with virtualization in mind.
- **Credit-based payments**, no online payment initially. 60-day credit deadline, reminder at day 55.
- **Order lifecycle**: Placed → Accepted → Processing/Shipment → Completed.
- **Product fields** are minimal today (`name`, `company`, `category`, `price`, `stock`); requirements call for richer fields (image, description, composition, manufacturer) — when adding them, update both `data.json` files and both apps.

## Working in this codebase

- The Next.js install is **v16.2.3**, which is newer than most training data. Per `AGENTS.md`, before changing routing, server components, caching, or config, **read the relevant guide in `node_modules/next/dist/docs/`** rather than relying on memory.
- The web app uses **Tailwind v4** (not v3) — config is CSS-first via `@theme` in `src/app/globals.css`; there is intentionally no `tailwind.config.*`. Don't create one.
- shadcn/ui components are installed locally under `src/components/ui/` (button, card, badge, table, tabs). Add new ones via the shadcn CLI rather than hand-rolling, to keep the registry style (`base-nova`) consistent.
- Mobile state is centralized in a single `useStore` zustand hook at the top of `App.tsx` (user, cart). Cart is a `{ [productId]: quantity }` map — preserve this shape unless refactoring all consumers.
- `data.json` is the de facto schema. When the backend lands, it will replace this — keep field names stable so the future API contract matches.
