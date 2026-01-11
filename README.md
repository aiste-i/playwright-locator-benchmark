# Playwright Locator Robustness Study

## Overview

This project evaluates the robustness of different Playwright locator strategies (`getByRole`, `getByTestId`, `css`, `xpath`) under various DOM mutations. The study applies predefined change scenarios (attribute modifications, content changes, structural alterations) to test applications and measures how well each locator strategy handles these changes.

The goal is to determine which locator strategy is most resilient to UI changes, helping developers make informed decisions when writing maintainable test suites.

## Project Structure

```
.
├── apps/                          # Applications under test
│   ├── react/                     # TodoMVC React app (port 7002)
│   ├── angular-realworld-example-app/  # Angular RealWorld app (port 4200)
│
├── tests/                         # Playwright test suites
│   ├── TodoMVC/                   # Tests for React TodoMVC app
│   ├── RealWorld/                 # Tests for Angular RealWorld app
│
├── locators/                      # Locator strategy implementations
│   └── apps/                      # App-specific locator definitions
│       ├── todomvc.locators.ts    # TodoMVC locators for all strategies
│       ├── realworld.locators.ts  # RealWorld locators for all strategies
│
├── change-injection/              # DOM mutation system
│   ├── change-harness.ts          # Core mutation application logic
│   ├── change-operators.ts        # Mutation operators (AttributeModify, TreeInsert, etc.)
│   └── scenarios/                # Predefined change scenarios
│       ├── todomvc-scenarios.ts  # Scenarios for TodoMVC app
│       ├── realworld-scenarios.ts # Scenarios for RealWorld app
│
├── scripts/                      # Utility scripts
│   ├── run-scenarios.sh          # Run all test scenarios
│   └── analyze-enhanced.js       # Analysis with statistics
│
├── cfg/                          # Configuration
│   ├── custom-fixture.ts         # Playwright fixtures with change injection
│   └── reporter/                 # Custom Playwright reporter
│       └── reporter.ts           # BenchmarkReporter for result collection
│
├── datasets/                     # Test results
│   └── summary/                  # Aggregated analysis results
│
└── types/                        # TypeScript type definitions
    ├── change-types.ts           # Change scenario types
    └── locators.ts               # Locator strategy types
```

## How It Works

1. **Baseline Tests**: Tests run against unmodified applications to establish baseline behavior
2. **Mutation Application**: Change scenarios are applied to the DOM (e.g., removing `data-testid` attributes, changing CSS classes, restructuring HTML)
3. **Mutated Tests**: The same tests run again with mutations applied
4. **Result Analysis**: Failure rates and patterns are analyzed to compare locator strategy robustness

## Locator Strategies Evaluated

- **`getByRole`**: Uses ARIA roles and accessible names
- **`getByTestId`**: Uses `data-testid` attributes
- **`css`**: CSS selectors (classes, IDs, attributes)
- **`xpath`**: XPath expressions

## Requirements

- **Node.js**: >= 20.11.1 (required by Angular RealWorld app)
  - React TodoMVC: >= 18.13.0 ✓
  - Angular RealWorld: >= 20.11.1 ✓

## Quick Start

### 1. Install Dependencies

```bash
# Root dependencies (Playwright, TypeScript, etc.)
npm install

# React TodoMVC app
cd apps/react && npm install && cd ../..

# Angular RealWorld app
cd apps/angular-realworld-example-app && npm install && cd ../..
```

### 2. Build and Start Applications

```bash
# Build React TodoMVC
cd apps/react
npm run build
npm run serve  # Runs on http://localhost:7002

# In another terminal, start Angular RealWorld
cd apps/angular-realworld-example-app
npx ng serve  # Runs on http://localhost:4200
```

### 3. Run Tests

```bash
# Run all scenarios (baseline + mutated)
npm run scenarios

# Run only mutated scenarios (skip baseline)
npm run scenarios:skip-baseline

# Run specific locator strategies
npm run scenarios:skip-baseline -- --projects "getByRole locators,css locators"
```

### 4. Analyze Results

```bash
# Analysis with statistics
npm run analyze:enhanced
```

Results are saved in `datasets/` directory:

- `runs-*.jsonl`: Test execution results
- `mutations-*.jsonl`: Mutation application details
- `summary/`: Aggregated analysis (CSV and JSON)

## CI/CD

GitHub Actions workflow runs automatically on push/PR:

- See `.github/workflows/ci.yml` for configuration
- Results are uploaded as artifacts after each run
- See `.github/workflows/README.md` for detailed CI documentation

## Key Concepts

### Change Scenarios

Predefined sets of DOM mutations organized by:

- **Category**: `attribute`, `content`, `structure`
- **Operator**: `AttributeModify`, `AttributeDelete`, `ContentModify`, `TreeInsert`, `TreeMove`
- **Target**: CSS selectors matching elements to mutate

### Test Isolation

- Mutations are cleaned up between tests
- Tests run serially to ensure isolation
- Each scenario is applied independently

### Two-Phase Mutation Application

1. **Early phase**: Mutations targeting elements existing on page load (e.g., input fields, containers)
2. **Mid-test phase**: Mutations targeting dynamically created elements (e.g., todo items, article cards)

## Notes

- `data-testid` attributes were manually added to admin and realworld applications for testing purposes

```

```
