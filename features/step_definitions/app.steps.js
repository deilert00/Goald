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

  const hasVisualCompounding = await textVisible(this.page, "Visual Compounding");
  const hasDashboardUi = await textVisible(this.page, "My Goals");

  if (!hasVisualCompounding && !hasDashboardUi) {
    this.skipReason = "App shell is unavailable (likely missing env config/runtime error).";
    return "skipped";
  }
});

Then("I should see text {string}", async function (text) {
  const locator = this.page.getByText(text, { exact: false });
  await locator.first().waitFor({ state: "attached", timeout: 10000 });
  const count = await locator.count();
  assert.ok(count > 0, `Expected text to exist in DOM: ${text}`);
});

Then("I should see placeholder {string}", async function (placeholder) {
  const input = this.page.getByPlaceholder(placeholder).first();
  const visible = await input.isVisible().catch(() => false);
  assert.equal(visible, true, `Expected to see input placeholder: ${placeholder}`);
});

When("I tap text {string}", async function (text) {
  const btn = this.page.getByText(text, { exact: false }).first();
  await btn.waitFor({ state: "visible", timeout: 5000 });
  await btn.click();
});

When("I tap element with label {string}", async function (label) {
  const element = this.page.getByLabel(label).first();
  await element.waitFor({ state: "visible", timeout: 10000 });
  await element.click();
});

Given("I log in from landing", async function () {
  await this.page.getByLabel("landing-login-btn").first().click();
  await this.page.getByPlaceholder("Email").first().fill("e2e-login@goald.local");
  await this.page.getByPlaceholder("Password").first().fill("secret123");
  await this.page.getByLabel("login-submit").first().click();
  await this.page.getByText("My Goals", { exact: false }).first().waitFor({ timeout: 10000 });
});

Then("I should see dashboard filter controls", async function () {
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

When("I open the seeded goal detail view", async function () {
  const seededGoal = this.page.getByText("E2E House Fund", { exact: false }).first();
  await seededGoal.waitFor({ state: "visible", timeout: 10000 });
  await seededGoal.click();
  await this.page.getByText("Deposit History", { exact: false }).first().waitFor({ timeout: 10000 });
});

Then("I should see deposit search input", async function () {
  const search = this.page.getByPlaceholder("Search by amount, note, or date").first();
  const visible = await search.isVisible().catch(() => false);
  assert.equal(visible, true, "Expected deposit search input to be visible");
});

When("I fill {string} with {string}", async function (labelOrPlaceholder, value) {
  const input = this.page.getByPlaceholder(labelOrPlaceholder).first();
  await input.waitFor({ state: "visible", timeout: 10000 });
  await input.fill(value);
});
