---
description: Orients a new agent with full project context
---

# Prime

Get fully oriented before doing any work.

## Steps

1. Read `PROJECT.md` — understand what the app is and its current state
2. Check `dev/` — note any active plans
3. Check for `.env.local` or `.env` at the repo root. If neither is present, flag it and ask before proceeding

## Output

A short summary covering:

- **What the project is** — one sentence
- **Current state** — what's built, anything notable
- **Active plans** — what's in `dev/`, if anything
- **Missing credentials** — flag if env files are absent
- **Ready** — confirm you have enough context to start work
