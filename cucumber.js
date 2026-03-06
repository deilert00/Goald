module.exports = {
  default: {
    paths: ["features/**/*.feature"],
    require: ["features/support/**/*.js", "features/step_definitions/**/*.js"],
    format: ["progress-bar", "html:reports/cucumber-report.html", "json:reports/cucumber-report.json"],
    parallel: 1,
    retry: 0,
    timeout: 60000
  }
};
