# Phase 1 Progress — App Shell + Specialties

Plan: docs/superpowers/plans/2026-08-26-phase1-shell-and-specialties.md
Branch: phase1-shell-specialties

- Task 1: complete (commits 17c4b29..1915390, review clean)
- Task 2: complete (commits 1915390..129522a, review clean)
- Task 3: complete (commits 129522a..850621d, review clean)
- Task 4: pending — app shell (layout/router/providers)
- Task 5: pending — specialties API + hooks
- Task 6: pending — specialties list page
- Task 7: pending — specialty form modal
- Task 8: pending — README

## Notes
- React Query v5 installed → use placeholderData (not keepPreviousData:true); isPending is correct.
- antd resolved to v6, react-router-dom v7 — later tasks must use those majors (e.g. Modal destroyOnClose->destroyOnHidden in antd6).
- Minor findings ledger (for final review):
  - Task 1: @types/react[-dom] devDeps present in JS-only project (create-vite cruft); oxlint script/dep unused. Trim in cleanup.
