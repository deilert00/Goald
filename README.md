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

Copy `.env.example` to `.env` and fill in your Firebase project values:

```bash
cp .env.example .env
```

Then edit `.env` with values from the Firebase Console (Project Settings > General > SDK setup and configuration):

- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `EXPO_PUBLIC_FIREBASE_APP_ID`

Without valid values, the app will throw a startup error in normal mode. Use `EXPO_PUBLIC_E2E_MODE=true` to bypass Firebase for testing.

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
- starts Expo web in deterministic mode
- waits for server readiness
- runs deterministic Cucumber suite
- uploads `reports/` artifact

Note:
- `npm run test:e2e` needs a reachable `BASE_URL` app endpoint.
- CI workflow is now self-contained for deterministic E2E.

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
- `npm run test:e2e:ci`: Deterministic run with HTML + JSON report outputs
- `npm run test:unit`: Node test runner coverage for core financial utilities
- `npm run admin:support -- <status|reset|disable|enable> <email-or-uid>`: support operations via Firebase Admin SDK

## Environment Variables

- `EXPO_PUBLIC_E2E_MODE`
  - `true`: use deterministic in-memory auth/data for tests
  - unset/`false`: use real Firebase services
- `EXPO_PUBLIC_FIREBASE_*`
  - Firebase client configuration for normal mode
- `BASE_URL`
  - URL used by Playwright/Cucumber
  - default in world: `http://localhost:3000`
- `HEADLESS`
  - `false` to run Playwright with visible browser window
- `EXPO_PUBLIC_TELEMETRY_ENDPOINT`
  - optional endpoint URL for product telemetry events

## Security Rules

- Firestore security rules are defined in `firestore.rules`.
- Firebase config references rules in `firebase.json`.

## Admin Support

- Baseline support runbook and command usage:
  - `docs/ADMIN_SUPPORT_RUNBOOK.md`

## Troubleshooting

- `Executable doesn't exist` / Playwright browser missing:
  - run `npx playwright install chromium`

- Linux shared library errors (`libatk...`, etc):
  - run `npx playwright install --with-deps chromium`

- E2E fails to connect to app:
  - verify Expo web is running on `3000`
  - verify `BASE_URL` matches active server URL

- App shows auth/data errors in normal mode:
  - verify Firebase env vars are set (see `.env.example`)

- E2E needs stable data:
  - use `npm run web:e2e` and `npm run test:e2e:full`

### Windows: SSH Agent Access Denied

If you receive an **Access Denied** error when trying to set the `ssh-agent` service startup type
(e.g. `Set-Service -Name ssh-agent -StartupType Automatic`), follow these steps:

#### 1. Run PowerShell as Administrator

All `ssh-agent` service commands require an elevated shell.

1. Press **Win + S**, type `PowerShell`.
2. Right-click **Windows PowerShell** and choose **Run as administrator**.
3. Re-run your service command inside the elevated window:

```powershell
Set-Service -Name ssh-agent -StartupType Automatic
Start-Service ssh-agent
```

#### 2. Enable OpenSSH Client / Server optional features

The `ssh-agent` service is provided by the **OpenSSH Client** optional feature (and
**OpenSSH Server** if you also need `sshd`). If the feature is not installed, the service
does not exist and all commands fail with Access Denied or "service not found".

**GUI:** Settings → System → Optional features → Add a feature → search for **OpenSSH**.

**PowerShell (elevated):**

```powershell
# Install OpenSSH Client (required for ssh-agent + ssh)
Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0

# Install OpenSSH Server (optional — only needed if this machine accepts inbound SSH)
Add-WindowsCapability -Online -Name OpenSSH.Server~~~~0.0.1.0
```

After installation, start the agent from an elevated shell:

```powershell
Set-Service -Name ssh-agent -StartupType Automatic
Start-Service ssh-agent
ssh-add $HOME\.ssh\id_ed25519   # add your key
```

