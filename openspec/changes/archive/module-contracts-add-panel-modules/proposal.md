# Proposal: register reminders, saved-ideas, admin as modules

## Why

Three more modules were just specced (`reminders-module`, `saved-ideas-module`, `admin-platform-panel`). Same rule as last time: the shared module table/dependency diagram gets its own small, fast-merged change.

## In scope

- Add `packages/reminders`, `packages/saved-ideas`, `packages/admin` to the module table
- Extend the dependency diagram
- Note `convex` now owns two crons (reminders, metrics aggregation) and a `job_runs` write path

## Out of scope

Everything else.
