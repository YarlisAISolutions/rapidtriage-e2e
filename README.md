# rapidtriage-e2e

Public end-to-end validation suite for [rapidtriage.me](https://rapidtriage.me).

These Playwright tests run against the live site and validate:
- Marketing pages (home, pricing)
- Authentication flow (login page, SSO button presence)
- Triage report API (`POST /api/triage-report`)
- MCP endpoint auth (`/mcp`, `/sse`)
- Billing endpoints (auth guards, Stripe checkout URL generation)
- Protected-page redirects
- Account pages (settings, api-keys, profile, team, reports)

## Run locally

```bash
npm install
npm run install-browsers
npm test                      # all projects
npm run test:api              # API-only (fastest)
npm run test:marketing        # home + pricing
```

## Target a different deployment

```bash
RAPIDTRIAGE_BASE_URL=https://staging.rapidtriage.me npm test
```

## Authenticated tests

Some tests require a test account and/or API token. Set these env vars before running:

```bash
export TEST_EMAIL=e2e@example.com
export TEST_PASSWORD='...'
export RAPIDTRIAGE_TEST_TOKEN='rtm_...'
npm test
```

Tests auto-skip when required credentials are absent.

## HTML report

After a run:

```bash
npm run report
```

Opens a browser with traces + screenshots for every failure.

## CI

GitHub Actions workflow runs this suite on every push to `main` and on a daily schedule against prod. See `.github/workflows/e2e.yml`.
