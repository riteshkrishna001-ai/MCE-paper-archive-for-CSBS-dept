# MCE CSBS Paper Vault

Community-driven question paper archive for the Department of Computer
Science and Business Systems (CSBS), Malnad College of Engineering (MCE),
Hassan.

> "One Place for Every CSBS Question Paper."

## Status

| Phase | Scope | Status |
|---|---|---|
| 1. Scaffolding | Vite + React + TS + Tailwind setup, domain types, Firebase config | ✅ Done |
| 2. Authentication | Google sign-in, Firestore user profiles, role-based route guards | ✅ Done |
| 3. Data services | Papers/Subjects/Years CRUD, search, duplicate detection | ⏳ Next |
| 4. Pages & UI | Homepage, Browse, Upload flow, Admin dashboard (real UI) | ⏳ Pending |
| 5. Security | Full Firestore + Storage rules for papers/subjects/years | ⏳ Pending |
| 6. Polish | Loading states, empty states, 404/error pages, accessibility pass | ⏳ Pending |
| 7. Deployment | Firebase Hosting, indexes, production checklist | ⏳ Pending |

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in your Firebase project config
npm run dev
```

### Firebase project setup

1. Create a Firebase project (console.firebase.google.com).
2. Enable **Authentication → Sign-in method → Google**.
3. Create a **Firestore** database (production mode).
4. Create a **Storage** bucket.
5. Register a Web App in Project Settings and copy the config values into
   `.env.local` (see `.env.example` for the exact keys).

### Becoming an admin (manual, by design)

There is no in-app way to become an admin — this is intentional, so
privilege escalation can never happen from client code. To promote a
student to admin:

1. Sign in once with the account you want to promote (this creates their
   `users/{uid}` document with `role: "student"`).
2. In the Firebase Console → Firestore → `users/{uid}`, change `role` to
   `"admin"`.
3. The change takes effect immediately for that user (no re-login
   needed) — the app subscribes to the profile document in real time.

### Deploying security rules (this phase's scope)

```bash
firebase deploy --only firestore:rules
```

`firestore.rules` in this phase covers only the `users` collection.
Rules for `papers`, `subjects`, and `academicYears` are added in the
dedicated Security phase — until then, those collections are
default-denied (`allow read, write: if false`), so nothing is
accidentally left open.

## Tech stack

React 18 · Vite · TypeScript · Tailwind CSS · React Router · Firebase
(Auth, Firestore, Storage, Hosting) · Lucide React icons

## Folder structure

```
src/
  components/
    auth/        Route guards (ProtectedRoute, AdminRoute)
    layout/       Navbar, spinners, shared shells
  config/         Firebase init, app-wide constants
  contexts/       AuthContext (global auth state)
  hooks/          useAuth and future custom hooks
  pages/          One file per route
  router/         Centralized route definitions
  services/       Firebase-talking logic (authService, and more to come)
  types/          Domain types shared across the app
```

## Running checks

```bash
npm run lint      # ESLint
npm run format    # Prettier
npm run build      # Type-check + production build
```
