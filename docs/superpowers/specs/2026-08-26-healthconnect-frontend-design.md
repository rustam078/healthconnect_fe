# HealthConnect Frontend — Design

**Date:** 2026-08-26
**Status:** Approved (pending user spec review)
**Location:** `D:\HMS\healtconnectfe` (sibling to the Spring Boot backend at `D:\HMS\healthconnect`)

## 1. Goal

Build an enterprise-grade React admin application that consumes the HealthConnect
Spring Boot REST API. The app is delivered **module by module** so each vertical
slice can be reviewed before the next begins. Spring Security / auth will be added
later; the API client is structured so a JWT header can be slotted in without
rework.

## 2. Tech stack

| Concern | Choice | Notes |
|---|---|---|
| Language | JavaScript (ES modules) | No TypeScript |
| Build tool | Vite | React + JS template |
| UI components | Ant Design (`antd`) + `@ant-design/icons` | Enterprise admin look, rich Table/Form/DatePicker/Pagination |
| Server state | TanStack Query (`@tanstack/react-query`) | Caching, loading/error, pagination, refetch |
| HTTP client | Axios (single configured instance) | Base URL + interceptors |
| Routing | React Router (`react-router-dom`) | |
| Forms | Ant Design `Form` | Built-in validation |
| Feedback | Ant Design `App` message/notification | Global toasts |

## 3. Backend integration

- **Base API path:** `/api/v1` (backend runs on `http://localhost:8080`).
- **Dev connectivity:** Vite dev-server **proxy** forwards `/api` → `http://localhost:8080`.
  This avoids any CORS configuration on the backend while it is still in progress.
- **Response envelope:** the backend wraps responses in `ApiResponse`
  (`{ success, message, data, errors }`). An Axios **response interceptor** unwraps
  `data` for success and surfaces `message` on error, so feature code works with
  plain payloads.
- **Auth (future):** an Axios **request interceptor** stub is included where the
  `Authorization: Bearer <token>` header will be added once Spring Security lands.
- **Paged endpoints** return a Spring `Page` (`content`, `totalElements`,
  `number`, `size`); the shared table wiring reads these fields.

## 4. Folder structure (feature-based)

```
healtconnectfe/
├── vite.config.js              # React plugin + /api proxy to :8080
├── package.json
├── index.html
└── src/
    ├── main.jsx                # entry
    ├── api/
    │   └── axiosClient.js       # baseURL, response-unwrap + auth-stub interceptors
    ├── app/
    │   ├── App.jsx              # QueryClientProvider + Antd App + RouterProvider
    │   ├── router.jsx           # route table
    │   └── queryClient.js       # QueryClient config
    ├── components/
    │   ├── layout/
    │   │   └── AppLayout.jsx     # Sider + Header + Content
    │   └── common/              # PageHeader, DeleteConfirm, etc. (added as needed)
    ├── features/
    │   ├── dashboard/
    │   │   └── DashboardPage.jsx # placeholder landing page
    │   ├── specialties/          # ← first CRUD module
    │   │   ├── specialtiesApi.js
    │   │   ├── specialtiesHooks.js
    │   │   ├── SpecialtyListPage.jsx
    │   │   ├── SpecialtyFormModal.jsx
    │   │   └── specialtyColumns.jsx
    │   ├── patients/            # later
    │   ├── doctors/             # later
    │   ├── availability/        # later
    │   └── appointments/        # later (waits on backend)
    ├── constants/
    │   └── enums.js             # Gender, BloodGroup, AppointmentStatus, DayOfWeek
    └── utils/
        └── format.js           # date / currency formatting helpers
```

Each `features/<module>/` folder is self-contained (its own API calls, React Query
hooks, and screens) so a review is reading one folder.

## 5. App shell (built first)

- **`AppLayout`** — collapsible Ant `Menu` sidebar (Dashboard, Patients, Doctors,
  Specialties, Appointments), a top header with the app title and a placeholder
  user area, and a content region that renders the active route.
- **`axiosClient`** — `baseURL: '/api/v1'`, response interceptor to unwrap
  `ApiResponse`, request interceptor stub for the future JWT header.
- **`queryClient`** — sensible defaults (retry off for 4xx, stale time).
- **`DashboardPage`** — simple placeholder so the shell has a landing route.

## 6. Module pattern (Specialties as the template)

Maps to the Specialty endpoints:

- **List** — Ant `Table`, server-side pagination + search box
  (`GET /specialties?search=&page=&size=`), default sort by name asc.
- **Create / Edit** — modal with Ant `Form`
  (`POST /specialties`, `PUT /specialties/{id}`). The edit form sends **name +
  description**; note the current backend `updateSpeciality` only updates
  description and rejects a null description (backend review finding #5) — the
  frontend is built correctly for the fixed behavior.
- **Delete** — `Popconfirm` → `DELETE /specialties/{id}` → refetch.

Every later module reuses this pattern.

## 7. Delivery order (module by module, review between each)

1. **App shell** — layout, router, axios client, query client, dashboard placeholder.
2. **Specialties** — full CRUD (the template).
3. **Patients** — create, paged search + filters (search, firstName, gender,
   bloodGroup), edit, delete.
4. **Doctors** — create, filter search (qualification, gender, fee/experience
   ranges), edit, delete.
5. **Doctor Availability + Specialty assignment** — a doctor detail page hosting
   weekly availability CRUD and specialty assign/remove.
6. **Appointments** — booking form; built last, after the backend module is ready.

## 8. Out of scope (for now)

- Authentication / Spring Security integration (client is structured for it).
- Real dashboard analytics (placeholder only).
- Dark mode, i18n, testing harness — can be added later if wanted.

## 9. Known backend issues the frontend must tolerate

From the prior backend review, the frontend will be built to degrade gracefully
around these until they are fixed:

- Specialty update only changes description (#5).
- Availability endpoint returns 500 instead of 404/400 on errors (#3).
- `GET /doctors/details/{id}` returns 201 instead of 200 (#4) — client treats any
  2xx as success.
- `PatientResponse` has no numeric `id` (#7) — patient row actions key off what the
  API returns; revisit once the backend exposes `id`.
