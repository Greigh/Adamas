# Running Tests

This project uses Jest for unit tests and Playwright for E2E tests.

## Prerequisites
- Node.js 18+ (LTS)
- npm

## Install dependencies

```bash
npm ci
```

## Run unit tests (Jest)

```bash
npm test
```

This runs Jest and will include both unit tests and e2e tests that use Playwright.

## Running only E2E tests

You can run the e2e tests that rely on Playwright by first installing Chrome browsers, then running the e2e script.

```bash
# install playwright browsers
npx playwright install --with-deps

# build the project
npm run build:webpack

# run the e2e harness
npm run test:e2e
```

## CI

A GitHub Actions workflow is included at `.github/workflows/ci.yml` which runs `npm ci`, builds, runs Jest unit tests, installs Playwright browsers, and runs `npm run test:e2e`.

## Notes
- If you're running tests locally, some tests are headless and rely on an HTTP server. The e2e harness starts a simple HTTP server for `dist` (built files) or uses raw `src/index.html` for specific tests.
- The E2E test added asserts that the "Open Settings" gear buttons on the main page open the settings view and scroll to the target section.
