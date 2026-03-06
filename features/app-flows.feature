Feature: Visual compounding app core flows
  To keep new product behavior safe during refactors
  As a maintainer
  I want smoke coverage for auth, dashboard controls, and goal detail interactions

  Scenario: Dashboard is visible in E2E mode
    Given I open the app entry page
    Then I should see text "My Goals"
    And I should see text "Portfolio Snapshot"

  Scenario: Dashboard filter controls are available
    Given I open the app entry page
    Then I should see dashboard filter controls

  Scenario: User can open goal detail and use deposit search
    Given I open the app entry page
    When I open the seeded goal detail view
    Then I should see deposit search input
    And I should see text "Freelance payout"

  Scenario: User can edit seeded goal name
    Given I open the app entry page
    When I open the seeded goal detail view
    And I tap text "Edit Goal"
    And I fill "e.g. Emergency Fund" with "E2E House Fund Updated"
    And I tap text "Save Changes"
    Then I should see text "E2E House Fund Updated"

  Scenario: User can record a deposit note
    Given I open the app entry page
    When I open the seeded goal detail view
    And I tap text "+ Add Deposit"
    And I fill "100" with "75"
    And I fill "e.g. Freelance payout" with "E2E test note"
    And I tap text "Record Deposit"
    Then I should see text "E2E test note"
