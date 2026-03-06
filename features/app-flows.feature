Feature: Visual compounding app core flows
  To keep new product behavior safe during refactors
  As a maintainer
  I want smoke coverage for landing, account creation, login, and core goal interactions

  Scenario: Landing page shows product information and auth actions
    Given I open the app entry page
    Then I should see text "Visual Compounding"
    And I should see text "Save with momentum, not just math."
    And I should see text "Create Account"
    And I should see text "Log In"

  Scenario: User can create account from landing page
    Given I open the app entry page
    When I tap element with label "landing-register-btn"
    And I fill "Email" with "e2e-register@goald.local"
    And I fill "Password (min 6 characters)" with "secret123"
    And I tap element with label "register-submit"
    Then I should see text "My Goals"

  Scenario: User can log in from landing page
    Given I open the app entry page
    When I tap element with label "landing-login-btn"
    And I fill "Email" with "e2e-login@goald.local"
    And I fill "Password" with "secret123"
    And I tap element with label "login-submit"
    Then I should see text "My Goals"

  Scenario: Dashboard filter controls are available after login
    Given I open the app entry page
    And I log in from landing
    Then I should see dashboard filter controls

  Scenario: User can open goal detail and use deposit search after login
    Given I open the app entry page
    And I log in from landing
    When I open the seeded goal detail view
    Then I should see deposit search input
    And I should see text "Freelance payout"

  Scenario: User can edit seeded goal name after login
    Given I open the app entry page
    And I log in from landing
    When I open the seeded goal detail view
    And I tap text "Edit Goal"
    And I fill "e.g. Emergency Fund" with "E2E House Fund Updated"
    And I tap text "Save Changes"
    Then I should see text "E2E House Fund Updated"

  Scenario: User can record a deposit note after login
    Given I open the app entry page
    And I log in from landing
    When I open the seeded goal detail view
    And I tap text "+ Add Deposit"
    And I fill "100" with "75"
    And I fill "e.g. Freelance payout" with "E2E test note"
    And I tap text "Record Deposit"
    Then I should see text "E2E test note"

  Scenario: User creates a goal and returns via sidebar navigation
    Given I open the app entry page
    And I log in from landing
    When I tap element with label "dashboard-create-goal"
    And I fill "e.g. Emergency Fund" with "UX Flow Goal"
    And I fill "10000" with "6000"
    And I fill "500" with "400"
    And I tap element with label "create-goal-submit"
    Then I should see text "UX Flow Goal"
    When I tap element with label "sidebar-dashboard"
    Then I should see text "Portfolio Snapshot"
