# Copilot Instructions for Goald

This file gives GitHub Copilot persistent context about the Goald codebase.
Read this before suggesting any code changes.

---

## What This App Does

Goald is a React Native / Expo savings-goal tracker. Users create financial goals,
record monthly deposits, and are motivated by animated progress visuals, streaks, and badges.
Backend: Firebase Auth (email/password) + Cloud Firestore.

---

## Tech Stack

- **Framework:** React Native via Expo (SDK 52), targeting web + iOS + Android
- **Language:** TypeScript with `strict: true` — never use `any` or `@ts-ignore` without a comment
- **Navigation:** React Navigation (native stack + bottom tabs)
- **Backend:** Firebase Auth + Firestore (via Firebase JS SDK v11)
- **Testing:** Jest (unit), Cucumber + Playwright (E2E BDD)
- **Linting:** ESLint with `@typescript-eslint`, `react-hooks`, `react-native` plugins
- **Formatting:** Prettier (singleQuote, semi, printWidth 100)

---

## Architecture Rules

### Services (`src/services/`)
- All Firestore reads and writes go through service files — NEVER call Firestore directly from a screen or component
- Services must have an E2E mode branch using `isE2EMode` from `src/config/runtime.ts`
- Write operations that touch multiple documents MUST use `runTransaction` or `writeBatch`
- Never expose raw Firestore errors to the UI — use `getErrorMessage()` from `src/utils/authErrors.ts`

### Hooks (`src/hooks/`)
- Hooks are the only place that subscribe to Firestore real-time listeners
- Hooks must clean up subscriptions in the `useEffect` return function
- Hooks return plain data + loading state — no business logic inside hooks

### Screens (`src/screens/`)
- Screens call hooks for data and services for writes — they do not call Firestore directly
- All async actions must set a `loading` state and disable interactive elements while loading
- Errors are shown via `Alert.alert(title, getErrorMessage(error))` OR inline field errors (preferred for form validation)
- No inline `StyleSheet` magic numbers — use tokens from `src/theme/tokens.ts`

### Components (`src/components/`)
- Components are presentational — no Firestore calls, no navigation logic
- Use `AppButton` for all primary/secondary action buttons — do not create new TouchableOpacity button patterns
- All interactive elements need an `accessibilityLabel` prop

### Utils (`src/utils/`)
- Utils are pure functions with no side effects
- Every utility function must have a corresponding test in `src/utils/__tests__/`
- Export named functions only — no default exports from utils

---

## E2E Test Mode

- `EXPO_PUBLIC_E2E_MODE=true` bypasses all Firebase calls with an in-memory store (`src/services/e2eStore.ts`)
- This mode is for CI and local UI development ONLY — it MUST NOT be active in production
- Every new service function needs an E2E branch that mirrors the real implementation using `e2eStore`
- E2E mode is detected via `isE2EMode` from `src/config/runtime.ts`

---

## Test-Driven Development Rules

When implementing any new feature or fixing a bug, follow this order:
1. **Write the test first** — unit test for utils/services, BDD scenario for user flows
2. **See the test fail** — confirm it fails for the right reason
3. **Write the minimum code to make it pass**
4. **Refactor** — clean up without breaking the test

For pure utility functions: always write a Jest test in `src/utils/__tests__/` before implementing.
For new BDD scenarios: add the Gherkin scenario to `features/` before writing step definitions.
For bug fixes: write a test that reproduces the bug first, then fix it.

---

## Security Rules (Non-Negotiable)

- Never hardcode Firebase credentials — use `EXPO_PUBLIC_FIREBASE_*` env vars
- Never commit `.env` files — `.env.example` documents all required variables
- Never use `catch (e: any)` — use `catch (error: unknown)` and `getErrorMessage(error)`
- Never call `updateGoalBalance` directly — use the transactional `addDepositAndUpdateBalance`
- Never set `EXPO_PUBLIC_E2E_MODE=true` in a production environment config
- Firestore security rules (`firestore.rules`) must be updated when new collections are added

---

## Naming Conventions

- Files: `camelCase.ts` for utils/services/hooks, `PascalCase.tsx` for components/screens
- Functions: `camelCase` — descriptive verbs (e.g. `calculateNewStreak`, not `streak`)
- Types/Interfaces: `PascalCase` (e.g. `Goal`, `Deposit`, `UserStats`)
- Test files: same name as the file under test with `.test.ts` suffix, in a `__tests__/` folder
- BDD feature files: `kebab-case.feature`, scenarios written in plain English from user perspective
- E2E accessibility labels: `kebab-case` matching the action (e.g. `dashboard-create-goal`)

---

## What NOT to Do

- ❌ Do not add new dependencies without checking if an existing utility already covers the need
- ❌ Do not use `console.log` — use `console.warn` or `console.error` sparingly, or remove before PR
- ❌ Do not put business logic in screens — extract to utils or services
- ❌ Do not skip writing tests — every exported function needs a test
- ❌ Do not write a catch block that silently swallows errors — always surface them via Sentry + user message
- ❌ Do not create a new button component — use `AppButton`
- ❌ Do not use `as any` or `as unknown as X` without a comment explaining why
- ❌ Do not write a Firestore write without checking if a transaction is needed

---

## PR Checklist (Copilot must satisfy all before considering work complete)

- [ ] TypeScript compiles with zero errors (`npm run typecheck`)
- [ ] ESLint passes with zero errors (`npm run lint`)
- [ ] All new utility functions have unit tests
- [ ] All new user flows have BDD scenarios
- [ ] E2E mode branch added to any new service function
- [ ] No hardcoded colours or spacing — tokens used
- [ ] `accessibilityLabel` added to any new interactive element
- [ ] Sentry `captureException` called in any new catch block
- [ ] Analytics event tracked for any new user-facing action
