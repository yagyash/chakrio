# PropertySync

A multi-tenant SaaS property management dashboard built with React + Vite + Firebase + Google Sheets API.

---

## Tech Stack

- **React 18** + **Vite**
- **Tailwind CSS v3**
- **Firebase Auth** (Email/Password + Google OAuth)
- **Firebase Firestore** (user profiles)
- **Google Sheets API v4** (live data per user)
- **Recharts** for charts
- **React Router v6**

---

## Setup

### 1. Clone & Install

```bash
cd propertysync
npm install
```

### 2. Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com/) and create a project
2. Enable **Authentication** → Sign-in methods → Email/Password + Google
3. Enable **Firestore Database** → Start in production mode
4. Go to Project Settings → Your apps → Add web app → Copy config values

### 3. Google Sheets API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create/select a project → Enable **Google Sheets API**
3. Credentials → Create credentials → API Key

### 4. Environment Variables

Copy `.env.example` to `.env.local` and fill in values:

```bash
cp .env.example .env.local
```

```
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_GOOGLE_SHEETS_API_KEY=your_sheets_api_key
```

> If `VITE_GOOGLE_SHEETS_API_KEY` is not set, the app runs in **Demo Mode** with built-in sample data.

### 5. Firestore Security Rules

In Firebase Console → Firestore → Rules, paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth.uid == userId;
      allow write: if false;
    }
  }
}
```

### 6. Adding a Client User (Admin Only)

In Firebase Console → Firestore → Create document at `/users/{uid}`:

```json
{
  "email": "client@gmail.com",
  "business_type": "homestay",
  "sheet_id": "GOOGLE_SHEET_ID_HERE",
  "property_name": "Sunset Villa Goa",
  "owner_name": "Rahul Sharma",
  "created_at": "2025-01-01T00:00:00Z"
}
```

- `{uid}` — Firebase Auth UID (find in Auth → Users tab)
- `sheet_id` — from the Google Sheet URL: `.../spreadsheets/d/SHEET_ID/edit`
- `business_type` — `homestay` or `bakery`

---

## Google Sheet Structure

### Tab: `Bookings`
```
Booking ID | Guest Name | Phone | Check-in Date | Check-out Date | Nights |
Room Type | Total Amount | Advance Paid | Balance Due | Payment Status |
Booking Status | Notes
```

### Tab: `Expenses`
```
Date | Category | Description | Amount | Paid By | Notes
```

### Tab: `Summary`
```
Month | Total Revenue | Total Expenses | Net Profit | Total Bookings | Cancellations
```

---

## Running Locally

```bash
npm run dev
```

---

## Deploy to Vercel

1. Push to GitHub
2. Import repo in [Vercel](https://vercel.com)
3. Add all environment variables in Vercel project settings
4. Deploy — `vercel.json` handles SPA routing automatically

---

## Adding New Business Types (Phase 2)

1. Add the type to `src/config/businessTemplates.js`
2. Create `src/templates/your_type/` with page components
3. Add routes in `src/AppShell.jsx`
4. Set `business_type` in Firestore for the client — done
