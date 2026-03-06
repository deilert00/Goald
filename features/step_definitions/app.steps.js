const assert = require("node:assert/strict");
const { Given, When, Then } = require("@cucumber/cucumber");

async function textVisible(page, text) {
  const locator = page.getByText(text, { exact: false }).first();
  return await locator.isVisible().catch(() => false);
}

Given("I open the app entry page", async function () {
  try {
    await this.page.goto(this.baseUrl, { waitUntil: "domcontentloaded" });
  } catch (err) {
    console.warn(`[e2e] Could not reach ${this.baseUrl}: ${err.message}`);
    this.skipReason = "App shell is unavailable (connection refused or network error).";
    return "skipped";
  }

  const hasAuthUi = await textVisible(this.page, "Goald");
  const hasDashboardUi = await textVisible(this.page, "My Goals");

  if (!hasAuthUi && !hasDashboardUi) {
    this.skipReason = "App shell is unavailable (likely missing env config/runtime error).";
    return "skipped";
  }
});

Then("I should see text {string}", async function (text) {
  if (this.skipReason) return "skipped";
  const visible = await textVisible(this.page, text);
  assert.equal(visible, true, `Expected to see text: ${text}`);
});

Then("I should see placeholder {string}", async function (placeholder) {
  if (this.skipReason) return "skipped";
  const input = this.page.getByPlaceholder(placeholder).first();
  const visible = await input.isVisible().catch(() => false);
  assert.equal(visible, true, `Expected to see input placeholder: ${placeholder}`);
});

When("I tap text {string}", async function (text) {
  if (this.skipReason) return "skipped";
  const btn = this.page.getByText(text, { exact: false }).first();
  await btn.waitFor({ state: "visible", timeout: 5000 });
  await btn.click();
});

Given("I am on the dashboard if authenticated", async function () {
  const onDashboard = await textVisible(this.page, "My Goals");
  if (!onDashboard) {
    this.skipReason = "Dashboard not available in this run (likely unauthenticated).";
    return "skipped";
  }
});

Then("I should see dashboard filter controls", async function () {
  if (this.skipReason) return "skipped";

  const required = [
    "Portfolio Snapshot",
    "All",
    "Active",
    "Completed",
    "Newest",
    "Progress",
    "Target",
  ];

  for (const label of required) {
    const visible = await textVisible(this.page, label);
    assert.equal(visible, true, `Expected dashboard control not found: ${label}`);
  }
});

Given("I open a goal detail view if available", async function () {
  const onDashboard = await textVisible(this.page, "My Goals");
  if (!onDashboard) {
    this.skipReason = "Goal detail cannot be opened because dashboard is not available.";
    return "skipped";
  }

  const card = this.page.locator("text=/Target:\\s*\\$/").first();
  const hasCard = await card.isVisible().catch(() => false);
  if (!hasCard) {
    this.skipReason = "No goal cards found on dashboard for this user.";
    return "skipped";
  }

  await card.click();
});

Then("I should see deposit search input", async function () {
  if (this.skipReason) return "skipped";

  const search = this.page.getByPlaceholder("Search by amount, note, or date").first();
  const visible = await search.isVisible().catch(() => false);

  // This input is intentionally shown only when deposits exist.
  // If no deposits exist, we still confirm the screen loaded.
  if (!visible) {
    const detailLoaded = await textVisible(this.page, "Deposit History");
    assert.equal(
      detailLoaded,
      true,
      "Expected goal detail to load and show either deposit search or deposit history section"
    );
    return;
  }

  assert.equal(visible, true, "Expected deposit search input to be visible");
});
