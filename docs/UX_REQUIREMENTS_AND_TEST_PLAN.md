# UX Requirements and Test Plan

## Objective

Deliver a professional, confidence-building user experience where every interaction gives visible feedback, user flow is never ambiguous, and navigation between key product areas is obvious.

## UX Principles

- Visibility of system status: every major action provides immediate visual response.
- Progressive disclosure: advanced details appear only when needed.
- User control and freedom: users can always return to Dashboard.
- Error prevention first, then error messaging.
- Consistency in controls, language, and visual hierarchy.

## Interaction Requirements

## 1. Button Feedback

- All primary actions must show one of:
  - pressed-state feedback
  - loading indicator and disabled state during async operations
  - success/failure confirmation
- Do not allow duplicate submissions while request is in-flight.

Implementation status:
- `AppButton` component enforces pressed and loading states.
- Applied to high-impact flows (create goal, save goal, delete goal, add deposit entry points).

## 2. Goal Creation Flow

Requirements:
- User must not be left on form after successful creation.
- On success, user is routed directly to the newly created goal detail.
- Success confirmation is shown.

Implementation status:
- Create flow now: `CreateGoal` -> success alert -> `GoalDetail(newGoalId)`.

## 3. Navigation Resilience

Requirements:
- From any goal workflow screen, user can navigate to Dashboard and Badges without relying on back-stack assumptions.
- Navigation path must be visible and persistent.

Implementation status:
- Added `SidebarNav` quick navigation panel to goal creation/edit/detail screens.
- Includes Dashboard, Badges, and Create Goal shortcuts.

## 4. Information Architecture

- Landing communicates product value before auth.
- Dashboard is the command center.
- Goal Detail is the operational workspace for contributions and edits.

## 5. Form UX

- Required fields clearly marked.
- Numeric fields use numeric keyboard.
- Validation message should be specific and recoverable.

## 6. Progressive Goal Visual Build

- Goal visual must always show the full final image in a low-opacity state.
- Every contribution must incrementally increase visible, full-opacity area for that same image.
- Visual reveal must be continuous with progress (not only milestone jumps).
- House goals must follow stage narrative: land -> foundation -> walls -> roof -> landscaping.
- Progress label should indicate current build stage and visible percentage.

## Accessibility Requirements

- Interactive controls must expose accessibility labels.
- Tap targets should be at least 44x44 logical points where practical.
- Important actions must remain usable in keyboard/web contexts.

Current labels added for testing and accessibility:
- `landing-register-btn`, `landing-login-btn`
- `register-submit`, `login-submit`
- `dashboard-create-goal`
- `create-goal-submit`
- `sidebar-dashboard`, `sidebar-badges`, `sidebar-create-goal`

## Test Strategy

## A. E2E Smoke (Cucumber + Playwright)

Must-pass scenarios:
- Landing renders value proposition and auth CTAs.
- Account creation leads to Dashboard.
- Register flow shows password policy guidance for short passwords.
- Login leads to Dashboard.
- Dashboard control set renders after auth.
- Goal detail opens and deposit search appears.
- Goal edit persists.
- Deposit note persists.
- Goal creation routes to new detail screen.
- Goal creation shows inline required-field errors on empty submit.
- Sidebar navigation returns user to Dashboard.

## B. UX Regression Checklist (Manual)

Run before release:

1. Interaction feedback
- Every major button has visible press state.
- Loading state appears for async save/create/delete actions.

2. Flow continuity
- Create goal transitions to detail.
- Edit/Delete actions resolve to expected destination.

3. Navigation safety
- Sidebar quick navigation visible in goal workflows.
- Dashboard is reachable in one tap from detail/edit/create.

4. Error handling
- Invalid input receives actionable message.
- Network/auth failures do not trap user.

5. Responsiveness
- Key screens remain usable at common web widths and mobile portrait.

## C. Future Enhancements (Recommended)

- Add visual toast system for success/failure (non-blocking feedback).
- Add skeleton/loading placeholders for data-heavy screens.
- Add empty-state guidance with contextual CTA on each screen.
- Add telemetry for drop-off points in create/edit/deposit flows.

## Definition of Done for UX Changes

A UX change is complete only when:
- Requirement is documented.
- Acceptance criteria are testable.
- E2E scenario exists for the happy path.
- Manual checklist items pass.
- No regressions in auth-to-dashboard-to-goal core loop.
