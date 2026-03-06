Feature: Home page behavior
  To verify the app is available end-to-end
  As a team maintaining release quality
  I want smoke scenarios that assert user-visible behavior

  Scenario: Home page title is correct
    Given I open the application home page
    Then the page title should include "Goald"
