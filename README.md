# HealthConnect Frontend

React admin UI for the HealthConnect Spring Boot API.

## Stack
Vite · React (JS) · Ant Design · TanStack Query · Axios · React Router

## Prerequisites
- Node 18+
- Backend running on http://localhost:8080

## Getting started
    npm install
    npm run dev
Open http://localhost:5173. The dev server proxies `/api` to the backend on `:8080`.

## Scripts
- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run preview` — preview the production build

## Structure
- `src/api` — shared Axios client
- `src/app` — App root, router, query client
- `src/components/layout` — app shell
- `src/features/<module>` — one folder per feature (API, hooks, screens)
- `src/constants`, `src/utils` — shared helpers

## Modules
- [x] Specialties
- [ ] Patients
- [ ] Doctors
- [ ] Doctor availability + specialty assignment
- [ ] Appointments
