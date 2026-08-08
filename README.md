# TravelPal

Plan a trip, let receipts and photos fill it in, and share a beautiful one-page
recap. TravelPal organizes a trip around **days** — each day owns its meals,
places, photos and expenses — and rolls every receipt up into a real "what did
this trip actually cost" number.

Built with **Expo (React Native) + TypeScript** and **Expo Router**.

## What's here

This is the first working slice. It opens on a seeded sample trip (Lahore,
Pakistan) so every screen shows real content:

- **Trips** (`app/index.tsx`) — your trips, each with cover, dates and total spend.
- **Trip recap** (`app/trip/[id]/index.tsx`) — the shareable digest: cover, stats,
  a day-by-day card list, and the **Trip Wallet** (live category + per-day spend).
- **Day page** (`app/trip/[id]/day/[day].tsx`) — the drill-down: the day's spend
  with per-expense source (`scan` / `email` / `card`), meals with itemized
  receipts, places, and the photo roll.
- **Receipt capture** (`app/trip/[id]/receipt.tsx`) — snap or upload a receipt;
  the fields (merchant, amount, converted USD, category, day) are prefilled and
  editable; saving adds a live expense that moves the wallet total.

The wallet is computed live from the expense list, so a scanned receipt updates
the totals immediately.

**Share as PDF** — the recap screen's share button renders the trip to a
one-page PDF (`src/recapHtml.ts` → `expo-print`) and opens the native share
sheet (`expo-sharing`), so you can text, email or save it.

## Design system

`src/theme.ts` holds the palette (saffron + peacock teal on warm paper), light
and dark, plus fonts, spacing and radii. Placeholder "photos" are colour
gradients (`src/gradients.ts`, `src/components/PhotoTile.tsx`) — swap these for
real `<Image>` sources as photo storage lands.

## Data model

`src/types.ts` — `Trip → Day → { meals, places, photos, expenses }`.
`src/data.ts` — the seeded sample trip and its expenses.
`src/store.tsx` — the store (`useStore`) with `addExpense`. Seed data stays
code-defined; user-added expenses persist to AsyncStorage (`src/storage.ts`)
and are merged back over the seeds on launch, so they survive app restarts.
Real ingestion (email, camera roll) slots in behind this same interface.

## Run it

```bash
npm install
npx expo start
```

Then press `i` (iOS simulator), `a` (Android emulator), or scan the QR with the
**Expo Go** app on your phone. If your local Expo/RN versions differ, run
`npx expo install --fix` once to align native dependency versions.

## Not built yet (next up)

- New-trip creation and trip editing
- Real photo import + tagging photos to meals/places
- Email receipt ingestion and OCR on scanned receipts
- Cloud sync (local persistence is in place)
