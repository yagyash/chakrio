# Chakrio — website and owner dashboard

The chakrio.com marketing site, guest booking pages (`/book/:slug`) and the owner/admin dashboard for Chakrio, the WhatsApp-native booking and accounts system for dharmshalas, hotels and villas.

React 19 + Vite + Tailwind on Vercel. Data lives in Supabase and is written by the backend, [`chakrio-agent`](https://github.com/yagyash/chakrio-agent). Firebase handles login.

```bash
npm install
cp .env.example .env.local   # fill in values
npm run dev                  # http://localhost:5173
```

Public pages are prerendered from committed snapshots in `prerender-cache/`. After changing a public page, run `npm run prerender:capture` and commit the updated snapshot, or Google keeps seeing the old page.
