# Tasks: github-app-connector

## 1. Package API

- [x] 1.1 Four public functions matching CONTRACT.md / endpoints.md §4.4
- [x] 1.2 Installation URL includes caller `state`
- [x] 1.3 Ownership reject when installation is linked to another user
- [x] 1.4 Candidate mapping `origin: github`, `bucket: unpublished_draft`, no autopsy fields
- [x] 1.5 Signed webhook handling at the package boundary
- [x] 1.6 Disconnect does not claim to delete cemetery data

## 2. Tests (this PR)

- [x] 2.1 Package-local Node tests with a fake store (no live GitHub App)
- [x] 2.2 Cover status, start URL, not-connected list, ownership reject, mapping, missing webhook signature

## 3. Explicitly not this PR

- [ ] 3.1 Convex `httpAction /github/setup` and `/github/webhook` (blocked: open PR #1 owns `convex/http.ts`)
- [ ] 3.2 `repositories.importFromCandidate` / `POST /ideas/import`
- [ ] 3.3 Playwright / Expo GitHub connect UI
- [ ] 3.4 Creating the GitHub App and putting secrets on a Convex deployment
