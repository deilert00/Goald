Feature: Visual compounding app core flows
  To keep new product behavior safe during refactors
  As a maintainer
  I want smoke coverage for auth, dashboard controls, and goal detail interactions

  Scenario: Login screen renders expected fields
    Given I open the app entry page
    Then I should see text "Goald"
    And I should see placeholder "Email"
    And I should see placeholder "Password"

  Scenario: User can navigate to register screen
    Given I open the app entry page
    When I tap text "Don't have an account? Register"
    Then I should see text "Create your account"
    And I should see text "Create Account"

  Scenario: Dashboard filter controls are available for authenticated users
    Given I open the app entry page
    And I am on the dashboard if authenticated
    Then I should see dashboard filter controls

  Scenario: Goal detail supports deposit search when a goal is open
    Given I open the app entry page
    And I open a goal detail view if available
    Then I should see deposit search input
