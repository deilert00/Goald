# Product Requirements and DevOps Blueprint

## Role Perspective

This document defines production-grade requirements from Product, UX, Engineering, Security, and DevOps viewpoints for Goald across web, local, and mobile distribution.

## 1. Product Scope

## 1.1 Core User Outcomes

- User can create an account and log in.
- User can create and manage savings goals.
- User can track deposits and see growth projections.
- User can receive milestone motivation through visual progress and rewards.

## 1.2 Supported Surfaces

- Web (Expo web build)
- Mobile local/dev (Expo iOS/Android)
- Mobile production distribution (future: EAS build + app stores)

## 2. Functional Requirements

## 2.1 Account Lifecycle

- Registration with email/password.
- Login with email/password.
- Logout.
- Password reset (self-service via email link).
- Session persistence across app restarts.

Current status:
- Register/login/logout: implemented.
- Password reset: implemented from login screen.
- Session persistence: handled by Firebase Auth (when configured).

## 2.2 User Persistence and Data Model

Source of truth in normal mode:
- Firebase Authentication: stores user identities.
- Cloud Firestore: stores goals, deposits, user stats, notification history.

Collections (current model):
- `goals`
- `deposits`
- `userStats`
- `notifications`

Persistence requirement:
- All user writes must be durable in Firestore in normal mode.
- E2E mode is non-durable by design and must be clearly documented as test-only.

## 2.3 Navigation and Flow Requirements

- Landing page must communicate value and provide clear auth actions.
- Goal creation success must route user directly to created goal detail.
- Users must always have a direct route back to Dashboard from workflow screens.

Current status:
- Landing page: implemented.
- Create goal -> detail: implemented.
- Sidebar quick navigation: implemented on key goal workflow screens.

## 2.4 Goal Management

- Create goal with target, contribution, rate, optional timeline, and visual theme.
- Edit goal with validation.
- Delete goal with confirmation and cascade cleanup.
- Deposit creation with optional note.

## 2.5 Notifications

- Monthly reminder support.
- Milestone notifications (25/50/75%).
- Completion notification.
- Deduplicate notifications by user/goal/milestone.

## 2.6 Accessibility and UX

- Interactive controls must expose accessibility labels.
- Async actions must show loading and disabled states.
- Pressed-state feedback required for all critical actions.

## 3. Security and Compliance Requirements

## 3.1 Authentication Security

- Password policy: minimum 8 recommended (currently 6, must be raised for production).
- Brute-force mitigation via Firebase/Auth provider controls.
- MFA: Phase 2 requirement for production readiness.

## 3.2 Authorization

- Firestore security rules must enforce per-user data isolation by `userId`.
- No client path should be able to read/write another user's data.

## 3.3 Data Protection

- Encrypt in transit via HTTPS/TLS.
- Rely on Firebase encrypted-at-rest storage.
- PII minimization: store only required account data.

## 3.4 Operational Controls

- Secrets must not be hardcoded.
- Firebase config must come from environment-based config strategy for prod.
- Audit logging for admin actions (future requirement).

## 4. Admin and Support Requirements

## 4.1 User Administration

Minimum admin capabilities required before production launch:
- Search user by email/uid.
- Trigger password reset email.
- Temporarily disable account.
- Inspect account-level operational health (last login, status).

Current status:
- No admin panel yet.
- Self-service password reset exists.

Recommendation:
- Implement support/admin service via Firebase Admin SDK + protected web console.

## 4.2 Support Workflows

- Incident response playbook for login failures.
- Standard support macros for reset-password and account lockout.
- SLA target for P1 auth issue acknowledgement: <= 15 minutes.

## 5. Environment Requirements

## 5.1 Local Development

- `npm ci`
- `npm run web` or mobile scripts.
- Real auth requires valid Firebase credentials.

## 5.2 Deterministic Test Mode

- `EXPO_PUBLIC_E2E_MODE=true` routes auth/data to in-memory store.
- Use for repeatable CI/UI tests only.
- Must not be enabled in production builds.

## 5.3 Cloud CI/CD

Pipeline minimum:
- Install dependencies.
- Build/lint/typecheck.
- Deterministic E2E run.
- Artifact reports.

Promotion path:
- `dev` -> `staging` -> `prod`
- Required checks before merge to main.

## 6. Observability Requirements

- Frontend error tracking (Sentry/Datadog RUM) required for production.
- Auth funnel metrics:
  - register_attempt/success/fail
  - login_attempt/success/fail
  - reset_password_requested
- Goal funnel metrics:
  - goal_created
  - deposit_added
  - goal_completed

## 7. Reliability and Performance Requirements

- App startup (web) target: <= 3s on broadband.
- P95 auth action latency target: <= 1.5s (excluding network extremes).
- Recoverability: graceful error messaging on backend/network failures.

## 8. Testing Requirements

## 8.1 Automated

- E2E must include:
  - landing page
  - registration
  - login
  - create goal
  - edit goal
  - deposit + note
  - navigation return to dashboard
- Unit tests required for core financial calculation utilities.

## 8.2 Manual QA

- Cross-platform smoke test: web, Android, iOS.
- Auth edge cases: wrong password, unknown user, reset path.
- Network loss simulation and recovery behavior.

## 9. Current Gap Assessment

Gaps to close before production:
- Firebase config still uses placeholder constants in source.
- No dedicated admin console.
- Password policy should be hardened.
- Firestore security rule verification not yet documented in repo.
- CI should be fully self-contained for deterministic E2E startup.

## 10. Delivery Roadmap (Suggested)

## Phase A: Auth Hardening (1-2 sprints)

- Environment-based Firebase configuration.
- Harden password policy and auth error copy.
- Admin reset/disable backend endpoint and support UI.

## Phase B: Release Readiness (1 sprint)

- Firestore rule audit + tests.
- Observability instrumentation.
- CI staging/prod gating.

## Phase C: Scale and Compliance (ongoing)

- MFA support.
- Data retention policies.
- Structured audit trail for support/admin operations.

## 11. Definition of Done (Production Candidate)

A release candidate is acceptable only when:
- Auth flows pass in real Firebase environment.
- E2E deterministic suite is green.
- Security rules validated.
- Incident playbook and support paths documented.
- Monitoring and alerting configured for auth and core goal flows.
