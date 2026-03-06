# Goald

Visual Compounding app built with React Native (Expo) + Firebase.

The app helps users save toward goals by combining:
- goal tracking
- compound growth projections
- milestone visuals and badges
- deterministic E2E test mode for reliable browser automation

## Stack

- Mobile/Web app: Expo + React Native + TypeScript
- Auth/DB: Firebase Authentication + Firestore
- Navigation: React Navigation
- E2E: Cucumber + Playwright
- CI: GitHub Actions (`.github/workflows/e2e-bdd.yml`)

## Repository Layout

- `App.tsx`: app entry
- `src/navigation/`: stack/tab navigation
- `src/screens/`: screens (auth, dashboard, goal detail, deposit, edit)
- `src/services/`: Firebase services + E2E in-memory store
- `src/hooks/`: app data hooks
- `features/`: Cucumber features and step definitions

## Run Modes

There are two main runtime modes:

1. `Normal mode` (default)
- Uses real Firebase auth and Firestore.
- Requires valid Firebase config in `src/services/firebase.ts`.

2. `E2E mode`
- Enabled with `EXPO_PUBLIC_E2E_MODE=true`.
- Uses in-memory seeded auth/goals/deposits/stats (`src/services/e2eStore.ts`).
- Designed for deterministic browser tests without external backend setup.

## Prerequisites

- Node.js 20+ recommended
- npm
- For web E2E on Linux: Playwright browser dependencies

Optional per platform:
- Android Studio (Android emulator)
- Xcode (iOS simulator on macOS)

## Local Setup

1. Install dependencies:

```bash
npm ci
```

2. Install Playwright browser binaries:

```bash
npx playwright install chromium
```

3. If Linux and browser launch fails, install system deps:

```bash
npx playwright install --with-deps chromium
```

## Firebase Configuration (Normal Mode)

Set real Firebase values in `src/services/firebase.ts`:

- `apiKey`
- `authDomain`
- `projectId`
- `storageBucket`
- `messagingSenderId`
- `appId`

Without valid values, normal login/register and Firestore-backed flows will not work.

## Run Application Locally

### Start Expo dev server

```bash
npm run start
```

### Run on web

```bash
npm run web
```

### Run on Android emulator/device

```bash
npm run android
```

### Run on iOS simulator (macOS)

```bash
npm run ios
```

## Run E2E Tests Locally

### Fast deterministic run (recommended)

Terminal 1:

```bash
npm run web:e2e
```

Terminal 2:

```bash
npm run test:e2e:full
```

Expected result: seeded scenarios should pass consistently.

### Generic Cucumber run against custom URL

```bash
BASE_URL=http://localhost:3000 npm run test:e2e
```

Headed mode:

```bash
HEADLESS=false BASE_URL=http://localhost:3000 npm run test:e2e:headed
```

Generate report:

```bash
npm run test:e2e:report
```

Reports are written to `reports/`.

## Cloud Usage

### 1. GitHub Codespaces (run app in cloud dev env)

Inside Codespaces terminal:

```bash
npm ci
npm run web
```

Then open forwarded port `3000` in browser preview.

For deterministic E2E in Codespaces:

```bash
npm run web:e2e
```

and in a second terminal:

```bash
npm run test:e2e:full
```

### 2. GitHub Actions (CI)

Workflow: `.github/workflows/e2e-bdd.yml`

Current behavior:
- installs dependencies
- installs Playwright Chromium (with deps)
- runs Cucumber suite
- uploads `reports/` artifact

Note:
- `npm run test:e2e` needs a reachable `BASE_URL` app endpoint.
- If you want fully self-contained CI, run Expo web server in background and use deterministic E2E mode before running tests.

## Available npm Scripts

- `npm run start`: Expo dev server
- `npm run web`: Expo web
- `npm run android`: Expo Android
- `npm run ios`: Expo iOS
- `npm run web:e2e`: Expo web with `EXPO_PUBLIC_E2E_MODE=true` on port `3000`
- `npm run test:e2e`: Cucumber suite
- `npm run test:e2e:headed`: Cucumber with headed browser
- `npm run test:e2e:report`: Cucumber with HTML report
- `npm run test:e2e:full`: Deterministic run (`EXPO_PUBLIC_E2E_MODE=true` + `BASE_URL=http://localhost:3000`)

## Environment Variables

- `EXPO_PUBLIC_E2E_MODE`
  - `true`: use deterministic in-memory auth/data for tests
  - unset/`false`: use real Firebase services
- `BASE_URL`
  - URL used by Playwright/Cucumber
  - default in world: `http://localhost:3000`
- `HEADLESS`
  - `false` to run Playwright with visible browser window

## Troubleshooting

- `Executable doesn't exist` / Playwright browser missing:
  - run `npx playwright install chromium`

- Linux shared library errors (`libatk...`, etc):
  - run `npx playwright install --with-deps chromium`

- E2E fails to connect to app:
  - verify Expo web is running on `3000`
  - verify `BASE_URL` matches active server URL

- App shows auth/data errors in normal mode:
  - verify Firebase config in `src/services/firebase.ts`

- E2E needs stable data:
  - use `npm run web:e2e` and `npm run test:e2e:full`

## Notes For Contributors

- Keep selectors and user-facing labels stable for E2E reliability.
- Add new behavior specs under `features/` when adding user-visible flows.
- Prefer deterministic E2E mode for CI and reproducibility.