#### 3. Alternative: Git Credential Manager with HTTPS + PAT

If you cannot change Windows service settings (e.g. on a managed/corporate machine), you can
authenticate to GitHub over HTTPS using a **Personal Access Token (PAT)** stored by the
built-in **Git Credential Manager** — no SSH agent required.

1. [Create a PAT](https://github.com/settings/tokens) with the `repo` scope (or `read:packages`
   if you only need package access).
2. Change your remote URL to HTTPS:

```bash
git remote set-url origin https://github.com/<owner>/<repo>.git
```

3. On the next `git push` / `git pull`, Git will prompt for credentials.  Enter your GitHub
   **username** and the **PAT** as the password.  Git Credential Manager stores the token
   securely in the Windows Credential Store — you will not be prompted again.

#### 4. Start ssh-agent without changing the startup type

If you want a one-time session without permanently changing the service configuration:

```powershell
# Start for this session only (no startup-type change)
# Note: requires start/stop permission on the service for your user account
Start-Service ssh-agent

# Confirm it is running
Get-Service ssh-agent

# Add your key for this session
ssh-add $HOME\.ssh\id_ed25519
```

> **Note:** The service will stop when Windows reboots. Repeat `Start-Service ssh-agent` and
> `ssh-add` at the start of each session, or add them to your PowerShell profile
> (`$PROFILE`).

#### 5. Alternative SSH agent: Pageant (PuTTY)

[Pageant](https://www.chiark.greenend.org.uk/~sgtatham/putty/latest.html) is PuTTY's SSH
authentication agent and is a lightweight alternative to the Windows `ssh-agent` service.

1. Download **Pageant** from the PuTTY download page and launch it — it appears in the
   system tray.
2. Right-click the tray icon → **Add Key** → select your `.ppk` private key file.  
   (Use **PuTTYgen** to convert an OpenSSH key to `.ppk` format if needed.)
3. Tell Git to use Pageant by setting the `GIT_SSH` environment variable:

```powershell
# For the current session
$env:GIT_SSH = "C:\Program Files\PuTTY\plink.exe"

# To persist across sessions, add to your PowerShell profile ($PROFILE):
[System.Environment]::SetEnvironmentVariable("GIT_SSH", "C:\Program Files\PuTTY\plink.exe", "User")
```

4. On first connect, `plink` will ask you to trust the server's host key — type `y` to
   cache it, then subsequent `git` operations will authenticate via Pageant automatically.

## Notes For Contributors

- Keep selectors and user-facing labels stable for E2E reliability.
- Add new behavior specs under `features/` when adding user-visible flows.
- Prefer deterministic E2E mode for CI and reproducibility.

## Contributing with AI

This project uses GitHub Copilot with persistent context instructions to keep AI suggestions
consistent with the project's architecture and conventions.

The instructions file is located at [`.github/copilot-instructions.md`](.github/copilot-instructions.md).
Copilot reads this file automatically for every chat and inline completion session in VS Code.

Key guardrails enforced by the instructions:
- All Firestore access goes through `src/services/` — never directly from screens or components
- Every new service function must include an E2E mode branch using `isE2EMode`
- TypeScript `strict: true` — no `any` types or `@ts-ignore` without explanation
- Use `AppButton` for all action buttons; no new TouchableOpacity button patterns
- Write tests first (TDD) — unit tests for utils/services, BDD scenarios for user flows

**When to update `.github/copilot-instructions.md`:** treat it as living documentation.
Update it whenever a new architectural decision is made, a new pattern is adopted, or a new
guardrail is needed. This file is the contract between the team and Copilot.

## UX Standards

- Product UX requirements and test protocol:
  - `docs/UX_REQUIREMENTS_AND_TEST_PLAN.md`

## Product and DevOps Requirements

- Full product, platform, security, persistence, admin, and operations requirements:
  - `docs/PRODUCT_REQUIREMENTS_DEVOPS.md`