# Proposal: saved ideas (swipe-to-save)

## Why

`apps/mobile/src/components/explore/swipe-deck.tsx` and `src/data/panel.ts`'s `SAVED_IDEAS` already implement a swipe-right-to-save interaction with no backend behind it yet. `docs/backend/endpoints.md` assumed this was already specced — it wasn't. This closes that gap.

## In scope

- New module `packages/saved-ideas`: bookmark a repository (someone else's) to revisit/claim later
- `savedIdeas.toggle`, `savedIdeas.listMine`

## Out of scope

- `packages/auth`, `packages/github` — untouched
- Any recommendation/ranking logic on top of saved ideas

## Success

A signed-in user can save/unsave a repository from the explore swipe deck, and see their saved list in Panel 1.
