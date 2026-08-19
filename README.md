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
  (tap a receipt thumbnail to view it full-screen), meals with itemized receipts,
  places, and the photo roll. **Add photos** imports from the camera roll; tap a
  photo to open the editor (`app/trip/[id]/photo/[photoId].tsx`) to caption it,
  mark it a favorite, tag it to a meal or place, or add freeform **tags** like
  "Outfit" — tagged photos appear under that meal/place, and a favorite (or your
  latest) photo becomes the trip's cover and the day-card heroes.
- **Browse by tag** (`app/collections.tsx`) — pick a tag or Favorites and see
  matching photos pulled from every trip.
- **Receipt capture** (`app/trip/[id]/receipt.tsx`) — snap or upload a receipt;
  the fields (merchant, amount, converted USD, category, day) are prefilled and
  editable; saving adds a live expense that moves the wallet total.

The wallet is computed live from the expense list, so a scanned receipt updates
the totals immediately.

**Share as PDF** — the recap screen's share button renders the trip to a
one-page PDF (`src/recapHtml.ts` → `expo-print`) and opens the native share
sheet (`expo-sharing`), so you can text, email or save it. Your real photos are
embedded (cover + day heroes): `src/exportRecap.ts` converts them to resized
JPEG base64 with `expo-image-manipulator` (so iOS HEIC renders too); days
without user photos fall back to gradient placeholders.

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
- Email receipt ingestion, and OCR / vision to auto-read a receipt's merchant,
  line items and category (needs a dev build or a cloud vision call — not
  possible inside Expo Go)
- Cloud sync (local persistence is in place)
