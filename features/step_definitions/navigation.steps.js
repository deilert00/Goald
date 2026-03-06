const assert = require("node:assert/strict");
const { Given, Then } = require("@cucumber/cucumber");

Given("I open the application home page", async function () {
  await this.page.goto(this.baseUrl, { waitUntil: "domcontentloaded" });
});

Then("the page title should include {string}", async function (expectedTitlePart) {
  const title = await this.page.title();
  assert.match(
    title.toLowerCase(),
    new RegExp(expectedTitlePart.toLowerCase()),
    `Expected page title to include \"${expectedTitlePart}\" but found \"${title}\"`
  );
});
