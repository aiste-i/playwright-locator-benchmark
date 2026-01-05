# CI Workflow Documentation

## Overview

The CI workflow runs locator robustness tests across multiple strategies (getByRole, getByTestId, css, xpath) for different applications (TodoMVC React, Angular RealWorld).

## Workflow Steps

1. **Setup**: Installs Node.js 20.11.1 and caches npm dependencies
2. **App Dependencies**: Installs dependencies for React TodoMVC and Angular RealWorld apps
3. **Build**: Builds the React TodoMVC app (Angular uses `ng serve` which builds automatically)
4. **Start Apps**:
   - React TodoMVC on port 7002
   - Angular RealWorld on port 4200
5. **Health Check**: Waits up to 3 minutes for both apps to be ready
6. **Install Playwright**: Installs Chromium browser and dependencies
7. **Run Tests**: Executes all test scenarios (baseline + mutated) using `npm run scenarios`
8. **Analysis**: Runs analysis scripts to generate aggregated results
9. **Artifacts**: Uploads test results and analysis to GitHub Actions artifacts

## Artifacts

After each run, the following artifacts are available for download:

- **test-results**: Contains:
  - `datasets/` - Raw test results (JSONL files)
  - `playwright-report/` - HTML test report
  - `results-summary.md` - Summary of the test run

- **analysis-results**: Contains:
  - `datasets/summary/` - Aggregated analysis results (CSV and JSON files)

## Accessing Results

1. Go to the Actions tab in your GitHub repository
2. Click on the workflow run you want to view
3. Scroll down to the "Artifacts" section
4. Download the artifacts you need

## Environment Variables

- `TODOMVC_URL`: URL for the TodoMVC app (default: http://localhost:7002/)
- `REALWORLD_URL`: URL for the RealWorld app (default: http://localhost:4200/)
- `CI`: Set to `true` to enable CI mode in Playwright

## Timeout

The workflow has a 60-minute timeout to accommodate:

- App startup time
- Test execution across all scenarios
- Analysis script execution
