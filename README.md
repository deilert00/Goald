# Goald

Behavior-based end-to-end (E2E) testing setup using:

- Cucumber (Gherkin scenarios)
- Playwright (browser automation)
- GitHub Actions (CI execution + report artifact)

## What Was Added

- `features/healthcheck.feature`: Example user-visible smoke behavior
- `features/step_definitions/navigation.steps.js`: Step definitions
- `features/support/world.js`: Shared test world/context
- `features/support/hooks.js`: Browser lifecycle hooks
- `cucumber.js`: Cucumber runner configuration
- `.github/workflows/e2e-bdd.yml`: CI pipeline for E2E BDD tests
- `.github/ISSUE_TEMPLATE/e2e-bdd-testing.md`: GitHub issue template for BDD requests

## Local Execution

1. Install dependencies:

```bash
npm ci
```

2. Install Playwright browser:

```bash
npx playwright install chromium
```

3. Run tests headless:

```bash
npm run test:e2e
```

4. Run tests headed (useful for debugging):

```bash
npm run test:e2e:headed
```

## Environment Variables

- `BASE_URL` (default: `http://localhost:3000`)
- `HEADLESS` (default: `true`; set `false` for visible browser)

PowerShell example:

```powershell
$env:BASE_URL="http://localhost:3000"; npm run test:e2e
```

## CI Behavior

Workflow file: `.github/workflows/e2e-bdd.yml`

- Runs on push and pull request
- Installs dependencies and Playwright Chromium
- Executes BDD suite
- Uploads `reports/` as build artifact

## Creating A GitHub Issue For E2E BDD

Use the provided issue template:

- `.github/ISSUE_TEMPLATE/e2e-bdd-testing.md`

It includes:

- Behavior description in Gherkin format
- Scope and environment details
- Acceptance criteria and definition of done

## Next Step

Update `features/healthcheck.feature` to match your real user flows and expected behavior, then use the issue template to track each behavior scenario end-to-end.