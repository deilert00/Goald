# Agent Instructions — Goald

> Universal agent instructions. Read by GitHub Copilot, VS Code agent mode, Claude, and all other agents.
> For DORA research basis see TEMPLATE-DESIGN.md.
> **Do not modify this file without PM approval.**

---

## 1. AI Policy

**Stance:** AI agents implement. Humans decide. No AI-generated code merges without human review.

AI is used for: code generation, test writing, documentation, code review assistance.
AI is NOT used for: architectural decisions, Firebase security rules without review, dependency additions without PM sign-off.

**Data policy:** No user PII is pasted into AI prompts. Source code and internal docs are acceptable context.

---

## 2. Project Identity

**Product:** Goald — a React Native savings-goal tracker for iOS and Android
**Stack:** TypeScript · React Native · Expo ~52 · Firebase Auth · Firestore · React Navigation
**Tests:** Jest · Cucumber + Playwright BDD E2E
**Repository:** github.com/deilert00/Goald

---

## 3. Context Files — Read Before Generating Any Code

| Priority | File | What You Learn |
|---|---|---|
| 1 | `src/types/index.ts` | All data shapes, field constraints, valid ranges, error types |
| 2 | `docs/ARCHITECTURE.md` | Layer boundaries — what can import from what (ESLint-enforced) |
| 3 | `docs/API_SURFACE.md` | Every public service and utility function |
| 4 | `docs/KNOWN_LIMITATIONS.md` | Known issues — do not make these worse |
| 5 | `docs/DATA_MODEL.md` | Firestore collection structure and paths |
| 6 | `docs/CHANGE_IMPACT_MAP.md` | Which files change when core types change |

---

## 4. Architecture Rules — Never Violate These

```
screens/     → UI composition only. No Firebase calls. No business logic.
components/  → Reusable UI primitives. No navigation. No services.
hooks/       → React state. Calls services. Never calls Firebase directly.
services/    → All Firestore reads/writes. All Firebase Auth calls.
utils/       → Pure functions. Stateless. No imports from any other layer.
types/       → Shared TypeScript types only. No imports. (src/types/index.ts)
config/      → Environment vars, feature flags. No business logic.
navigation/  → Stack definitions only. No data calls.
```

**Dependency direction:** `screens → hooks → services → (Firebase SDK)`

**NEVER:**
1. Call Firebase SDK in `screens/` or `components/`
2. Put business logic in screens — it belongs in `utils/`
3. Define types inline — all types go in `src/types/index.ts`
4. Use `any` in catch blocks — use `unknown` and the typed pattern in `src/utils/errors.ts`
5. Import from `screens/` or `components/` in `services/` or `utils/`

ESLint enforces these. CI fails on violations.

---

## 5. The PM–Agent Contract

**Workflow:** PM writes issue → assigned to Copilot → agent implements + tests → draft PR → human reviews → human merges

### Agents MAY Do Without Asking
- Read any file, write to `src/`, `tests/`, `docs/`
- Run: `npm test`, `npm run lint`, `npm run typecheck`, `npm run preflight`
- Open draft PRs, add JSDoc

### Agents MUST Ask Before
- Adding any `package.json` dependency
- Changing Firestore collection structure
- Modifying `.github/workflows/`
- Changing Firebase Auth flows
- Touching more than 5 files in one task

### Agents Must NEVER
- Commit secrets, API keys, Firebase service account credentials
- Modify `AGENTS.md` or `.github/copilot-instructions.md`
- Delete tests (even failing ones) without explicit PM instruction
- Push to `main` or `develop` directly
- Merge their own PRs
- Apply the `large-pr-approved` label (humans only)

---

## 6. Coding Standards

- TypeScript strict mode. Explicit return types on all exported functions.
- Naming: PascalCase components, camelCase functions/variables, UPPER_SNAKE_CASE constants
- Commits: `feat:`, `fix:`, `test:`, `docs:`, `chore:`, `refactor:`
- Write failing test first. Commit it. Then implement.
- Coverage target: 80% on `src/utils/` and `src/services/`
- Currency: never do floating-point arithmetic on amounts — use integer pence/cents where possible

---

## 7. PR Requirements

Every PR must include the AI-Assisted Review Block:
- What this PR does (one sentence)
- Top 2–3 failure modes
- Tests covering this change
- Architecture check (no layer violations)
- Any judgment calls flagged for human review

---

## 8. Instability Safeguards

- PR size limit: 400 lines → CI blocks. Override requires `large-pr-approved` label from a human.
- New user-facing features go behind a feature flag in `src/config/featureFlags.ts`
- Rollback: see `docs/RUNBOOKS.md` → Emergency OTA Rollback
- Rework rate > 10%: stop adding features, fix instructions first

---

## 9. Key Metrics Targets

- Rework rate: < 10%
- Change failure rate: < 5%
- CI cycle time: < 4 min
- PR review turnaround: < 24h

Run `npm run metrics` for current state.

---

## 10. See Also

- `.github/copilot-instructions.md` — Copilot-specific subset of these rules
- `.github/agents/` — `@docs-agent`, `@test-agent`, `@review-agent`, `@security-agent`
- `docs/GOLDEN_PATH.md` — 10-step idea→deploy workflow
- `docs/PROMPT_LIBRARY.md` — tested prompt templates for every repeating task
- `docs/AI_POLICY.md` — full AI policy and psychological safety norms
